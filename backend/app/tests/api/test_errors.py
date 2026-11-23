from collections.abc import Iterator
from datetime import date
from typing import Any

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import field_validator

from evidea.core.errors import (
    ConflictError,
    DomainValidationError,
    NotFoundError,
    RateLimitedError,
)
from evidea.core.schemas import InputModel


class Probe(InputModel):
    birth_date: date

    @field_validator("birth_date")
    @classmethod
    def not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Date of birth cannot be in the future")
        return value


@pytest.fixture
def probe_client(app: FastAPI) -> Iterator[TestClient]:
    @app.get("/probe/not-found")
    def not_found() -> None:
        raise NotFoundError()

    @app.get("/probe/conflict")
    def conflict() -> None:
        raise ConflictError(
            "Archived patients cannot be changed.",
            code="PATIENT_ARCHIVED",
            title="Patient is archived",
        )

    @app.get("/probe/rate-limited")
    def rate_limited() -> None:
        raise RateLimitedError(retry_after_seconds=42)

    @app.get("/probe/domain")
    def domain() -> None:
        raise DomainValidationError(
            [{"field": "labReports.0.results.0.analyteId", "message": "x", "code": "y"}]
        )

    @app.get("/probe/crash")
    def crash() -> None:
        raise RuntimeError("boom")

    @app.post("/probe/body")
    def body(payload: Probe) -> dict[str, str]:
        return {"ok": "yes"}

    with TestClient(app) as test_client:
        yield test_client


def assert_problem(response: httpx.Response, status: int, code: str) -> dict[str, Any]:
    assert response.status_code == status
    assert response.headers["content-type"] == "application/problem+json"
    body: dict[str, Any] = response.json()
    assert body["status"] == status
    assert body["code"] == code
    assert body["type"].startswith("https://evidea.example/problems/")
    assert body["requestId"] == response.headers["X-Request-ID"]
    return body


def test_app_error(probe_client: TestClient) -> None:
    assert_problem(probe_client.get("/probe/not-found"), 404, "NOT_FOUND")


def test_conflict_with_custom_code(probe_client: TestClient) -> None:
    body = assert_problem(probe_client.get("/probe/conflict"), 409, "PATIENT_ARCHIVED")
    assert body["title"] == "Patient is archived"
    assert body["detail"] == "Archived patients cannot be changed."


def test_rate_limited_sets_retry_after(probe_client: TestClient) -> None:
    response = probe_client.get("/probe/rate-limited")
    assert_problem(response, 429, "RATE_LIMITED")
    assert response.headers["Retry-After"] == "42"


def test_domain_validation_lists_errors(probe_client: TestClient) -> None:
    body = assert_problem(probe_client.get("/probe/domain"), 422, "VALIDATION_ERROR")
    assert body["errors"][0]["field"] == "labReports.0.results.0.analyteId"


def test_request_validation_uses_camel_case_paths_and_clean_messages(
    probe_client: TestClient,
) -> None:
    response = probe_client.post("/probe/body", json={"birthDate": "2999-01-01"})
    body = assert_problem(response, 422, "VALIDATION_ERROR")
    assert body["errors"] == [
        {
            "field": "birthDate",
            "message": "Date of birth cannot be in the future",
            "code": "value_error",
        }
    ]


def test_unknown_fields_and_invalid_json_are_rejected(probe_client: TestClient) -> None:
    extra = probe_client.post("/probe/body", json={"birthDate": "2000-01-01", "hack": 1})
    assert assert_problem(extra, 422, "VALIDATION_ERROR")["errors"][0]["field"] == "hack"
    broken = probe_client.post(
        "/probe/body", content=b"{not json", headers={"Content-Type": "application/json"}
    )
    assert_problem(broken, 422, "VALIDATION_ERROR")


def test_unparseable_json_returns_bad_request_problem(probe_client: TestClient) -> None:
    response = probe_client.post(
        "/api/v1/auth/login",
        content=b"\x00" * 9,
        headers={"Content-Type": "application/json"},
    )
    assert_problem(response, 400, "BAD_REQUEST")


def test_unknown_route_and_wrong_method(probe_client: TestClient) -> None:
    assert_problem(probe_client.get("/api/v1/does-not-exist"), 404, "NOT_FOUND")
    assert_problem(probe_client.delete("/probe/not-found"), 405, "METHOD_NOT_ALLOWED")


def test_unexpected_exception_becomes_500_problem(probe_client: TestClient) -> None:
    body = assert_problem(probe_client.get("/probe/crash"), 500, "INTERNAL_ERROR")
    assert "boom" not in str(body)


def test_foreign_origin_is_rejected_for_unsafe_methods(probe_client: TestClient) -> None:
    response = probe_client.post(
        "/probe/body", json={"birthDate": "2000-01-01"}, headers={"Origin": "https://evil.example"}
    )
    assert_problem(response, 403, "FORBIDDEN")


@pytest.mark.parametrize("headers", [{"Origin": "http://localhost:5173"}, {}])
def test_own_or_missing_origin_is_allowed(
    probe_client: TestClient, headers: dict[str, str]
) -> None:
    response = probe_client.post("/probe/body", json={"birthDate": "2000-01-01"}, headers=headers)
    assert response.status_code == 200


def test_safe_methods_ignore_origin(probe_client: TestClient) -> None:
    response = probe_client.get("/probe/not-found", headers={"Origin": "https://evil.example"})
    assert response.status_code == 404
