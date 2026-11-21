
DO $$
DECLARE
    v_duplicates INT;
BEGIN
    SELECT count(*) INTO v_duplicates
    FROM (
        SELECT lower(email) FROM patients
        WHERE deleted_at IS NULL
        GROUP BY lower(email)
        HAVING count(*) > 1
    ) d;

    IF v_duplicates > 0 THEN
        RAISE EXCEPTION 'cannot add uq_patients_active_email: % email(s) are shared by several active patients; resolve them first',
            v_duplicates;
    END IF;
END $$;

CREATE UNIQUE INDEX uq_patients_active_email ON patients (lower(email)) WHERE deleted_at IS NULL;
