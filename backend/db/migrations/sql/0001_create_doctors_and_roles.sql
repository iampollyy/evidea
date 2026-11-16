CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TABLE roles (
    role_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO roles (role_name) VALUES ('clinician'), ('admin')
ON CONFLICT (role_name) DO NOTHING;

CREATE TABLE doctors_and_admin (
    doc_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT NOT NULL,
    surname        TEXT NOT NULL,
    birth_date     DATE,
    sex            VARCHAR(64),
    email          TEXT NOT NULL,
    phone_number   TEXT,
    role           UUID NOT NULL REFERENCES roles (role_id) ON DELETE RESTRICT,
    password_hash  TEXT NOT NULL,
    created_at     DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    deactivated_at TIMESTAMPTZ,
    CONSTRAINT chk_doctors_and_admin_updated_after_created
        CHECK (updated_at >= created_at),
    CONSTRAINT chk_doctors_and_admin_deactivated_after_created
        CHECK (deactivated_at IS NULL OR deactivated_at >= created_at)
);

CREATE UNIQUE INDEX uq_doctors_and_admin_email ON doctors_and_admin (lower(email));
CREATE INDEX idx_doctors_and_admin_role ON doctors_and_admin (role);

CREATE TRIGGER trg_doctors_and_admin_updated_at
    BEFORE UPDATE ON doctors_and_admin
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE invitations (
    invite_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id  UUID NOT NULL REFERENCES doctors_and_admin (doc_id) ON DELETE RESTRICT,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    CONSTRAINT chk_invitations_used_before_expiry
        CHECK (used_at IS NULL OR used_at <= expires_at)
);

CREATE INDEX idx_invitations_doctor_id ON invitations (doctor_id);
