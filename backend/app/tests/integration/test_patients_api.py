from pathlib import Path
from typing import Any
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from evidea.modules.doctors.models import Doctor
from tests.integration.conftest import MakeDoctor, audit_messages, login

PATIENTS = "/api/v1/patients"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 32


def patient_body(**override: Any) -> dict[str, Any]:
    return {
        "name": "Alberto",
        "surname": "Ripley",
        "birthDate": "1998-01-25",
        "sex": "male",
        "email": "alberto.ripley@mail.example",
        "phoneNumber": "+370 612 45 648",
        **override,
    }


def create(api: TestClient, **override: Any) -> dict[str, Any]:
    response = api.post(PATIENTS, json=patient_body(**override))
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


def test_requires_authentication(api: TestClient) -> None:
    assert api.get(PATIENTS).status_code == 401
    assert api.post(PATIENTS, json=patient_body()).status_code == 401


def test_create_returns_patient_with_location(
    api: TestClient, clinician: Doctor, owner_session: Session
) -> None:
    response = api.post(PATIENTS, json=patient_body(name="  Alberto "))

    assert response.status_code == 201
    body = response.json()
    assert response.headers["Location"] == f"{PATIENTS}/{body['id']}"
    assert body["name"] == "Alberto"
    assert body["status"] == "active"
    assert body["lastVisitAt"] is None
    assert body["photoUrl"] is None
    assert isinstance(body["age"], int) and body["age"] >= 27
    assert f"patient.created id={body['id']}" in audit_messages(owner_session, clinician.id)


@pytest.mark.parametrize(
    ("override", "field"),
    [
        ({"birthDate": "2999-01-01"}, "birthDate"),
        ({"name": "R2D2"}, "name"),
        ({"phoneNumber": "12"}, "phoneNumber"),
        ({"sex": "robot"}, "sex"),
        ({"extra": True}, "extra"),
    ],
)
def test_create_validation_errors(
    api: TestClient, clinician: Doctor, override: dict[str, Any], field: str
) -> None:
    response = api.post(PATIENTS, json=patient_body(**override))
    assert response.status_code == 422
    assert field in [e["field"] for e in response.json()["errors"]]


def test_email_is_unique_among_active_patients_only(api: TestClient, clinician: Doctor) -> None:
    first = create(api)
    duplicate = api.post(PATIENTS, json=patient_body(email="ALBERTO.Ripley@mail.example"))
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "EMAIL_ALREADY_USED"

    api.post(f"{PATIENTS}/{first['id']}/archive")
    assert api.post(PATIENTS, json=patient_body()).status_code == 201


def test_get_unknown_and_malformed_ids(api: TestClient, clinician: Doctor) -> None:
    assert api.get(f"{PATIENTS}/{uuid4()}").json()["code"] == "NOT_FOUND"
    assert api.get(f"{PATIENTS}/not-a-uuid").status_code == 422


def test_list_paginates_searches_and_hides_contact_data(api: TestClient, clinician: Doctor) -> None:
    create(api, name="Alberto", surname="Ripley", email="a@mail.example")
    create(api, name="Maria", surname="Kowalska", email="maria.k@mail.example")
    create(api, name="Tomas", surname="Kazlauskas", email="tomas@mail.example")

    page = api.get(PATIENTS, params={"pageSize": 2}).json()
    assert [p["surname"] for p in page["items"]] == ["Kazlauskas", "Kowalska"]
    assert page["meta"] == {"page": 1, "pageSize": 2, "totalItems": 3, "totalPages": 2}
    assert "email" not in page["items"][0] and "phoneNumber" not in page["items"][0]

    def search(term: str) -> list[str]:
        items = api.get(PATIENTS, params={"search": term}).json()["items"]
        return [p["surname"] for p in items]

    assert search("kow") == ["Kowalska"]
    assert search("Alberto Rip") == ["Ripley"]
    assert search("maria.k@") == ["Kowalska"]
    assert search("100%") == []
    assert api.get(PATIENTS, params={"search": "a"}).status_code == 422
    assert api.get(PATIENTS, params={"search": "a\x00"}).status_code == 422


