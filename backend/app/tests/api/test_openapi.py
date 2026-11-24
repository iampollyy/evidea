import re
from pathlib import Path
from typing import Any

import yaml
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.testclient import TestClient

from evidea.core.config import Settings
from evidea.main import API_PREFIX, create_app

CONTRACT_PATH = Path(__file__).resolve().parents[4] / "docs" / "reference" / "openapi.yaml"
CONTRACT: dict[str, Any] = yaml.safe_load(CONTRACT_PATH.read_text(encoding="utf-8"))
HTTP_METHODS = {"get", "post", "put", "patch", "delete"}


def _operations(paths: dict[str, Any], prefix: str = "") -> set[tuple[str, str, str]]:
    return {
        (re.sub(r"\{[^}]+\}", "{}", path.removeprefix(prefix)), method, operation["operationId"])
        for path, methods in paths.items()
        for method, operation in methods.items()
        if method in HTTP_METHODS
    }


def test_default_settings_point_to_the_committed_contract(settings: Settings) -> None:
    assert settings.openapi_spec_path == CONTRACT_PATH


def test_swagger_serves_the_committed_contract(client: TestClient) -> None:
    served = client.get(f"{API_PREFIX}/openapi.json").json()

    assert served["info"] == CONTRACT["info"]
    assert served["paths"] == CONTRACT["paths"]
    assert served["components"]["securitySchemes"] == CONTRACT["components"]["securitySchemes"]
    assert served["servers"] == [{"url": API_PREFIX, "description": "This server"}]


def test_swagger_ui_is_served(client: TestClient) -> None:
    response = client.get(f"{API_PREFIX}/docs")

    assert response.status_code == 200
    assert f"{API_PREFIX}/openapi.json" in response.text


def test_contract_covers_every_implemented_operation(app: FastAPI) -> None:
    generated = get_openapi(title=app.title, version=app.version, routes=app.routes)

    assert _operations(generated["paths"], API_PREFIX) == _operations(CONTRACT["paths"])


def test_missing_contract_falls_back_to_generated_schema(
    settings: Settings, tmp_path: Path
) -> None:
    settings.openapi_spec_path = tmp_path / "missing.yaml"

    with TestClient(create_app(settings)) as client:
        served = client.get(f"{API_PREFIX}/openapi.json").json()

    assert served["info"] == {"title": "EVIDEA API", "version": CONTRACT["info"]["version"]}
    assert f"{API_PREFIX}/patients" in served["paths"]
