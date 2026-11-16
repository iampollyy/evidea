-- DEV/TEST ONLY. Never run against production.
-- Fake data, idempotent (fixed UUIDs + ON CONFLICT DO NOTHING).
-- Apply after all migrations: psql -v ON_ERROR_STOP=1 -f backend/db/seeds/dev_seed.sql

BEGIN;

-- Doctors and admin (password_hash is a placeholder, not a real hash)
INSERT INTO doctors_and_admin
    (doc_id, name, surname, birth_date, sex, email, phone_number, role, password_hash, created_at)
SELECT '00000000-0000-0000-0000-000000000001', 'Dev', 'Clinician', DATE '1985-04-12', 'female',
       'dev.clinician@example.test', NULL, role_id, 'DEV_ONLY_NOT_A_REAL_HASH', DATE '2025-01-10'
FROM roles WHERE role_name = 'clinician'
ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO doctors_and_admin
    (doc_id, name, surname, birth_date, sex, email, phone_number, role, password_hash, created_at)
SELECT '00000000-0000-0000-0000-000000000002', 'Dev', 'Admin', DATE '1980-09-30', 'male',
       'dev.admin@example.test', NULL, role_id, 'DEV_ONLY_NOT_A_REAL_HASH', DATE '2025-01-10'
FROM roles WHERE role_name = 'admin'
ON CONFLICT (doc_id) DO NOTHING;

-- Patient
INSERT INTO patients
    (patient_id, name, surname, birth_date, sex, email, phone_number, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0000-000000000101', 'Test', 'Patient', DATE '1972-03-05', 'male',
     'patient.test@example.test', NULL, DATE '2025-02-01', TIMESTAMPTZ '2025-02-01 10:00+00')
ON CONFLICT (patient_id) DO NOTHING;

-- Case with anamnesis and a vital-signs record
INSERT INTO cases (case_id, patient_id, created_by, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000201',
        '00000000-0000-0000-0000-000000000101',
        '00000000-0000-0000-0000-000000000001',
        TIMESTAMPTZ '2025-02-01 10:05+00', TIMESTAMPTZ '2025-02-01 10:05+00')
ON CONFLICT (case_id) DO NOTHING;

INSERT INTO case_anamneses
    (anamnesis_id, patient_id, case_id, created_by_id, chief_complaint, symptoms_duration,
     created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000301',
        '00000000-0000-0000-0000-000000000101',
        '00000000-0000-0000-0000-000000000201',
        '00000000-0000-0000-0000-000000000001',
        'Fatigue and muscle pain', '3 weeks',
        TIMESTAMPTZ '2025-02-01 10:06+00', TIMESTAMPTZ '2025-02-01 10:06+00')
ON CONFLICT (anamnesis_id) DO NOTHING;

INSERT INTO vital_signs
    (vital_sign_id, patient_id, weight_kg, systolic_bp_mmhg, diastolic_bp_mmhg,
     heart_rate_bpm, respiratory_rate, body_temp_celsius, spo2_percent, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000401',
        '00000000-0000-0000-0000-000000000101',
        82.5, 128, 84, 76, 16, 36.8, 98,
        TIMESTAMPTZ '2025-02-01 10:06+00', TIMESTAMPTZ '2025-02-01 10:06+00')
ON CONFLICT (vital_sign_id) DO NOTHING;

INSERT INTO case_vital_signs (vital_sign_id, case_id, patient_id, created_at)
VALUES ('00000000-0000-0000-0000-000000000401',
        '00000000-0000-0000-0000-000000000201',
        '00000000-0000-0000-0000-000000000101',
        TIMESTAMPTZ '2025-02-01 10:07+00')
ON CONFLICT DO NOTHING;

-- Sample lab catalog. EXAMPLE ONLY: codes taken from the documentation examples.
-- The real catalog must be provided by the domain team.
INSERT INTO lab_categories (category_id, code, name, is_active) VALUES
    ('00000000-0000-0000-0000-000000000501', 'HEM', 'Hematology', TRUE),
    ('00000000-0000-0000-0000-000000000502', 'BIO', 'Biochemistry', TRUE)
ON CONFLICT (category_id) DO NOTHING;

INSERT INTO lab_panels (panel_id, category_id, code, name, is_active) VALUES
    ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000501', 'CBC', 'Complete blood count', TRUE),
    ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000502', 'MUSCLE', 'Muscle enzymes', TRUE)
ON CONFLICT (panel_id) DO NOTHING;

INSERT INTO lab_analytes (analyte_id, panel_id, code, name, unit, data_type, is_active) VALUES
    ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000601', 'HGB', 'Hemoglobin', 'g/dL', 'numeric', TRUE),
    ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000602', 'CK', 'Creatine Kinase', 'U/L', 'numeric', TRUE),
    ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000602', 'ALT', 'Alanine aminotransferase', 'U/L', 'numeric', TRUE)
ON CONFLICT (analyte_id) DO NOTHING;

-- Lab report for the patient (linked to the case)
INSERT INTO lab_reports (report_id, patient_id, panel_id, collected, created_at)
VALUES ('00000000-0000-0000-0000-000000000801',
        '00000000-0000-0000-0000-000000000101',
        '00000000-0000-0000-0000-000000000602',
        TIMESTAMPTZ '2025-02-01 08:00+00', TIMESTAMPTZ '2025-02-01 10:08+00')
ON CONFLICT (report_id) DO NOTHING;

INSERT INTO case_lab_reports (report_id, case_id, patient_id, created_at)
VALUES ('00000000-0000-0000-0000-000000000801',
        '00000000-0000-0000-0000-000000000201',
        '00000000-0000-0000-0000-000000000101',
        TIMESTAMPTZ '2025-02-01 10:09+00')
ON CONFLICT DO NOTHING;

INSERT INTO lab_results_items (result_id, report_id, analyte_id, numeric_val, created_at) VALUES
    ('00000000-0000-0000-0000-000000000901', '00000000-0000-0000-0000-000000000801',
     '00000000-0000-0000-0000-000000000702', 412.0, TIMESTAMPTZ '2025-02-01 10:08+00'),
    ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000801',
     '00000000-0000-0000-0000-000000000703', 58.0, TIMESTAMPTZ '2025-02-01 10:08+00')
ON CONFLICT (result_id) DO NOTHING;

-- ML registry: one active dev model, one disease, one prediction run
INSERT INTO model_versions (model_version_id, name, version, artifact_uri, eval_metrics, trained_at, is_active)
VALUES ('00000000-0000-0000-0000-000000001001', 'dev-stub-model', '0.0.1-dev',
        'file:///dev/null', '{"accuracy": null}', TIMESTAMPTZ '2025-01-15 12:00+00', TRUE)
ON CONFLICT (model_version_id) DO NOTHING;

INSERT INTO diseases (disease_id, orpha_code, name, is_active, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000001101', 'ORPHA:DEV-EXAMPLE', 'Example disease (dev)', TRUE,
        TIMESTAMPTZ '2025-01-15 12:00+00', TIMESTAMPTZ '2025-01-15 12:00+00')
ON CONFLICT (disease_id) DO NOTHING;

COMMIT;
