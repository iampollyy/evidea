-- Negative tests for constraints, triggers and foreign keys.
-- Runs inside one transaction that is rolled back at the end, so the database stays unchanged.
-- Each case must fail with the expected SQLSTATE; a wrong error code (for example NOT NULL
-- violation instead of CHECK violation) is reported as a failure.
-- Usage (after migrations and dev seed):
--   psql -v ON_ERROR_STOP=1 -f backend/db/tests/constraints_test.sql

BEGIN;

-- Extra fixtures, rolled back at the end.
INSERT INTO patients (patient_id, name, surname, birth_date, sex, email, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000199', 'Second', 'Patient', DATE '1990-01-01', 'female',
        'patient2.test@example.test', DATE '2025-02-01', TIMESTAMPTZ '2025-02-01 10:00+00');

INSERT INTO vital_signs (vital_sign_id, patient_id, systolic_bp_mmhg, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000499', '00000000-0000-0000-0000-000000000199', 120,
        TIMESTAMPTZ '2025-02-01 10:00+00', TIMESTAMPTZ '2025-02-01 10:00+00');

INSERT INTO prediction_runs (prediction_run_id, initiated_by, case_id, model_version_id, status, started_at)
VALUES ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000001001',
        'completed', TIMESTAMPTZ '2025-02-01 11:00+00');

INSERT INTO disease_hypotheses (hypothesis_id, prediction_run_id, disease_id, rank, score)
VALUES ('00000000-0000-0000-0000-000000000911', '00000000-0000-0000-0000-000000000901',
        '00000000-0000-0000-0000-000000001101', 1, 0.9);

CREATE TEMP TABLE test_results (label TEXT, ok BOOLEAN, detail TEXT) ON COMMIT PRESERVE ROWS;

