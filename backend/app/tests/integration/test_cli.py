import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from evidea.cli import CREDENTIAL_ENV_VAR, run
from tests.integration.conftest import MakeDoctor, login

ARGS = ["create-user", "--email", "admin@clinic.example", "--name", "Dev", "--surname", "Admin"]


def test_create_user_makes_an_active_account_that_can_sign_in(
    api: TestClient,
    app_session_factory: sessionmaker[Session],
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setenv(CREDENTIAL_ENV_VAR, "Admin#2026")

    assert run([*ARGS, "--role", "admin"], app_session_factory) == 0

    assert "Created admin admin@clinic.example" in capsys.readouterr().out
    login(api, "admin@clinic.example", "Admin#2026")
    me = api.get("/api/v1/me").json()
    assert me["role"] == "admin" and me["status"] == "active"


def test_create_user_rejects_weak_password_duplicates_and_bad_input(
    api: TestClient,
    app_session_factory: sessionmaker[Session],
    make_doctor: MakeDoctor,
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    monkeypatch.setenv(CREDENTIAL_ENV_VAR, "weak")
    assert run([*ARGS, "--role", "admin"], app_session_factory) == 1
    assert "uppercase" in capsys.readouterr().err

    make_doctor(email="admin@clinic.example")
    monkeypatch.setenv(CREDENTIAL_ENV_VAR, "Admin#2026")
    assert run([*ARGS, "--role", "admin"], app_session_factory) == 1
    assert "already exists" in capsys.readouterr().err

    bad = ["create-user", "--email", "nope", "--name", "D", "--surname", "Admin", "--role", "admin"]
    assert run(bad, app_session_factory) == 2
    errors = capsys.readouterr().err
    assert "email" in errors and "name" in errors
