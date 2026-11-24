from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from evidea.modules.doctors.models import Doctor
from tests.integration.conftest import Catalog, audit_messages

COLLECTED = (datetime.now(UTC) - timedelta(hours=3)).isoformat()


def create_patient(api: TestClient, email: str = "alberto@mail.example") -> str:
    response = api.post(
        "/api/v1/patients",
        json={
            "name": "Alberto",
            "surname": "Ripley",
            "birthDate": "1998-01-25",
            "sex": "male",
            "email": email,
        },
    )
    assert response.status_code == 201, response.text
    patient_id: str = response.json()["id"]
    return patient_id


def full_case(catalog: Catalog) -> dict[str, Any]:
    return {
        "anamnesis": {
            "chiefComplaint": "Progressive muscle weakness and fatigue",
            "symptomsDuration": "3 months",
            "allergies": "None known",
        },
        "vitalSigns": {"weightKg": 82.5, "heartRateBpm": 76, "bodyTempCelsius": 36.8},
        "labReports": [
            {
                "panelId": str(catalog.muscle_panel),
                "collectedAt": COLLECTED,
                "results": [
                    {"analyteId": str(catalog.ck), "value": 1520},
                    {"analyteId": str(catalog.alt), "value": 89.5},
                    {"analyteId": str(catalog.myoglobinuria), "value": True},
                    {"analyteId": str(catalog.comment), "value": "slightly haemolysed"},
                ],
            }
        ],
    }


def test_lab_catalog_shows_only_active_items(
    api: TestClient, clinician: Doctor, lab_catalog: Catalog
) -> None:
    catalog = api.get("/api/v1/lab-catalog").json()
    assert [c["code"] for c in catalog["categories"]] == ["BIO", "HEM"]
    bio = catalog["categories"][0]
    assert [p["code"] for p in bio["panels"]] == ["MUSCLE"]
    codes = [a["code"] for a in bio["panels"][0]["analytes"]]
    assert "OLD_X" not in codes and "CK" in codes
    ck = next(a for a in bio["panels"][0]["analytes"] if a["code"] == "CK")
    assert ck == {
        "id": str(lab_catalog.ck),
        "code": "CK",
        "name": "Creatine Kinase",
        "unit": "U/L",
        "dataType": "numeric",
    }


def test_create_case_saves_everything_in_one_go(
    api: TestClient, clinician: Doctor, lab_catalog: Catalog, owner_session: Session
) -> None:
    patient_id = create_patient(api)

    response = api.post(f"/api/v1/patients/{patient_id}/cases", json=full_case(lab_catalog))

    assert response.status_code == 201, response.text
    case = response.json()
    assert response.headers["Location"] == f"/api/v1/cases/{case['id']}"
    assert case["patientId"] == patient_id
    assert case["createdBy"] == {"id": str(clinician.id), "name": "Sarah", "surname": "Chen"}
    assert case["anamnesis"]["chiefComplaint"] == "Progressive muscle weakness and fatigue"
    assert case["anamnesis"]["familyHistory"] is None
    assert case["vitalSigns"][0]["weightKg"] == 82.5
    assert case["vitalSigns"][0]["spo2Percent"] is None
    values = {r["analyte"]["code"]: r["value"] for r in case["labReports"][0]["results"]}
    assert values == {"CK": 1520, "ALT": 89.5, "MYO_U": True, "COMMENT": "slightly haemolysed"}
    assert case["latestPrediction"] is None

    assert api.get(f"/api/v1/cases/{case['id']}").json() == case
    assert any(m == "case.created" for m in audit_messages(owner_session, clinician.id))
    logged_case = owner_session.scalar(
        text("SELECT case_id FROM system_logs WHERE message = 'case.created'")
    )
    assert str(logged_case) == case["id"]


def test_invalid_lab_data_saves_nothing(
    api: TestClient, clinician: Doctor, lab_catalog: Catalog, owner_session: Session
) -> None:
    patient_id = create_patient(api)
    body = full_case(lab_catalog)
    body["labReports"][0]["results"][0] = {"analyteId": str(lab_catalog.hgb), "value": 13.5}
    body["labReports"][0]["results"][1]["value"] = "high"

    response = api.post(f"/api/v1/patients/{patient_id}/cases", json=body)

    assert response.status_code == 422
    assert [(e["field"], e["code"]) for e in response.json()["errors"]] == [
        ("labReports.0.results.0.analyteId", "wrong_panel"),
        ("labReports.0.results.1.value", "wrong_type"),
    ]
    assert owner_session.scalar(text("SELECT count(*) FROM cases")) == 0
    assert owner_session.scalar(text("SELECT count(*) FROM vital_signs")) == 0


