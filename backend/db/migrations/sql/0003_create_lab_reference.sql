CREATE TABLE lab_categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(30) NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE lab_panels (
    panel_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES lab_categories (category_id) ON DELETE RESTRICT,
    code        VARCHAR(30) NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_lab_panels_category_id ON lab_panels (category_id);

CREATE TABLE lab_analytes (
    analyte_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panel_id   UUID NOT NULL REFERENCES lab_panels (panel_id) ON DELETE RESTRICT,
    code       VARCHAR(50) NOT NULL UNIQUE,
    name       VARCHAR(150) NOT NULL,
    unit       VARCHAR(30),
    data_type  VARCHAR(20) NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_lab_analytes_data_type
        CHECK (data_type IN ('numeric', 'text', 'boolean'))
);

CREATE INDEX idx_lab_analytes_panel_id ON lab_analytes (panel_id);