CREATE OR REPLACE FUNCTION pg_temp.expect_sqlstate(label TEXT, stmt TEXT, expected TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    got TEXT;
BEGIN
    BEGIN
        EXECUTE stmt;
        INSERT INTO test_results VALUES (label, FALSE, 'statement succeeded, expected ' || expected);
        RETURN;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS got = RETURNED_SQLSTATE;
    END;
    INSERT INTO test_results
        VALUES (label, got = expected, 'got SQLSTATE ' || got || ', expected ' || expected);
END;
$$;

-- Vital signs ranges (DQ-21, DQ-08)
SELECT pg_temp.expect_sqlstate('vital: systolic out of range',
    $s$INSERT INTO vital_signs (patient_id, systolic_bp_mmhg, created_at, updated_at)
       VALUES ('00000000-0000-0000-0000-000000000101', 500, now(), now())$s$, '23514');
SELECT pg_temp.expect_sqlstate('vital: spo2 above 100',
    $s$INSERT INTO vital_signs (patient_id, spo2_percent, created_at, updated_at)
       VALUES ('00000000-0000-0000-0000-000000000101', 101, now(), now())$s$, '23514');

-- Patient sex values
SELECT pg_temp.expect_sqlstate('patient: invalid sex',
    $s$INSERT INTO patients (name, surname, birth_date, sex, email, created_at, updated_at)
       VALUES ('A', 'B', DATE '2000-01-01', 'robot', 'x@example.test', now(), now())$s$, '23514');

-- Email uniqueness is case-insensitive
SELECT pg_temp.expect_sqlstate('doctor: duplicate email in other case',
    $s$INSERT INTO doctors_and_admin (name, surname, email, role, password_hash, created_at)
       SELECT 'Dup', 'User', 'DEV.CLINICIAN@example.test', role_id, 'x', DATE '2025-01-01'
       FROM roles WHERE role_name = 'clinician'$s$, '23505');

-- Anamnesis must belong to the same patient as its case (composite FK)
SELECT pg_temp.expect_sqlstate('anamnesis: patient does not match case',
    $s$INSERT INTO case_anamneses (patient_id, case_id, created_by_id, chief_complaint, created_at, updated_at)
       VALUES ('00000000-0000-0000-0000-000000000199', '00000000-0000-0000-0000-000000000201',
               '00000000-0000-0000-0000-000000000001', 'x', now(), now())$s$, '23503');

-- Case vital signs must reference the patient's own vitals (composite FK)
SELECT pg_temp.expect_sqlstate('case_vital_signs: vitals belong to another patient',
    $s$INSERT INTO case_vital_signs (vital_sign_id, case_id, patient_id, created_at)
       VALUES ('00000000-0000-0000-0000-000000000499', '00000000-0000-0000-0000-000000000201',
               '00000000-0000-0000-0000-000000000101', now())$s$, '23503');

-- Lab results: analyte must belong to the report's panel (trigger)
SELECT pg_temp.expect_sqlstate('lab item: analyte from another panel',
    $s$INSERT INTO lab_results_items (report_id, analyte_id, numeric_val)
       VALUES ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000701', 13.5)$s$, '23514');

-- Lab results: numeric analyte requires numeric_val (trigger)
SELECT pg_temp.expect_sqlstate('lab item: numeric analyte with text only',
    $s$INSERT INTO lab_results_items (report_id, analyte_id, text_val)
       VALUES ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000702', 'high')$s$, '23514');

-- Lab results: a report cannot have two results for the same analyte
SELECT pg_temp.expect_sqlstate('lab item: duplicate analyte in report',
    $s$INSERT INTO lab_results_items (report_id, analyte_id, numeric_val)
       VALUES ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000702', 1.0)$s$, '23505');

-- Lab report collected date must not be after entry time
SELECT pg_temp.expect_sqlstate('lab report: collected after entry',
    $s$INSERT INTO lab_reports (patient_id, panel_id, collected, created_at)
       VALUES ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000602',
               TIMESTAMPTZ '2025-03-01 00:00+00', TIMESTAMPTZ '2025-02-01 00:00+00')$s$, '23514');

-- ML: only one active model version
SELECT pg_temp.expect_sqlstate('model_versions: second active model',
    $s$INSERT INTO model_versions (name, version, artifact_uri, trained_at, is_active)
       VALUES ('m2', '0.0.2', 'file:///x', now(), TRUE)$s$, '23505');

-- ML: rank must be unique within a prediction run (DQ-06)
SELECT pg_temp.expect_sqlstate('disease_hypotheses: duplicate rank in run',
    $s$INSERT INTO disease_hypotheses (prediction_run_id, disease_id, rank, score)
       VALUES ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000001101', 1, 0.5)$s$, '23505');

-- ML: unknown run status
SELECT pg_temp.expect_sqlstate('prediction_runs: invalid status',
    $s$INSERT INTO prediction_runs (initiated_by, case_id, model_version_id, status)
       VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201',
               '00000000-0000-0000-0000-000000001001', 'done')$s$, '23514');

-- Logs: unknown level
SELECT pg_temp.expect_sqlstate('system_logs: invalid level',
    $s$INSERT INTO system_logs (log_lvl, message) VALUES ('DEBUG', 'x')$s$, '23514');

-- Referential protection: a case with prediction runs cannot be deleted (RESTRICT)
SELECT pg_temp.expect_sqlstate('cases: delete with prediction runs',
    $s$DELETE FROM cases WHERE case_id = '00000000-0000-0000-0000-000000000201'$s$, '23503');

-- Prediction run status can only move forward (trigger): completed runs cannot be reopened
SELECT pg_temp.expect_sqlstate('prediction_runs: completed run reopened',
    $s$UPDATE prediction_runs SET status = 'processing'
       WHERE prediction_run_id = '00000000-0000-0000-0000-000000000901'$s$, '23514');

-- Anonymization of an unknown patient must fail, not silently do nothing
SELECT pg_temp.expect_sqlstate('anonymize_patient: unknown patient',
    $s$CALL anonymize_patient('00000000-0000-0000-0000-00000000dead')$s$, 'P0002');

-- Report results
SELECT label, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS status, detail FROM test_results ORDER BY label;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM test_results WHERE NOT ok) THEN
        RAISE EXCEPTION 'constraint tests failed: % of % cases',
            (SELECT count(*) FROM test_results WHERE NOT ok), (SELECT count(*) FROM test_results);
    END IF;
END $$;

ROLLBACK;