def test_minimal_case_and_case_list(
    api: TestClient, clinician: Doctor, owner_session: Session
) -> None:
    patient_id = create_patient(api)
    url = f"/api/v1/patients/{patient_id}/cases"
    first = api.post(url, json={"anamnesis": {"chiefComplaint": "Recurrent muscle cramps"}}).json()
    second = api.post(url, json={"anamnesis": {"chiefComplaint": "Exercise intolerance"}}).json()
    assert first["vitalSigns"] == [] and first["labReports"] == []

    listing = api.get(url).json()
    assert [c["id"] for c in listing["items"]] == [second["id"], first["id"]]
    assert listing["items"][0]["chiefComplaint"] == "Exercise intolerance"
    assert listing["meta"]["totalItems"] == 2

    patient = api.get(f"/api/v1/patients/{patient_id}").json()
    assert patient["lastVisitAt"] == second["createdAt"]


def test_latest_prediction_is_shown_from_the_database_view(
    api: TestClient, clinician: Doctor, owner_session: Session
) -> None:
    patient_id = create_patient(api)
    case = api.post(
        f"/api/v1/patients/{patient_id}/cases",
        json={"anamnesis": {"chiefComplaint": "Progressive muscle weakness"}},
    ).json()
    model_id, disease_id, run_id = uuid4(), uuid4(), uuid4()
    params = {"m": model_id, "d": disease_id, "r": run_id, "u": clinician.id, "c": case["id"]}
    for statement in (
        "INSERT INTO model_versions (model_version_id, name, version, artifact_uri, trained_at) "
        "VALUES (:m, 'test-model', '0.0.1-test', 'file:///test', now())",
        "INSERT INTO diseases (disease_id, orpha_code, name) "
        "VALUES (:d, 'ORPHA:365', 'Pompe disease')",
        "INSERT INTO prediction_runs (prediction_run_id, initiated_by, case_id, model_version_id, "
        "status, started_at, completed_at) VALUES (:r, :u, :c, :m, 'completed', now(), now())",
        "INSERT INTO disease_hypotheses (prediction_run_id, disease_id, rank, score) "
        "VALUES (:r, :d, 1, 0.62)",
    ):
        owner_session.execute(text(statement), params)
    owner_session.commit()

    latest = api.get(f"/api/v1/cases/{case['id']}").json()["latestPrediction"]
    assert latest["runId"] == str(run_id)
    assert latest["topDiseaseName"] == "Pompe disease"
    assert latest["topScore"] == 0.62
    summary = api.get(f"/api/v1/patients/{patient_id}/cases").json()["items"][0]
    assert summary["latestPrediction"]["topDiseaseName"] == "Pompe disease"


def test_replace_anamnesis(api: TestClient, clinician: Doctor) -> None:
    patient_id = create_patient(api)
    case = api.post(
        f"/api/v1/patients/{patient_id}/cases",
        json={"anamnesis": {"chiefComplaint": "Progressive muscle weakness", "allergies": "None"}},
    ).json()
    url = f"/api/v1/cases/{case['id']}/anamnesis"

    partial = api.put(url, json={"familyHistory": "Uncle with similar symptoms"})
    assert partial.status_code == 422

    full = {
        "chiefComplaint": "Progressive muscle weakness",
        "symptomsDuration": "3 months",
        "clinicalNotes": None,
        "familyHistory": "Uncle with similar symptoms",
        "medications": None,
        "pastMedicalHistory": None,
        "allergies": None,
    }
    replaced = api.put(url, json=full)
    assert replaced.status_code == 200
    body = replaced.json()
    assert body["familyHistory"] == "Uncle with similar symptoms"
    assert body["allergies"] is None
    assert body["updatedAt"] >= body["createdAt"]

    invalid = api.put(url, json={**full, "familyHistory": "Null\x00character"})
    assert invalid.status_code == 422


def test_archived_patient_gets_no_new_cases_or_changes(api: TestClient, clinician: Doctor) -> None:
    patient_id = create_patient(api)
    case = api.post(
        f"/api/v1/patients/{patient_id}/cases",
        json={"anamnesis": {"chiefComplaint": "Progressive muscle weakness"}},
    ).json()
    api.post(f"/api/v1/patients/{patient_id}/archive")

    new_case = api.post(
        f"/api/v1/patients/{patient_id}/cases",
        json={"anamnesis": {"chiefComplaint": "Another complaint here"}},
    )
    assert new_case.status_code == 409
    assert new_case.json()["code"] == "PATIENT_ARCHIVED"
    assert api.get(f"/api/v1/cases/{case['id']}").status_code == 200


def test_unknown_ids(api: TestClient, clinician: Doctor) -> None:
    unknown = uuid4()
    body = {"anamnesis": {"chiefComplaint": "Progressive muscle weakness"}}
    assert api.post(f"/api/v1/patients/{unknown}/cases", json=body).status_code == 404
    assert api.get(f"/api/v1/patients/{unknown}/cases").status_code == 404
    assert api.get(f"/api/v1/cases/{unknown}").status_code == 404
