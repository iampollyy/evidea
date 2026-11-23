import json
from collections.abc import Mapping, Sequence
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session, sessionmaker

from evidea.modules.doctors.models import Doctor
from evidea.modules.predictions.inference import Candidate, ScoredDisease, StubModel
from evidea.modules.predictions.worker import PredictionWorker
from tests.integration.conftest import Catalog, ModelSetup

COLLECTED = (datetime.now(UTC) - timedelta(hours=2)).isoformat()


class BrokenModel(StubModel):
    def predict(
        self, snapshot: Mapping[str, Any], candidates: Sequence[Candidate]
    ) -> list[ScoredDisease]:
        raise RuntimeError("model crashed")


@pytest.fixture
def worker(app_session_factory: sessionmaker[Session]) -> PredictionWorker:
    return PredictionWorker(app_session_factory, StubModel(top_k=5))


def create_case(api: TestClient, catalog: Catalog | None = None) -> dict[str, Any]:
    patient = api.post(
        "/api/v1/patients",
        json={
            "name": "Alberto",
            "surname": "Ripley",
            "birthDate": "1998-01-25",
            "sex": "male",
            "email": f"alberto-{uuid4().hex[:6]}@mail.example",
        },
    ).json()
    body: dict[str, Any] = {
        "anamnesis": {"chiefComplaint": "Progressive proximal muscle weakness"},
        "vitalSigns": {"heartRateBpm": 76},
    }
    if catalog:
        body["labReports"] = [
            {
                "panelId": str(catalog.muscle_panel),
                "collectedAt": COLLECTED,
                "results": [{"analyteId": str(catalog.ck), "value": 1520}],
            }
        ]
    response = api.post(f"/api/v1/patients/{patient['id']}/cases", json=body)
    assert response.status_code == 201, response.text
    case: dict[str, Any] = response.json()
    return case


def request_run(api: TestClient, case_id: str) -> dict[str, Any]:
    response = api.post(f"/api/v1/cases/{case_id}/prediction-runs")
    assert response.status_code == 202, response.text
    run: dict[str, Any] = response.json()
    return run


def test_request_queues_a_pending_run_with_deidentified_snapshot(
    api: TestClient,
    clinician: Doctor,
    active_model: ModelSetup,
    lab_catalog: Catalog,
    owner_session: Session,
) -> None:
    case = create_case(api, lab_catalog)

    response = api.post(f"/api/v1/cases/{case['id']}/prediction-runs")

    assert response.status_code == 202
    run = response.json()
    assert response.headers["Location"] == f"/api/v1/prediction-runs/{run['id']}"
    assert response.headers["Retry-After"] == "2"
    assert run["status"] == "pending"
    assert run["hypotheses"] == [] and run["startedAt"] is None
    assert run["modelVersion"]["name"] == "evidea-stub (demo)"
    assert run["initiatedBy"]["id"] == str(clinician.id)

    stored = owner_session.scalar(
        text("SELECT input_snapshot FROM prediction_runs WHERE prediction_run_id = :r"),
        {"r": run["id"]},
    )
    serialized = json.dumps(stored)
    assert "Alberto" not in serialized and "Ripley" not in serialized and "@" not in serialized
    assert stored["text_input"]["chief_complaint"] == "Progressive proximal muscle weakness"
    assert stored["lab_input"] == [
        {"code": "CK", "name": "Creatine Kinase", "unit": "U/L", "value": 1520}
    ]
    assert stored["demographics"]["sex"] == "male"


def test_second_request_while_open_returns_existing_run(
    api: TestClient, clinician: Doctor, active_model: ModelSetup
) -> None:
    case = create_case(api)
    first = request_run(api, case["id"])

    again = api.post(f"/api/v1/cases/{case['id']}/prediction-runs")

    assert again.status_code == 409
    assert again.json()["code"] == "PREDICTION_RUN_IN_PROGRESS"
    assert again.json()["existingRunId"] == first["id"]


