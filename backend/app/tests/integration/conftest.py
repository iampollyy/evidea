import os
from collections.abc import Callable, Iterator
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine, create_engine, select, text
from sqlalchemy.orm import Session, sessionmaker

from evidea.adapters.email import OutgoingEmail
from evidea.core.config import Settings
from evidea.core.db import create_db_engine, create_session_factory
from evidea.core.security import (
    generate_one_time_token,
    hash_one_time_token,
    hash_password,
    unusable_password_hash,
)
from evidea.main import create_app
from evidea.modules.audit.models import AuditLog
from evidea.modules.doctors.models import Doctor, Invitation, Role
from tests.conftest import TEST_SECRET

PASSWORD = "Clinic#2026"

_TABLES_TO_RESET = (
    "doctors_and_admin, patients, system_logs, lab_categories, model_versions, diseases"
)


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    for item in items:
        if "integration" in item.path.parts:
            item.add_marker(pytest.mark.integration)


def _psycopg(url: str) -> str:
    return url.replace("postgresql://", "postgresql+psycopg://", 1)


@pytest.fixture(scope="session")
def owner_engine() -> Iterator[Engine]:
    owner_url = os.environ.get("TEST_DATABASE_URL")
    app_url = os.environ.get("TEST_DATABASE_APP_URL")
    if not owner_url or not app_url:
        message = "integration tests need TEST_DATABASE_URL and TEST_DATABASE_APP_URL"
        if os.environ.get("REQUIRE_INTEGRATION_TESTS") == "1":
            pytest.fail(message)
        pytest.skip(message)
    engine = create_engine(_psycopg(owner_url))
    yield engine
    engine.dispose()


@pytest.fixture
def owner_session(owner_engine: Engine) -> Iterator[Session]:

    with owner_engine.begin() as connection:
        connection.execute(text(f"TRUNCATE {_TABLES_TO_RESET} CASCADE"))
    with Session(owner_engine, expire_on_commit=False) as session:
        yield session


@pytest.fixture
def storage_dir(tmp_path: Path) -> Path:
    return tmp_path / "storage"


class FakeEmailSender:
    def __init__(self) -> None:
        self.outbox: list[OutgoingEmail] = []
        self.fail = False

    def send(self, email: OutgoingEmail) -> None:
        if self.fail:
            raise ConnectionError("SMTP server unavailable")
        self.outbox.append(email)


@pytest.fixture
def mailer() -> FakeEmailSender:
    return FakeEmailSender()


@pytest.fixture
def api(owner_session: Session, storage_dir: Path, mailer: FakeEmailSender) -> Iterator[TestClient]:
    settings = Settings(
        DATABASE_APP_URL=os.environ["TEST_DATABASE_APP_URL"],
        JWT_SECRET=TEST_SECRET,
        environment="test",
        storage_dir=storage_dir,
        log_json=False,
        log_level="WARNING",
    )
    app = create_app(settings)
    app.state.email_sender = mailer

    with TestClient(app, base_url="https://testserver") as client:
        yield client


MakeDoctor = Callable[..., Doctor]


@pytest.fixture
def make_doctor(owner_session: Session) -> MakeDoctor:
    counter = iter(range(1, 1000))

    def factory(
        role: str = "clinician",
        *,
        email: str | None = None,
        password: str | None = PASSWORD,
        deactivated: bool = False,
        **fields: Any,
    ) -> Doctor:
        role_row = owner_session.scalars(select(Role).where(Role.name == role)).one()
        doctor = Doctor(
            name=fields.pop("name", "Sarah"),
            surname=fields.pop("surname", "Chen"),
            email=email or f"doctor{next(counter)}@clinic.example",
            role_id=role_row.id,
            password_hash=hash_password(password) if password else unusable_password_hash(),
            deactivated_at=datetime.now(UTC) if deactivated else None,
            **fields,
        )
        owner_session.add(doctor)
        owner_session.commit()
        return doctor

    return factory


@pytest.fixture
def make_invitation(owner_session: Session) -> Callable[..., str]:
    def factory(doctor: Doctor, *, expires_in: timedelta = timedelta(hours=72)) -> str:
        token = generate_one_time_token()
        owner_session.add(
            Invitation(
                doctor_id=doctor.id,
                token_hash=hash_one_time_token(token),
                expires_at=datetime.now(UTC) + expires_in,
            )
        )
        owner_session.commit()
        return token

    return factory


def login(client: TestClient, email: str, password: str = PASSWORD) -> None:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text


