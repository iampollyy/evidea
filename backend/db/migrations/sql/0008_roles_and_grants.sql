-- 0008: database roles, least-privilege grants and password hash format.
--
-- Roles are NOLOGIN group roles. Login users are created outside migrations so that no
-- password is stored in git (see backend/db/README.md, section "Roles and login users").
--
--   app_read   reference data and de-identified views only; no raw patients, no doctors_and_admin
--   app_write  app_read plus clinical writes; no DELETE on clinical data (use anonymize_patient)
--   admin      full access for administrators; migration journal tables are read-only

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_read') THEN
        CREATE ROLE app_read NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_write') THEN
        CREATE ROLE app_write NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
        CREATE ROLE admin NOLOGIN;
    END IF;
END $$;

GRANT app_read TO app_write;

REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO app_read, app_write, admin;

-- app_read: reference catalogs and views. Views run with the owner's rights, so app_read
-- gets masked patient data without any access to the patients table itself.
GRANT SELECT ON lab_categories, lab_panels, lab_analytes, diseases, model_versions,
    v_patients_masked, v_case_latest_prediction, mv_model_run_stats TO app_read;

-- app_write: clinical data. Reference data is managed by administrators only.
GRANT SELECT, INSERT, UPDATE ON patients, cases, case_anamneses, vital_signs, case_vital_signs,
    lab_reports, case_lab_reports, lab_results_items, prediction_runs, disease_hypotheses,
    prediction_explanation, invitations TO app_write;
GRANT SELECT, UPDATE ON doctors_and_admin TO app_write;
GRANT SELECT, INSERT ON system_logs TO app_write;
GRANT SELECT ON roles TO app_write;
GRANT EXECUTE ON PROCEDURE anonymize_patient(UUID) TO app_write, admin;
REVOKE EXECUTE ON PROCEDURE anonymize_patient(UUID) FROM PUBLIC;

-- admin: everything, except the migration journals, which stay read-only so that
-- checksums cannot be rewritten through the application or admin tools.
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin;
REVOKE ALL ON alembic_version, migration_checksums FROM admin;
GRANT SELECT ON alembic_version, migration_checksums TO admin;

-- Password hashes must be bcrypt ($2a$, $2b$, $2y$) or Argon2. MD5, SHA-1 and plain text are rejected.
-- Adding the check fails on existing rows with another format; re-hash them before running this on a populated database.
ALTER TABLE doctors_and_admin ADD CONSTRAINT chk_doctors_password_hash_format
    CHECK (password_hash ~ '^(\$2[aby]\$[0-9]{2}\$.{53}|\$argon2(id|i|d)\$.+)$');
