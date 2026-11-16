CREATE TABLE model_versions (
    model_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(100) NOT NULL,
    version          VARCHAR(30) NOT NULL UNIQUE,
    artifact_uri     TEXT NOT NULL,
    eval_metrics     JSONB,
    trained_at       TIMESTAMPTZ NOT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX uq_model_versions_single_active ON model_versions (is_active) WHERE is_active;

CREATE TABLE diseases (
    disease_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orpha_code       VARCHAR(20) NOT NULL UNIQUE,
    name             TEXT NOT NULL,
    description      TEXT,
    icd_code         VARCHAR(20),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    inheritance_type VARCHAR(50),
    affected_systems JSONB,
    CONSTRAINT chk_diseases_updated_after_created CHECK (updated_at >= created_at)
);

CREATE TRIGGER trg_diseases_updated_at
    BEFORE UPDATE ON diseases
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE prediction_runs (
    prediction_run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    initiated_by      UUID NOT NULL REFERENCES doctors_and_admin (doc_id) ON DELETE RESTRICT,
    case_id           UUID NOT NULL REFERENCES cases (case_id) ON DELETE RESTRICT,
    model_version_id  UUID NOT NULL REFERENCES model_versions (model_version_id) ON DELETE RESTRICT,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending',
    input_snapshot    JSONB,
    started_at        TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    error_msg         TEXT,
    CONSTRAINT chk_prediction_runs_status
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'unsupported')),
    CONSTRAINT chk_prediction_runs_completed_after_started
        CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at),
    CONSTRAINT chk_prediction_runs_snapshot_keys
        CHECK (input_snapshot IS NULL OR (input_snapshot ? 'text_input' AND input_snapshot ? 'lab_input'))
);

CREATE INDEX idx_prediction_runs_case_id ON prediction_runs (case_id);
CREATE INDEX idx_prediction_runs_initiated_by ON prediction_runs (initiated_by);
CREATE INDEX idx_prediction_runs_model_version_id ON prediction_runs (model_version_id);

CREATE TABLE disease_hypotheses (
    hypothesis_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_run_id UUID NOT NULL REFERENCES prediction_runs (prediction_run_id) ON DELETE CASCADE,
    disease_id        UUID NOT NULL REFERENCES diseases (disease_id) ON DELETE RESTRICT,
    rank              INT NOT NULL,
    score             NUMERIC(8,6) NOT NULL,
    CONSTRAINT uq_disease_hypotheses_run_rank UNIQUE (prediction_run_id, rank),
    CONSTRAINT uq_disease_hypotheses_run_disease UNIQUE (prediction_run_id, disease_id),
    CONSTRAINT chk_disease_hypotheses_rank CHECK (rank >= 1),
    CONSTRAINT chk_disease_hypotheses_score CHECK (score BETWEEN 0 AND 1)
);

CREATE INDEX idx_disease_hypotheses_disease_id ON disease_hypotheses (disease_id);

CREATE TABLE prediction_explanation (
    explanation_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hypothesis_id    UUID NOT NULL REFERENCES disease_hypotheses (hypothesis_id) ON DELETE CASCADE,
    method           VARCHAR(20) NOT NULL,
    explanation_data JSONB NOT NULL,
    summary          TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_prediction_explanation_method CHECK (method IN ('shap', 'lime'))
);

CREATE INDEX idx_prediction_explanation_hypothesis_id ON prediction_explanation (hypothesis_id);
