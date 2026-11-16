CREATE TABLE lab_reports (
    report_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients (patient_id) ON DELETE RESTRICT,
    panel_id   UUID NOT NULL REFERENCES lab_panels (panel_id) ON DELETE RESTRICT,
    collected  TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_lab_reports_report_patient UNIQUE (report_id, patient_id),
    CONSTRAINT chk_lab_reports_collected_before_entry CHECK (collected <= created_at)
);

CREATE INDEX idx_lab_reports_patient_id ON lab_reports (patient_id);
CREATE INDEX idx_lab_reports_panel_id ON lab_reports (panel_id);

CREATE TABLE case_lab_reports (
    report_id  UUID NOT NULL,
    case_id    UUID NOT NULL,
    patient_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (report_id, case_id),
    CONSTRAINT fk_case_lab_reports_report
        FOREIGN KEY (report_id, patient_id) REFERENCES lab_reports (report_id, patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_case_lab_reports_case
        FOREIGN KEY (case_id, patient_id) REFERENCES cases (case_id, patient_id) ON DELETE CASCADE
);

CREATE INDEX idx_case_lab_reports_case_id ON case_lab_reports (case_id);

CREATE TABLE lab_results_items (
    result_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id   UUID NOT NULL REFERENCES lab_reports (report_id) ON DELETE CASCADE,
    analyte_id  UUID NOT NULL REFERENCES lab_analytes (analyte_id) ON DELETE RESTRICT,
    numeric_val NUMERIC(12,4),
    text_val    VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_lab_results_items_report_analyte UNIQUE (report_id, analyte_id),
    CONSTRAINT chk_lab_results_items_has_value
        CHECK (numeric_val IS NOT NULL OR text_val IS NOT NULL)
);

CREATE INDEX idx_lab_results_items_analyte_id ON lab_results_items (analyte_id);

CREATE OR REPLACE FUNCTION check_lab_results_item_consistency()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_report_panel_id UUID;
    v_analyte_panel_id UUID;
    v_data_type VARCHAR(20);
BEGIN
    SELECT panel_id INTO v_report_panel_id FROM lab_reports WHERE report_id = NEW.report_id;
    SELECT panel_id, data_type INTO v_analyte_panel_id, v_data_type
    FROM lab_analytes WHERE analyte_id = NEW.analyte_id;

    IF v_analyte_panel_id IS DISTINCT FROM v_report_panel_id THEN
        RAISE EXCEPTION 'analyte % does not belong to the panel of report %', NEW.analyte_id, NEW.report_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF v_data_type = 'numeric' AND NEW.numeric_val IS NULL THEN
        RAISE EXCEPTION 'numeric analyte % requires numeric_val', NEW.analyte_id
            USING ERRCODE = 'check_violation';
    END IF;

    IF v_data_type <> 'numeric' AND (NEW.numeric_val IS NOT NULL OR NEW.text_val IS NULL) THEN
        RAISE EXCEPTION 'analyte % of type % requires text_val and no numeric_val', NEW.analyte_id, v_data_type
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lab_results_items_consistency
    BEFORE INSERT OR UPDATE OF report_id, analyte_id, numeric_val, text_val ON lab_results_items
    FOR EACH ROW EXECUTE FUNCTION check_lab_results_item_consistency();
