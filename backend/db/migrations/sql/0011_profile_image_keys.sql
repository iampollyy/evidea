ALTER TABLE patients
    ADD COLUMN photo_key TEXT,
    ADD CONSTRAINT chk_patients_photo_key CHECK (photo_key IS NULL OR length(photo_key) BETWEEN 1 AND 255);

ALTER TABLE doctors_and_admin
    ADD COLUMN avatar_key TEXT,
    ADD CONSTRAINT chk_doctors_and_admin_avatar_key CHECK (avatar_key IS NULL OR length(avatar_key) BETWEEN 1 AND 255);
