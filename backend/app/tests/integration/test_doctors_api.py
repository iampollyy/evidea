import re
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from evidea.modules.doctors.models import Doctor
from tests.integration.conftest import FakeEmailSender, MakeDoctor, audit_messages, login

DOCTORS = "/api/v1/doctors"


def doctor_body(**override: Any) -> dict[str, Any]:
    return {
        "name": "Tomas",
        "surname": "Kazlauskas",
        "birthDate": "1988-06-14",
        "sex": "male",
        "email": "tomas.kazlauskas@clinic.example",
        "phoneNumber": "+370 612 45 648",
        "role": "clinician",
        **override,
    }


def invitation_token(mailer: FakeEmailSender) -> str:
    match = re.search(r"accept-invitation\?token=([\w-]+)", mailer.outbox[-1].body)
    assert match, mailer.outbox[-1].body
    return match.group(1)


def test_account_management_is_admin_only(api: TestClient, clinician: Doctor) -> None:
    for method, url in [
        ("GET", DOCTORS),
        ("POST", DOCTORS),
        ("GET", f"{DOCTORS}/{clinician.id}"),
        ("POST", f"{DOCTORS}/{clinician.id}/deactivate"),
        ("POST", f"{DOCTORS}/{clinician.id}/activate"),
        ("POST", f"{DOCTORS}/{clinician.id}/invitations"),
    ]:
        response = api.request(method, url, json=doctor_body() if method == "POST" else None)
        assert response.status_code == 403, url
        assert response.json()["code"] == "FORBIDDEN"


def test_full_onboarding_flow(
    api: TestClient, admin: Doctor, mailer: FakeEmailSender, owner_session: Session
) -> None:
    created = api.post(DOCTORS, json=doctor_body())
    assert created.status_code == 201
    body = created.json()
    assert created.headers["Location"] == f"{DOCTORS}/{body['id']}"
    assert body["status"] == "invited"
    assert body["role"] == "clinician"


    assert len(mailer.outbox) == 1
    assert mailer.outbox[0].to == "tomas.kazlauskas@clinic.example"
    token = invitation_token(mailer)
    stored = owner_session.scalars(text("SELECT token_hash FROM invitations")).all()
    assert token not in stored


    api.post("/api/v1/auth/logout")
    attempt = api.post(
        "/api/v1/auth/login", json={"email": body["email"], "password": "Anything#1"}
    )
    assert attempt.status_code == 401

    accept = api.post(
        "/api/v1/auth/invitations/accept", json={"token": token, "password": "Welcome#2026"}
    )
    assert accept.status_code == 204
    login(api, body["email"], "Welcome#2026")
    assert api.get("/api/v1/me").json()["status"] == "active"
    assert "doctor.created id=" + body["id"] in audit_messages(owner_session, admin.id)


def test_create_validation_and_duplicate_email(
    api: TestClient, admin: Doctor, make_doctor: MakeDoctor
) -> None:
    make_doctor(email="taken@clinic.example")
    duplicate = api.post(DOCTORS, json=doctor_body(email="TAKEN@clinic.example"))
    assert duplicate.status_code == 409
    assert duplicate.json()["code"] == "EMAIL_ALREADY_USED"

    invalid = api.post(DOCTORS, json=doctor_body(birthDate="2015-01-01", role="nurse"))
    assert invalid.status_code == 422
    fields = {e["field"] for e in invalid.json()["errors"]}
    assert fields == {"birthDate", "role"}


def test_email_failure_keeps_account_and_resend_works(
    api: TestClient, admin: Doctor, mailer: FakeEmailSender, owner_session: Session
) -> None:
    mailer.fail = True
    created = api.post(DOCTORS, json=doctor_body())
    assert created.status_code == 201
    doctor_id = created.json()["id"]
    assert "doctor.invitation_email_failed id=" + doctor_id in audit_messages(owner_session)

    mailer.fail = False
    resent = api.post(f"{DOCTORS}/{doctor_id}/invitations")
    assert resent.status_code == 202
    assert resent.json()["expiresAt"]
    assert len(mailer.outbox) == 1


def test_resend_invalidates_the_previous_link(
    api: TestClient, admin: Doctor, mailer: FakeEmailSender
) -> None:
    doctor_id = api.post(DOCTORS, json=doctor_body()).json()["id"]
    first = invitation_token(mailer)
    api.post(f"{DOCTORS}/{doctor_id}/invitations")
    second = invitation_token(mailer)
    assert first != second

    accept = "/api/v1/auth/invitations/accept"
    old = api.post(accept, json={"token": first, "password": "Welcome#2026"})
    assert old.status_code == 400
    assert api.post(accept, json={"token": second, "password": "Welcome#2026"}).status_code == 204

    again = api.post(f"{DOCTORS}/{doctor_id}/invitations")
    assert again.status_code == 409
    assert again.json()["code"] == "DOCTOR_NOT_INVITED"


def test_list_filters_and_search(api: TestClient, admin: Doctor, make_doctor: MakeDoctor) -> None:
    make_doctor("clinician", name="Maria", surname="Kowalska", email="maria@clinic.example")
    make_doctor("clinician", name="Jonas", surname="Petraitis", deactivated=True)
    api.post(DOCTORS, json=doctor_body())

    def surnames(**params: str) -> list[str]:
        return [d["surname"] for d in api.get(DOCTORS, params=params).json()["items"]]

    assert surnames() == ["Admin", "Kazlauskas", "Kowalska", "Petraitis"]
    assert surnames(status="invited") == ["Kazlauskas"]
    assert surnames(status="deactivated") == ["Petraitis"]
    assert surnames(status="active") == ["Admin", "Kowalska"]
    assert surnames(role="admin") == ["Admin"]
    assert surnames(search="maria@") == ["Kowalska"]
    page = api.get(DOCTORS, params={"pageSize": 2, "page": 2}).json()
    assert page["meta"]["totalItems"] == 4 and len(page["items"]) == 2


def test_deactivate_and_activate(api: TestClient, admin: Doctor, make_doctor: MakeDoctor) -> None:
    doctor = make_doctor()
    url = f"{DOCTORS}/{doctor.id}"

    deactivated = api.post(f"{url}/deactivate").json()
    assert deactivated["status"] == "deactivated" and deactivated["deactivatedAt"]
    assert api.post(f"{url}/deactivate").json()["deactivatedAt"] == deactivated["deactivatedAt"]

    activated = api.post(f"{url}/activate").json()
    assert activated["status"] == "active" and activated["deactivatedAt"] is None

    self_deactivation = api.post(f"{DOCTORS}/{admin.id}/deactivate")
    assert self_deactivation.status_code == 409
    assert self_deactivation.json()["code"] == "CANNOT_DEACTIVATE_SELF"

    assert api.get(f"{DOCTORS}/{doctor.id}").json()["id"] == str(doctor.id)
    assert api.post(f"{DOCTORS}/00000000-0000-0000-0000-000000000000/activate").status_code == 404
