from collections.abc import Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from evidea.core.config import Settings
from evidea.main import create_app

TEST_SECRET = "test-secret-key-that-is-long-enough-1234567890"


@pytest.fixture
def settings() -> Settings:
    return Settings(
        DATABASE_APP_URL="postgresql://nobody:nothing@127.0.0.1:1/unreachable",
        JWT_SECRET=TEST_SECRET,
        db_connect_timeout_seconds=2,
        environment="test",
        log_json=False,
        log_level="WARNING",
    )


@pytest.fixture
def app(settings: Settings) -> FastAPI:
    return create_app(settings)


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app) as test_client:
        yield test_client
