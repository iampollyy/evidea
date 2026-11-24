
BEGIN;

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

SELECT pg_temp.expect_sqlstate('vital: systolic out of range',
    $s$INSERT INTO vital_signs (patient_id, systolic_bp_mmhg, created_at, updated_at)
       VALUES ('00000000-0000-0000-0000-000000000101', 500, now(), now())$s$, '23514');
SELECT pg_temp.expect_sqlstate('vital: spo2 above 100',
    $s$INSERT INTO vital_signs (patient_id, spo2_percent, created_at, updated_at)
       VALUES ('00000000-0000-0000-0000-000000000101', 101, now(), now())$s$, '23514');

SELECT pg_temp.expect_sqlstate('patient: invalid sex',
    $s$INSERT INTO patients (name, surname, birth_date, sex, email, created_at, updated_at)
       VALUES ('A', 'B', DATE '2000-01-01', 'robot', 'x@example.test', now(), now())$s$, '23514');

SELECT pg_temp.expect_sqlstate('doctor: duplicate email in other case',
    $s$INSERT INTO doctors_and_admin (name, surname, email, role, password_hash, created_at)
       SELECT 'Dup', 'User', 'DEV.CLINICIAN@example.test', role_id, '$2b$12$DEVONLYNOTAREALBCRYPTPLACEHOLDER0123456789ABCDEFGHIJK', DATE '2025-01-01'
       FROM roles WHERE role_name = 'clinician'$s$, '23505');

SELECT pg_temp.expect_sqlstate('anamnesis: patient does not match case',
    $s$INSERT INTO case_anamneses (patient_id, case_id, created_by_id, chief_complaint, created_at, updated_at)
       VALUES ('00000000-0000-0000-0000-000000000199', '00000000-0000-0000-0000-000000000201',
               '00000000-0000-0000-0000-000000000001', 'x', now(), now())$s$, '23503');

SELECT pg_temp.expect_sqlstate('case_vital_signs: vitals belong to another patient',
    $s$INSERT INTO case_vital_signs (vital_sign_id, case_id, patient_id, created_at)
       VALUES ('00000000-0000-0000-0000-000000000499', '00000000-0000-0000-0000-000000000201',
               '00000000-0000-0000-0000-000000000101', now())$s$, '23503');

