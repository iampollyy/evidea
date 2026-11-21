ALTER TABLE invitations
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE prediction_runs
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX idx_prediction_runs_case_created ON prediction_runs (case_id, created_at DESC);