def test_worker_completes_the_run_with_ranked_hypotheses_and_explanations(
    api: TestClient,
    clinician: Doctor,
    active_model: ModelSetup,
    worker: PredictionWorker,
) -> None:
    case = create_case(api)
    run = request_run(api, case["id"])

    assert worker.process_next() is True
    assert worker.process_next() is False

    done = api.get(f"/api/v1/prediction-runs/{run['id']}").json()
    assert done["status"] == "completed"
    assert done["startedAt"] and done["completedAt"] and done["errorMessage"] is None
    hypotheses = done["hypotheses"]
    assert [h["rank"] for h in hypotheses] == [1, 2, 3, 4, 5]
    scores = [h["score"] for h in hypotheses]
    assert scores == sorted(scores, reverse=True)
    assert str(active_model.inactive_disease_id) not in {h["disease"]["id"] for h in hypotheses}

    explanations = api.get(f"/api/v1/hypotheses/{hypotheses[0]['id']}/explanations").json()
    assert explanations["items"][0]["method"] == "shap"
    assert "demo stub model" in explanations["items"][0]["data"]["disclaimer"]

    latest = api.get(f"/api/v1/cases/{case['id']}").json()["latestPrediction"]
    assert latest["runId"] == run["id"]
    assert latest["topDiseaseName"] == hypotheses[0]["disease"]["name"]

    assert api.post(f"/api/v1/cases/{case['id']}/prediction-runs").status_code == 202


def test_run_is_unsupported_without_active_diseases(
    api: TestClient,
    clinician: Doctor,
    active_model: ModelSetup,
    worker: PredictionWorker,
    owner_session: Session,
) -> None:
    owner_session.execute(text("UPDATE diseases SET is_active = FALSE"))
    owner_session.commit()
    run = request_run(api, create_case(api)["id"])

    worker.process_next()

    result = api.get(f"/api/v1/prediction-runs/{run['id']}").json()
    assert result["status"] == "unsupported"
    assert result["errorMessage"] and result["completedAt"]
    assert result["hypotheses"] == []


def test_model_crash_marks_the_run_failed(
    api: TestClient,
    clinician: Doctor,
    active_model: ModelSetup,
    app_session_factory: sessionmaker[Session],
) -> None:
    run = request_run(api, create_case(api)["id"])

    PredictionWorker(app_session_factory, BrokenModel()).process_next()

    result = api.get(f"/api/v1/prediction-runs/{run['id']}").json()
    assert result["status"] == "failed"
    assert result["errorMessage"] == "The model failed to process this case."
    assert "crashed" not in result["errorMessage"]


def test_stuck_processing_runs_are_failed(
    api: TestClient,
    clinician: Doctor,
    active_model: ModelSetup,
    worker: PredictionWorker,
    owner_session: Session,
) -> None:
    run = request_run(api, create_case(api)["id"])
    owner_session.execute(
        text(
            "UPDATE prediction_runs SET status = 'processing', "
            "started_at = now() - interval '1 hour' WHERE prediction_run_id = :r"
        ),
        {"r": run["id"]},
    )
    owner_session.commit()

    assert worker.fail_stuck_runs() == 1
    assert worker.fail_stuck_runs() == 0
    assert api.get(f"/api/v1/prediction-runs/{run['id']}").json()["status"] == "failed"


def test_history_is_newest_first(
    api: TestClient, clinician: Doctor, active_model: ModelSetup, worker: PredictionWorker
) -> None:
    case = create_case(api)
    first = request_run(api, case["id"])
    worker.process_all()
    second = request_run(api, case["id"])

    history = api.get(f"/api/v1/cases/{case['id']}/prediction-runs").json()

    assert [r["id"] for r in history["items"]] == [second["id"], first["id"]]
    assert history["items"][1]["status"] == "completed"
    assert "hypotheses" not in history["items"][0]
    assert history["meta"]["totalItems"] == 2


def test_no_active_model_archived_patient_and_unknown_ids(
    api: TestClient, clinician: Doctor, owner_session: Session
) -> None:
    case = create_case(api)
    no_model = api.post(f"/api/v1/cases/{case['id']}/prediction-runs")
    assert no_model.status_code == 503
    assert no_model.json()["code"] == "NO_ACTIVE_MODEL"

    api.post(f"/api/v1/patients/{case['patientId']}/archive")
    archived = api.post(f"/api/v1/cases/{case['id']}/prediction-runs")
    assert archived.status_code == 409
    assert archived.json()["code"] == "PATIENT_ARCHIVED"

    unknown = uuid4()
    assert api.post(f"/api/v1/cases/{unknown}/prediction-runs").status_code == 404
    assert api.get(f"/api/v1/cases/{unknown}/prediction-runs").status_code == 404
    assert api.get(f"/api/v1/prediction-runs/{unknown}").status_code == 404
    assert api.get(f"/api/v1/hypotheses/{unknown}/explanations").status_code == 404
