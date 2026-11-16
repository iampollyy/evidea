CREATE TABLE system_logs (
    log_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES doctors_and_admin (doc_id) ON DELETE SET NULL,
    case_id    UUID REFERENCES cases (case_id) ON DELETE SET NULL,
    log_lvl    VARCHAR(20) NOT NULL,
    error_code VARCHAR(20),
    message    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_system_logs_level CHECK (log_lvl IN ('INFO', 'WARN', 'ERROR', 'FATAL'))
);

CREATE INDEX idx_system_logs_created_at ON system_logs (created_at);
CREATE INDEX idx_system_logs_log_lvl ON system_logs (log_lvl);
CREATE INDEX idx_system_logs_case_id ON system_logs (case_id) WHERE case_id IS NOT NULL;
CREATE INDEX idx_system_logs_user_id ON system_logs (user_id) WHERE user_id IS NOT NULL;
