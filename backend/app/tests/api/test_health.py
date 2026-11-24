from pathlib import Path
from typing import Any

import pytest
import yaml
from fastapi.testclient import TestClient

OPENAPI_PATH = Path(__file__).resolve().parents[4] / "docs" / "reference" / "openapi.yaml"
OPENAPI: dict[str, Any] = yaml.safe_load(OPENAPI_PATH.read_text(encoding="utf-8"))


def test_liveness(client: TestClient) -> None:
    response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["X-Request-ID"]


def test_readiness_reports_unavailable_database(client: TestClient) -> None:
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 503
    assert response.json() == {"status": "unavailable", "checks": {"database": "unavailable"}}


@pytest.mark.parametrize(
    ("path", "status_code"),
    [("/health/live", 200), ("/health/ready", 503)],
)
def test_health_response_matches_openapi_example(
    client: TestClient, path: str, status_code: int
) -> None:
    response = client.get(f"/api/v1{path}")
    expected = OPENAPI["paths"][path]["get"]["responses"][str(status_code)]["content"][
        "application/json"
    ]["example"]

    assert response.status_code == status_code
    assert response.json() == expected


def test_request_id_is_echoed_when_valid(client: TestClient) -> None:
    response = client.get("/api/v1/health/live", headers={"X-Request-ID": "abc-123"})
    assert response.headers["X-Request-ID"] == "abc-123"


def test_invalid_request_id_is_replaced(client: TestClient) -> None:
    response = client.get("/api/v1/health/live", headers={"X-Request-ID": "bad id with spaces"})
    assert response.headers["X-Request-ID"] != "bad id with spaces"
    assert len(response.headers["X-Request-ID"]) == 36


def test_openapi_is_served_under_api_prefix(client: TestClient) -> None:
    assert client.get("/api/v1/openapi.json").status_code == 200
