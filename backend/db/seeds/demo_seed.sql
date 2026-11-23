BEGIN;

UPDATE model_versions SET is_active = FALSE WHERE is_active AND version <> '0.1.0-demo';

INSERT INTO model_versions (name, version, artifact_uri, eval_metrics, trained_at, is_active)
VALUES ('evidea-stub (demo)', '0.1.0-demo', 'stub://evidea/demo',
        '{"note": "deterministic stub, not a trained model"}', now(), TRUE)
ON CONFLICT (version) DO UPDATE SET is_active = TRUE;

INSERT INTO diseases (orpha_code, name, icd_code, inheritance_type, is_active) VALUES
    ('ORPHA:98896', 'Duchenne muscular dystrophy', 'G71.0', 'X-linked recessive', TRUE),
    ('ORPHA:98895', 'Becker muscular dystrophy', 'G71.0', 'X-linked recessive', TRUE),
    ('ORPHA:365', 'Glycogen storage disease due to acid maltase deficiency', 'E74.0', 'Autosomal recessive', TRUE),
    ('ORPHA:368', 'Glycogen storage disease due to muscle glycogen phosphorylase deficiency', 'E74.0', 'Autosomal recessive', TRUE),
    ('ORPHA:273', 'Steinert myotonic dystrophy', 'G71.1', 'Autosomal dominant', TRUE),
    ('ORPHA:269', 'Facioscapulohumeral dystrophy', 'G71.0', 'Autosomal dominant', TRUE),
    ('ORPHA:803', 'Amyotrophic lateral sclerosis', 'G12.2', NULL, TRUE),
    ('ORPHA:586', 'Cystic fibrosis', 'E84', 'Autosomal recessive', TRUE),
    ('ORPHA:355', 'Gaucher disease', 'E75.2', 'Autosomal recessive', TRUE),
    ('ORPHA:324', 'Fabry disease', 'E75.2', 'X-linked', TRUE),
    ('ORPHA:558', 'Marfan syndrome', 'Q87.4', 'Autosomal dominant', TRUE),
    ('ORPHA:399', 'Huntington disease', 'G10', 'Autosomal dominant', TRUE)
ON CONFLICT (orpha_code) DO UPDATE SET
    is_active = TRUE,
    icd_code = COALESCE(diseases.icd_code, EXCLUDED.icd_code),
    inheritance_type = COALESCE(diseases.inheritance_type, EXCLUDED.inheritance_type),
    updated_at = now();

UPDATE diseases SET is_active = FALSE WHERE orpha_code LIKE 'ORPHA:DEV-%';

INSERT INTO lab_categories (code, name) VALUES
    ('HEM', 'Hematology'),
    ('BIO', 'Biochemistry')
ON CONFLICT (code) DO NOTHING;

INSERT INTO lab_panels (category_id, code, name)
SELECT c.category_id, p.code, p.name
FROM (VALUES ('HEM', 'CBC', 'Complete blood count'),
             ('BIO', 'MUSCLE', 'Muscle enzymes')) AS p (category, code, name)
JOIN lab_categories c ON c.code = p.category
ON CONFLICT (code) DO NOTHING;

INSERT INTO lab_analytes (panel_id, code, name, unit, data_type)
SELECT lp.panel_id, a.code, a.name, a.unit, a.data_type
FROM (VALUES ('CBC', 'HGB', 'Hemoglobin', 'g/dL', 'numeric'),
             ('CBC', 'WBC', 'White blood cells', '10^9/L', 'numeric'),
             ('CBC', 'PLT', 'Platelets', '10^9/L', 'numeric'),
             ('MUSCLE', 'CK', 'Creatine Kinase', 'U/L', 'numeric'),
             ('MUSCLE', 'ALT', 'Alanine aminotransferase', 'U/L', 'numeric'),
             ('MUSCLE', 'AST', 'Aspartate aminotransferase', 'U/L', 'numeric'),
             ('MUSCLE', 'LDH', 'Lactate dehydrogenase', 'U/L', 'numeric'),
             ('MUSCLE', 'MYO_U', 'Myoglobinuria', NULL, 'boolean')) AS a (panel, code, name, unit, data_type)
JOIN lab_panels lp ON lp.code = a.panel
ON CONFLICT (code) DO NOTHING;

COMMIT;
