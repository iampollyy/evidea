from collections.abc import Callable
from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from evidea.modules.doctors.models import Doctor
from tests.integration.conftest import PASSWORD, MakeDoctor, audit_messages, login

LOGIN = "/api/v1/auth/login"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32


def test_login_sets_secure_cookie_and_returns_user(
    api: TestClient, make_doctor: MakeDoctor
) -> None:
    doctor = make_doctor("clinician", email="Sarah.Chen@Clinic.example")

    response = api.post(LOGIN, json={"email": "sarah.chen@clinic.example", "password": PASSWORD})

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(doctor.id)
    assert body["role"] == "clinician"
    assert body["status"] == "active"
    assert "passwordHash" not in body and "password_hash" not in body
    cookie = response.headers["set-cookie"]
    for flag in ("evidea_session=", "HttpOnly", "Secure", "SameSite=strict", "Path=/api"):
        assert flag.lower() in cookie.lower()


def test_wrong_password_and_unknown_email_look_the_same(
    api: TestClient, make_doctor: MakeDoctor, owner_session: Session
) -> None:
    doctor = make_doctor()
    wrong = api.post(LOGIN, json={"email": doctor.email, "password": "Wrong#2026"})
    unknown = api.post(LOGIN, json={"email": "nobody@clinic.example", "password": PASSWORD})

    for response in (wrong, unknown):
        assert response.status_code == 401
        assert response.json()["code"] == "INVALID_CREDENTIALS"
    assert "set-cookie" not in wrong.headers
    messages = audit_messages(owner_session)
    assert messages.count("auth.login_failed") == 2
    assert not any(doctor.email in m for m in messages)


def test_deactivated_account_is_reported_only_with_correct_password(
    api: TestClient, make_doctor: MakeDoctor
) -> None:
    doctor = make_doctor(deactivated=True)
    correct = api.post(LOGIN, json={"email": doctor.email, "password": PASSWORD})
    assert correct.status_code == 403
    assert correct.json()["code"] == "ACCOUNT_DEACTIVATED"
    wrong = api.post(LOGIN, json={"email": doctor.email, "password": "Wrong#2026"})
    assert wrong.status_code == 401


def test_invited_doctor_without_password_cannot_log_in(
    api: TestClient, make_doctor: MakeDoctor
) -> None:
    doctor = make_doctor(password=None)
    response = api.post(LOGIN, json={"email": doctor.email, "password": PASSWORD})
    assert response.status_code == 401


def test_too_many_failures_are_rate_limited_even_with_correct_password(
    api: TestClient, make_doctor: MakeDoctor
) -> None:
    doctor = make_doctor()
    for _ in range(5):
        failed = api.post(LOGIN, json={"email": doctor.email, "password": "Wrong#1"})
        assert failed.status_code == 401

    blocked = api.post(LOGIN, json={"email": doctor.email, "password": PASSWORD})

    assert blocked.status_code == 429
    assert blocked.json()["code"] == "RATE_LIMITED"
    assert int(blocked.headers["Retry-After"]) > 0


def test_me_requires_a_valid_session(api: TestClient, clinician: Doctor) -> None:
    assert api.get("/api/v1/me").json()["id"] == str(clinician.id)

    real_token = api.cookies["evidea_session"]
    header, payload, signature = real_token.split(".")
    for forged in (f"{header}.{payload}.{signature[::-1]}", "not-a-jwt"):
        api.cookies.clear()
        api.cookies.set("evidea_session", forged)
        response = api.get("/api/v1/me")
        assert response.status_code == 401
        assert response.json()["code"] == "UNAUTHENTICATED"


def test_deactivation_ends_existing_sessions_immediately(
    api: TestClient, clinician: Doctor, owner_session: Session
) -> None:
    clinician.deactivated_at = clinician.updated_at
    owner_session.commit()
    assert api.get("/api/v1/me").status_code == 401


def test_logout_clears_the_cookie(api: TestClient, clinician: Doctor) -> None:
    response = api.post("/api/v1/auth/logout")
    assert response.status_code == 204
    assert "max-age=0" in response.headers["set-cookie"].lower()
    assert api.get("/api/v1/me").status_code == 401


def test_accept_invitation_sets_password_once(
    api: TestClient,
    make_doctor: MakeDoctor,
    make_invitation: Callable[..., str],
    owner_session: Session,
) -> None:
    doctor = make_doctor(password=None)
    token = make_invitation(doctor)
    assert api.get("/api/v1/me").status_code == 401

    accepted = api.post(
        "/api/v1/auth/invitations/accept", json={"token": token, "password": "NewPass#1"}
    )
    assert accepted.status_code == 204
    login(api, doctor.email, "NewPass#1")
    assert api.get("/api/v1/me").json()["status"] == "active"
    assert "auth.invitation_accepted" in audit_messages(owner_session, doctor.id)

    reused = api.post(
        "/api/v1/auth/invitations/accept", json={"token": token, "password": "Other#123"}
    )
    assert reused.status_code == 400
    assert reused.json()["code"] == "INVITATION_INVALID"


def test_invitation_is_rejected_when_expired_unknown_or_account_deactivated(
    api: TestClient, make_doctor: MakeDoctor, make_invitation: Callable[..., str]
) -> None:
    expired = make_invitation(make_doctor(password=None), expires_in=timedelta(hours=-1))
    deactivated = make_invitation(make_doctor(password=None, deactivated=True))
    for token in (expired, deactivated, "x" * 43):
        response = api.post(
            "/api/v1/auth/invitations/accept", json={"token": token, "password": "NewPass#1"}
        )
        assert response.status_code == 400
        assert response.json()["code"] == "INVITATION_INVALID"


def test_weak_password_is_rejected_with_field_error(
    api: TestClient, make_doctor: MakeDoctor, make_invitation: Callable[..., str]
) -> None:
    token = make_invitation(make_doctor(password=None))
    response = api.post(
        "/api/v1/auth/invitations/accept", json={"token": token, "password": "weakpassword"}
    )
    assert response.status_code == 422
    assert response.json()["errors"][0]["field"] == "password"


def test_status_is_invited_until_invitation_is_accepted(
    api: TestClient,
    make_doctor: MakeDoctor,
    make_invitation: Callable[..., str],
) -> None:
    doctor = make_doctor()
    make_invitation(doctor)
    login(api, doctor.email)
    assert api.get("/api/v1/me").json()["status"] == "invited"


def test_avatar_upload_download_and_delete(api: TestClient, clinician: Doctor) -> None:
    uploaded = api.put("/api/v1/me/avatar", files={"file": ("me.png", PNG, "image/png")})
    assert uploaded.status_code == 200
    url = uploaded.json()["url"]
    assert url.startswith(f"/api/v1/doctors/{clinician.id}/avatar?v=")
    assert api.get("/api/v1/me").json()["avatarUrl"] == url

    image = api.get(url)
    assert image.status_code == 200
    assert image.headers["content-type"] == "image/png"
    assert image.content == PNG

    assert api.delete("/api/v1/me/avatar").status_code == 204
    assert api.get(url).status_code == 404
    assert api.get("/api/v1/me").json()["avatarUrl"] is None


def test_avatar_rejects_fake_images_and_large_files(api: TestClient, clinician: Doctor) -> None:
    fake = api.put("/api/v1/me/avatar", files={"file": ("me.png", b"<html>", "image/png")})
    assert fake.status_code == 415
    large = api.put(
        "/api/v1/me/avatar", files={"file": ("me.png", PNG + b"\x00" * 2_200_000, "image/png")}
    )
    assert large.status_code == 413