def test_list_rejects_page_numbers_beyond_the_supported_range(
    api: TestClient, clinician: Doctor
) -> None:
    response = api.get(PATIENTS, params={"page": 2_147_483_648, "pageSize": 100})
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_last_visit_comes_from_latest_case_and_can_be_sorted(
    api: TestClient, clinician: Doctor, owner_session: Session
) -> None:
    visited = create(api, surname="Visited", email="v@mail.example")
    create(api, surname="Never", email="n@mail.example")
    for created_at in ("2026-01-10T09:00:00Z", "2026-03-05T09:00:00Z"):
        owner_session.execute(
            text(
                "INSERT INTO cases (patient_id, created_by, created_at, updated_at) "
                "VALUES (:p, :d, :t, :t)"
            ),
            {"p": visited["id"], "d": clinician.id, "t": created_at},
        )
    owner_session.commit()

    assert api.get(f"{PATIENTS}/{visited['id']}").json()["lastVisitAt"].startswith("2026-03-05")
    items = api.get(PATIENTS, params={"sort": "-lastVisitAt"}).json()["items"]
    assert [p["surname"] for p in items] == ["Visited", "Never"]


def test_replace_requires_full_body_and_can_clear_phone(api: TestClient, clinician: Doctor) -> None:
    patient = create(api)
    url = f"{PATIENTS}/{patient['id']}"

    partial = api.put(url, json={"phoneNumber": None})
    assert partial.status_code == 422

    replaced = api.put(url, json=patient_body(surname="Ripley-Smith", phoneNumber=None))
    assert replaced.status_code == 200
    assert replaced.json()["surname"] == "Ripley-Smith"
    assert replaced.json()["phoneNumber"] is None


def test_replace_cannot_take_another_patients_email(api: TestClient, clinician: Doctor) -> None:
    create(api, email="taken@mail.example")
    other = create(api, email="free@mail.example")
    response = api.put(f"{PATIENTS}/{other['id']}", json=patient_body(email="taken@mail.example"))
    assert response.status_code == 409
    assert response.json()["code"] == "EMAIL_ALREADY_USED"


def test_archive_is_idempotent_and_blocks_changes(api: TestClient, clinician: Doctor) -> None:
    patient = create(api)
    url = f"{PATIENTS}/{patient['id']}"

    first = api.post(f"{url}/archive").json()
    second = api.post(f"{url}/archive").json()
    assert first["status"] == "archived" and first["archivedAt"] is not None
    assert second["archivedAt"] == first["archivedAt"]

    blocked = api.put(url, json=patient_body())
    assert blocked.status_code == 409
    assert blocked.json()["code"] == "PATIENT_ARCHIVED"
    photo = api.put(f"{url}/photo", files={"file": ("p.png", PNG, "image/png")})
    assert photo.status_code == 409

    archived = api.get(PATIENTS, params={"status": "archived"}).json()["items"]
    assert [p["id"] for p in archived] == [patient["id"]]
    assert api.get(PATIENTS).json()["meta"]["totalItems"] == 0


def test_photo_lifecycle_replaces_old_file(
    api: TestClient, clinician: Doctor, storage_dir: Path
) -> None:
    patient = create(api)
    url = f"{PATIENTS}/{patient['id']}/photo"

    first = api.put(url, files={"file": ("p.png", PNG, "image/png")}).json()["url"]
    second = api.put(url, files={"file": ("p.jpg", JPEG, "image/jpeg")}).json()["url"]
    assert first != second
    assert len(list((storage_dir / "patients").iterdir())) == 1

    image = api.get(second)
    assert image.headers["content-type"] == "image/jpeg"
    assert image.content == JPEG
    assert api.get(f"{PATIENTS}/{patient['id']}").json()["photoUrl"] == second

    assert api.delete(url).status_code == 204
    assert api.get(url).status_code == 404
    assert api.delete(url).status_code == 204


def test_anonymize_is_admin_only(
    api: TestClient, make_doctor: MakeDoctor, storage_dir: Path
) -> None:
    clinician = make_doctor("clinician")
    admin = make_doctor("admin")
    login(api, clinician.email)
    patient = create(api)
    api.put(f"{PATIENTS}/{patient['id']}/photo", files={"file": ("p.png", PNG, "image/png")})

    forbidden = api.post(f"{PATIENTS}/{patient['id']}/anonymize")
    assert forbidden.status_code == 403
    assert forbidden.json()["code"] == "FORBIDDEN"

    login(api, admin.email)
    body = api.post(f"{PATIENTS}/{patient['id']}/anonymize").json()
    assert body["name"] == "ANONYMIZED"
    assert body["email"] == f"anon-{patient['id']}@anonymized.invalid"
    assert body["phoneNumber"] is None
    assert body["birthDate"] == "1998-01-01"
    assert body["status"] == "archived"
    assert body["photoUrl"] is None
    assert list((storage_dir / "patients").iterdir()) == []