SELECT pg_temp.expect_sqlstate('lab item: analyte from another panel',
    $s$INSERT INTO lab_results_items (report_id, analyte_id, numeric_val)
       VALUES ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000701', 13.5)$s$, '23514');

SELECT pg_temp.expect_sqlstate('lab item: numeric analyte with text only',
    $s$INSERT INTO lab_results_items (report_id, analyte_id, text_val)
       VALUES ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000702', 'high')$s$, '23514');

SELECT pg_temp.expect_sqlstate('lab item: duplicate analyte in report',
    $s$INSERT INTO lab_results_items (report_id, analyte_id, numeric_val)
       VALUES ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000702', 1.0)$s$, '23505');

SELECT pg_temp.expect_sqlstate('lab report: collected after entry',
    $s$INSERT INTO lab_reports (patient_id, panel_id, collected, created_at)
       VALUES ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000602',
               TIMESTAMPTZ '2025-03-01 00:00+00', TIMESTAMPTZ '2025-02-01 00:00+00')$s$, '23514');

SELECT pg_temp.expect_sqlstate('model_versions: second active model',
    $s$INSERT INTO model_versions (name, version, artifact_uri, trained_at, is_active)
       VALUES ('m2', '0.0.2', 'file:///x', now(), TRUE)$s$, '23505');

SELECT pg_temp.expect_sqlstate('disease_hypotheses: duplicate rank in run',
    $s$INSERT INTO disease_hypotheses (prediction_run_id, disease_id, rank, score)
       VALUES ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000001101', 1, 0.5)$s$, '23505');

SELECT pg_temp.expect_sqlstate('prediction_runs: invalid status',
    $s$INSERT INTO prediction_runs (initiated_by, case_id, model_version_id, status)
       VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201',
               '00000000-0000-0000-0000-000000001001', 'done')$s$, '23514');

SELECT pg_temp.expect_sqlstate('system_logs: invalid level',
    $s$INSERT INTO system_logs (log_lvl, message) VALUES ('DEBUG', 'x')$s$, '23514');

SELECT pg_temp.expect_sqlstate('cases: delete with prediction runs',
    $s$DELETE FROM cases WHERE case_id = '00000000-0000-0000-0000-000000000201'$s$, '23503');

SELECT pg_temp.expect_sqlstate('prediction_runs: completed run reopened',
    $s$UPDATE prediction_runs SET status = 'processing'
       WHERE prediction_run_id = '00000000-0000-0000-0000-000000000901'$s$, '23514');

SELECT pg_temp.expect_sqlstate('anonymize_patient: unknown patient',
    $s$CALL anonymize_patient('00000000-0000-0000-0000-00000000dead')$s$, 'P0002');

SELECT pg_temp.expect_sqlstate('doctor: MD5 password hash rejected',
    $s$INSERT INTO doctors_and_admin (name, surname, email, role, password_hash, created_at)
       SELECT 'Md5', 'User', 'md5.user@example.test', role_id, '5f4dcc3b5aa765d61d8327deb882cf99', DATE '2025-01-01'
       FROM roles WHERE role_name = 'clinician'$s$, '23514');

SELECT pg_temp.expect_sqlstate('doctor: unknown sex value rejected',
    $s$INSERT INTO doctors_and_admin (name, surname, sex, email, role, password_hash, created_at)
       SELECT 'Sex', 'User', 'robot', 'sex.user@example.test', role_id,
              '$2b$12$DEVONLYNOTAREALBCRYPTPLACEHOLDER0123456789ABCDEFGHIJK', DATE '2025-01-01'
       FROM roles WHERE role_name = 'clinician'$s$, '23514');

SELECT pg_temp.expect_sqlstate('patients: empty photo_key rejected',
    $s$UPDATE patients SET photo_key = '' WHERE patient_id = '00000000-0000-0000-0000-000000000101'$s$, '23514');

SELECT pg_temp.expect_sqlstate('patients: duplicate active email in other case',
    $s$INSERT INTO patients (name, surname, birth_date, sex, email)
       VALUES ('Dup', 'Patient', DATE '1990-01-01', 'male', 'PATIENT.TEST@example.test')$s$, '23505');

INSERT INTO patients (patient_id, name, surname, birth_date, sex, email, deleted_at)
VALUES ('00000000-0000-0000-0000-000000000198', 'Archived', 'Twin', DATE '1990-01-01', 'male',
        'patient.test@example.test', now());
INSERT INTO test_results (label, ok, detail)
SELECT 'patients: archived patient may share an email', count(*) = 2, ''
FROM patients WHERE lower(email) = 'patient.test@example.test';

INSERT INTO prediction_runs (prediction_run_id, initiated_by, case_id, model_version_id, status)
VALUES ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000001001', 'pending');
SELECT pg_temp.expect_sqlstate('prediction_runs: second open run for a case',
    $s$INSERT INTO prediction_runs (initiated_by, case_id, model_version_id, status)
       VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201',
               '00000000-0000-0000-0000-000000001001', 'pending')$s$, '23505');

INSERT INTO test_results (label, ok, detail)
SELECT 'prediction_runs: created_at set by default', created_at IS NOT NULL, ''
FROM prediction_runs WHERE prediction_run_id = '00000000-0000-0000-0000-000000000902';

INSERT INTO test_results (label, ok, detail) VALUES
    ('app_read: no direct access to patients', NOT has_table_privilege('app_read', 'patients', 'SELECT'), ''),
    ('app_read: no access to doctors_and_admin', NOT has_table_privilege('app_read', 'doctors_and_admin', 'SELECT'), ''),
    ('app_read: masked view is readable', has_table_privilege('app_read', 'v_patients_masked', 'SELECT'), ''),
    ('app_write: cannot delete patients', NOT has_table_privilege('app_write', 'patients', 'DELETE'), ''),
    ('app_write: cannot change reference data', NOT has_table_privilege('app_write', 'lab_analytes', 'UPDATE'), ''),
    ('app_write: system log is append-only', NOT has_table_privilege('app_write', 'system_logs', 'UPDATE'), ''),
    ('app_write: can run anonymize_patient', has_function_privilege('app_write', 'anonymize_patient(uuid)', 'EXECUTE'), ''),
    ('app_write: can create doctors', has_table_privilege('app_write', 'doctors_and_admin', 'INSERT'), ''),
    ('app_write: cannot delete doctors', NOT has_table_privilege('app_write', 'doctors_and_admin', 'DELETE'), ''),
    ('admin: cannot change migration journal', NOT has_table_privilege('admin', 'migration_checksums', 'UPDATE'), ''),
    ('app_write: cannot change migration journal', NOT has_table_privilege('app_write', 'migration_checksums', 'UPDATE'), '');

INSERT INTO test_results (label, ok, detail)
SELECT 'every table is granted to an app role', count(*) = 0, coalesce(string_agg(c.relname, ', '), '')
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  AND c.relname NOT IN ('alembic_version', 'migration_checksums')
  AND NOT has_table_privilege('app_read', c.oid, 'SELECT')
  AND NOT has_table_privilege('app_write', c.oid, 'SELECT');

INSERT INTO test_results (label, ok, detail)
SELECT 'every table is granted to admin', count(*) = 0, coalesce(string_agg(c.relname, ', '), '')
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  AND NOT has_table_privilege('admin', c.oid, 'SELECT');

INSERT INTO test_results (label, ok, detail) VALUES
    ('mask_name: keeps first letter only', mask_name('Test') = 'T***', mask_name('Test')),
    ('mask_email: keeps first letter and domain', mask_email('john.doe@example.com') = 'j***@example.com', mask_email('john.doe@example.com')),
    ('mask_phone: keeps last two digits', mask_phone('+380501234567') = '***********67', mask_phone('+380501234567')),
    ('v_patients_masked: name and surname masked',
     coalesce((SELECT name = 'S*****' AND surname = 'P******' AND email = 'p***@example.test'
               FROM v_patients_masked WHERE patient_id = '00000000-0000-0000-0000-000000000199'), FALSE), '');

INSERT INTO test_results (label, ok, detail)
SELECT 'v_case_latest_prediction: top hypothesis of completed run',
       count(*) = 1 AND bool_and(prediction_run_id = '00000000-0000-0000-0000-000000000901' AND top_score = 0.9),
       ''
FROM v_case_latest_prediction
WHERE case_id = '00000000-0000-0000-0000-000000000201';

CALL anonymize_patient('00000000-0000-0000-0000-000000000199');

INSERT INTO test_results (label, ok, detail)
SELECT 'anonymize_patient: personal data replaced and row soft-deleted',
       name = 'ANONYMIZED' AND surname = 'ANONYMIZED' AND deleted_at IS NOT NULL
       AND email = 'anon-00000000-0000-0000-0000-000000000199@anonymized.invalid',
       ''
FROM patients WHERE patient_id = '00000000-0000-0000-0000-000000000199';

INSERT INTO test_results (label, ok, detail)
SELECT 'v_patients_masked: anonymized patient is hidden',
       NOT EXISTS (SELECT 1 FROM v_patients_masked WHERE patient_id = '00000000-0000-0000-0000-000000000199'),
       '';

SELECT label, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS status, detail FROM test_results ORDER BY label;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM test_results WHERE NOT ok) THEN
        RAISE EXCEPTION 'constraint tests failed: % of % cases',
            (SELECT count(*) FROM test_results WHERE NOT ok), (SELECT count(*) FROM test_results);
    END IF;
END $$;

ROLLBACK;
