
DO $$
DECLARE
    v_cases INT;
BEGIN
    SELECT count(*) INTO v_cases
    FROM (
        SELECT case_id FROM prediction_runs
        WHERE status IN ('pending', 'processing')
        GROUP BY case_id
        HAVING count(*) > 1
    ) d;

    IF v_cases > 0 THEN
        RAISE EXCEPTION 'cannot add uq_prediction_runs_one_open_per_case: % case(s) have several open runs; close them first',
            v_cases;
    END IF;
END $$;

CREATE UNIQUE INDEX uq_prediction_runs_one_open_per_case ON prediction_runs (case_id)
    WHERE status IN ('pending', 'processing');
