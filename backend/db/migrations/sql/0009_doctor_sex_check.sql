-- Restrict doctors_and_admin.sex to the same values as patients.sex (DQ-26). NULL stays allowed.
-- ALTER TABLE validates existing rows, so the migration fails if a row holds another value.
ALTER TABLE doctors_and_admin
    ADD CONSTRAINT chk_doctors_and_admin_sex
    CHECK (sex IS NULL OR sex IN ('male', 'female', 'other', 'unknown'));
