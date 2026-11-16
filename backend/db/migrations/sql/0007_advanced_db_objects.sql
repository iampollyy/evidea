-- Indexes for the main query paths.
-- Latest vital signs of a patient: the index also serves plain lookups by patient_id.
CREATE INDEX idx_vital_signs_patient_created ON vital_signs (patient_id, created_at DESC);
DROP INDEX idx_vital_signs_patient_id;

-- Patient lab history in collection order; also serves plain lookups by patient_id.
CREATE INDEX idx_lab_reports_patient_collected ON lab_reports (patient_id, collected DESC);
DROP INDEX idx_lab_reports_patient_id;

-- Worker queue: only open runs are indexed, completed runs do not grow the index.
CREATE INDEX idx_prediction_runs_open ON prediction_runs (status)
    WHERE status IN ('pending', 'processing');

-- User-defined functions.
CREATE OR REPLACE FUNCTION patient_age_years(p_birth_date DATE, p_on DATE DEFAULT CURRENT_DATE)
RETURNS INT
LANGUAGE sql STABLE AS $$
    SELECT date_part('year', age(p_on, p_birth_date))::INT
$$;

CREATE OR REPLACE FUNCTION mask_name(p_value TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE WHEN p_value IS NULL THEN NULL
                ELSE left(p_value, 1) || repeat('*', greatest(length(p_value) - 1, 0)) END
$$;

CREATE OR REPLACE FUNCTION mask_email(p_value TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE WHEN p_value IS NULL THEN NULL
                ELSE left(p_value, 1) || '***@' || split_part(p_value, '@', 2) END
$$;

CREATE OR REPLACE FUNCTION mask_phone(p_value TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE WHEN p_value IS NULL THEN NULL
                ELSE repeat('*', greatest(length(p_value) - 2, 0)) || right(p_value, 2) END
$$;

-- Masked view of active patients for analytics and exports.
-- Exposes age instead of birth date, because the exact date is a quasi-identifier.
CREATE VIEW v_patients_masked WITH (security_barrier = true) AS
SELECT patient_id,
       mask_name(name)          AS name,
       mask_name(surname)       AS surname,
       patient_age_years(birth_date) AS age_years,
       sex,
       mask_email(email)        AS email,
       mask_phone(phone_number) AS phone_number,
       created_at
FROM patients
WHERE deleted_at IS NULL;

-- Top-1 hypothesis of the latest completed prediction run for each case.
CREATE VIEW v_case_latest_prediction AS
SELECT DISTINCT ON (pr.case_id)
       pr.case_id,
       pr.prediction_run_id,
       pr.completed_at,
       d.name  AS top_disease,
       dh.score AS top_score
FROM prediction_runs pr
JOIN disease_hypotheses dh
    ON dh.prediction_run_id = pr.prediction_run_id AND dh.rank = 1
JOIN diseases d
    ON d.disease_id = dh.disease_id
WHERE pr.status = 'completed'
ORDER BY pr.case_id, pr.completed_at DESC NULLS LAST, pr.prediction_run_id;

-- Dashboard aggregate: runs per model, day and status. Refreshed on a schedule.
CREATE MATERIALIZED VIEW mv_model_run_stats AS
SELECT mv.model_version_id,
       mv.version,
       date_trunc('day', pr.started_at) AS run_day,
       pr.status,
       count(DISTINCT pr.prediction_run_id)            AS runs,
       avg(dh.score) FILTER (WHERE dh.rank = 1)        AS avg_top1_score
FROM prediction_runs pr
JOIN model_versions mv ON mv.model_version_id = pr.model_version_id
LEFT JOIN disease_hypotheses dh ON dh.prediction_run_id = pr.prediction_run_id
WHERE pr.started_at IS NOT NULL
GROUP BY mv.model_version_id, mv.version, date_trunc('day', pr.started_at), pr.status;

-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY (readers are not blocked during refresh).
CREATE UNIQUE INDEX uq_mv_model_run_stats ON mv_model_run_stats (model_version_id, run_day, status);

-- Right to erasure: removes personal data but keeps the row, so cases and runs stay linked.
-- Free-text fields of case_anamneses are not changed by this procedure.
CREATE OR REPLACE PROCEDURE anonymize_patient(p_patient_id UUID)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE patients
    SET name         = 'ANONYMIZED',
        surname      = 'ANONYMIZED',
        email        = 'anon-' || patient_id || '@anonymized.invalid',
        phone_number = NULL,
        birth_date   = date_trunc('year', birth_date)::DATE,
        deleted_at   = COALESCE(deleted_at, now())
    WHERE patient_id = p_patient_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'patient % not found', p_patient_id USING ERRCODE = 'no_data_found';
    END IF;
END;
$$;

-- Business rule: prediction run status moves only forward; timestamps are set automatically.
CREATE OR REPLACE FUNCTION check_prediction_run_transition()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT (
        (OLD.status = 'pending' AND NEW.status IN ('processing', 'failed', 'unsupported'))
        OR (OLD.status = 'processing' AND NEW.status IN ('completed', 'failed'))
    ) THEN
        RAISE EXCEPTION 'prediction run % cannot change status from % to %',
            OLD.prediction_run_id, OLD.status, NEW.status
            USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.status = 'processing' AND NEW.started_at IS NULL THEN
        NEW.started_at := now();
    END IF;
    IF NEW.status IN ('completed', 'failed', 'unsupported') AND NEW.completed_at IS NULL THEN
        NEW.completed_at := now();
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prediction_runs_status_transition
    BEFORE UPDATE OF status ON prediction_runs
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION check_prediction_run_transition();