@pytest.fixture
def clinician(api: TestClient, make_doctor: MakeDoctor) -> Doctor:
    doctor = make_doctor("clinician")
    login(api, doctor.email)
    return doctor


@pytest.fixture
def admin(api: TestClient, make_doctor: MakeDoctor) -> Doctor:
    doctor = make_doctor("admin", name="Dev", surname="Admin")
    login(api, doctor.email)
    return doctor


def audit_messages(session: Session, user_id: UUID | None = None) -> list[str]:
    stmt = select(AuditLog.message).order_by(AuditLog.created_at)
    if user_id is not None:
        stmt = stmt.where(AuditLog.user_id == user_id)
    return list(session.scalars(stmt))


@dataclass(frozen=True)
class Catalog:
    muscle_panel: UUID
    cbc_panel: UUID
    inactive_panel: UUID
    ck: UUID
    alt: UUID
    myoglobinuria: UUID
    comment: UUID
    hgb: UUID
    retired: UUID


@pytest.fixture
def lab_catalog(owner_session: Session) -> Catalog:
    ids = {name: uuid4() for name in Catalog.__dataclass_fields__}
    hem, bio = uuid4(), uuid4()
    statements = [
        (
            "INSERT INTO lab_categories (category_id, code, name, is_active) VALUES "
            "(:hem, 'HEM', 'Hematology', TRUE), (:bio, 'BIO', 'Biochemistry', TRUE)"
        ),
        (
            "INSERT INTO lab_panels (panel_id, category_id, code, name, is_active) VALUES "
            "(:muscle_panel, :bio, 'MUSCLE', 'Muscle enzymes', TRUE), "
            "(:cbc_panel, :hem, 'CBC', 'Complete blood count', TRUE), "
            "(:inactive_panel, :bio, 'OLD', 'Retired panel', FALSE)"
        ),
        (
            "INSERT INTO lab_analytes "
            "(analyte_id, panel_id, code, name, unit, data_type, is_active) VALUES "
            "(:ck, :muscle_panel, 'CK', 'Creatine Kinase', 'U/L', 'numeric', TRUE), "
            "(:alt, :muscle_panel, 'ALT', 'Alanine aminotransferase', 'U/L', 'numeric', TRUE), "
            "(:myoglobinuria, :muscle_panel, 'MYO_U', 'Myoglobinuria', NULL, 'boolean', TRUE), "
            "(:comment, :muscle_panel, 'COMMENT', 'Sample comment', NULL, 'text', TRUE), "
            "(:hgb, :cbc_panel, 'HGB', 'Hemoglobin', 'g/dL', 'numeric', TRUE), "
            "(:retired, :muscle_panel, 'OLD_X', 'Retired analyte', NULL, 'numeric', FALSE)"
        ),
    ]
    for statement in statements:
        owner_session.execute(text(statement), {**ids, "hem": hem, "bio": bio})
    owner_session.commit()
    return Catalog(**ids)


@pytest.fixture(scope="session")
def app_session_factory(owner_engine: Engine) -> Iterator[sessionmaker[Session]]:
    engine = create_db_engine(
        os.environ["TEST_DATABASE_APP_URL"].replace("postgresql://", "postgresql+psycopg://", 1)
    )
    yield create_session_factory(engine)
    engine.dispose()


@dataclass(frozen=True)
class ModelSetup:
    model_id: UUID
    disease_ids: list[UUID]
    inactive_disease_id: UUID


@pytest.fixture
def active_model(owner_session: Session) -> ModelSetup:
    model_id = uuid4()
    owner_session.execute(
        text(
            "INSERT INTO model_versions "
            "(model_version_id, name, version, artifact_uri, trained_at, is_active) "
            "VALUES (:m, 'evidea-stub (demo)', '0.1.0-demo', 'stub://evidea/demo', now(), TRUE)"
        ),
        {"m": model_id},
    )
    disease_ids = [uuid4() for _ in range(7)]
    for number, disease_id in enumerate(disease_ids, start=1):
        owner_session.execute(
            text("INSERT INTO diseases (disease_id, orpha_code, name) VALUES (:d, :o, :n)"),
            {"d": disease_id, "o": f"ORPHA:{900 + number}", "n": f"Test disease {number}"},
        )
    inactive = uuid4()
    owner_session.execute(
        text(
            "INSERT INTO diseases (disease_id, orpha_code, name, is_active) "
            "VALUES (:d, 'ORPHA:999', 'Retired disease', FALSE)"
        ),
        {"d": inactive},
    )
    owner_session.commit()
    return ModelSetup(model_id, disease_ids, inactive)
