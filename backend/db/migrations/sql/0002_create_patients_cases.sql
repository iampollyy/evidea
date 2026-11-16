CREATE TABLE patients (
    patient_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    surname      TEXT NOT NULL,
    birth_date   DATE NOT NULL,
    sex          VARCHAR(64) NOT NULL,
    email        TEXT NOT NULL,
    phone_number TEXT,
    created_at   DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ,
    CONSTRAINT chk_patients_sex
        CHECK (sex IN ('male', 'female', 'other', 'unknown')),
    CONSTRAINT chk_patients_updated_after_created
        CHECK (updated_at >= created_at),
    CONSTRAINT chk_patients_deleted_after_created
        CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

CREATE INDEX idx_patients_active_name ON patients (surname, name) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE cases (
    case_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients (patient_id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES doctors_and_admin (doc_id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_cases_case_patient UNIQUE (case_id, patient_id),
    CONSTRAINT chk_cases_updated_after_created CHECK (updated_at >= created_at)
);

CREATE INDEX idx_cases_patient_id ON cases (patient_id);
CREATE INDEX idx_cases_created_by ON cases (created_by);

CREATE TRIGGER trg_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE case_anamneses (
    anamnesis_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id        UUID NOT NULL REFERENCES patients (patient_id) ON DELETE RESTRICT,
    case_id           UUID NOT NULL,
    created_by_id     UUID NOT NULL REFERENCES doctors_and_admin (doc_id) ON DELETE RESTRICT,
    clinical_notes    TEXT,
    chief_complaint   TEXT NOT NULL,
    family_history    TEXT,
    medications       TEXT,
    symptoms_duration TEXT,
    past_med_history  TEXT,
    allergies         TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_case_anamneses_case_patient
        FOREIGN KEY (case_id, patient_id) REFERENCES cases (case_id, patient_id) ON DELETE RESTRICT,
    CONSTRAINT chk_case_anamneses_updated_after_created CHECK (updated_at >= created_at)
);

CREATE INDEX idx_case_anamneses_case_id ON case_anamneses (case_id);
CREATE INDEX idx_case_anamneses_patient_id ON case_anamneses (patient_id);

CREATE TRIGGER trg_case_anamneses_updated_at
    BEFORE UPDATE ON case_anamneses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE vital_signs (
    vital_sign_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id        UUID NOT NULL REFERENCES patients (patient_id) ON DELETE RESTRICT,
    weight_kg         NUMERIC(5,1),
    systolic_bp_mmhg  INT,
    diastolic_bp_mmhg INT,
    heart_rate_bpm    INT,
    respiratory_rate  INT,
    body_temp_celsius NUMERIC(4,1),
    spo2_percent      INT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_vital_signs_id_patient UNIQUE (vital_sign_id, patient_id),
    CONSTRAINT chk_vital_signs_weight CHECK (weight_kg BETWEEN 0.1 AND 500),
    CONSTRAINT chk_vital_signs_systolic CHECK (systolic_bp_mmhg BETWEEN 20 AND 300),
    CONSTRAINT chk_vital_signs_diastolic CHECK (diastolic_bp_mmhg BETWEEN 20 AND 300),
    CONSTRAINT chk_vital_signs_heart_rate CHECK (heart_rate_bpm BETWEEN 10 AND 300),
    CONSTRAINT chk_vital_signs_body_temp CHECK (body_temp_celsius BETWEEN 25.0 AND 45.0),
    CONSTRAINT chk_vital_signs_spo2 CHECK (spo2_percent BETWEEN 0 AND 100),
    CONSTRAINT chk_vital_signs_updated_after_created CHECK (updated_at >= created_at)
);

CREATE INDEX idx_vital_signs_patient_id ON vital_signs (patient_id);

CREATE TRIGGER trg_vital_signs_updated_at
    BEFORE UPDATE ON vital_signs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE case_vital_signs (
    vital_sign_id UUID NOT NULL,
    case_id       UUID NOT NULL,
    patient_id    UUID NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (vital_sign_id, case_id),
    CONSTRAINT fk_case_vital_signs_vital_sign
        FOREIGN KEY (vital_sign_id, patient_id) REFERENCES vital_signs (vital_sign_id, patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_case_vital_signs_case
        FOREIGN KEY (case_id, patient_id) REFERENCES cases (case_id, patient_id) ON DELETE CASCADE
);

CREATE INDEX idx_case_vital_signs_case_id ON case_vital_signs (case_id);
