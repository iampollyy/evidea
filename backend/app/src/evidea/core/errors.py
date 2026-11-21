from collections.abc import Mapping
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from evidea.core.logging import request_id_var

PROBLEM_CONTENT_TYPE = "application/problem+json"


class AppError(Exception):
    status: int = 500
    code: str = "INTERNAL_ERROR"
    title: str = "Internal server error"

    def __init__(
        self,
        detail: str | None = None,
        *,
        title: str | None = None,
        code: str | None = None,
        extra: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> None:
        super().__init__(detail or title or self.title)
        self.detail = detail
        if title is not None:
            self.title = title
        if code is not None:
            self.code = code
        self.extra = extra or {}
        self.headers = headers


class UnauthenticatedError(AppError):
    status, code, title = 401, "UNAUTHENTICATED", "Authentication required"


class InvalidCredentialsError(AppError):
    status, code, title = 401, "INVALID_CREDENTIALS", "Invalid email or password"


class ForbiddenError(AppError):
    status, code, title = 403, "FORBIDDEN", "Forbidden"


class NotFoundError(AppError):
    status, code, title = 404, "NOT_FOUND", "Resource not found"


class ConflictError(AppError):
    """409 with a specific code, e.g. EMAIL_ALREADY_USED or PATIENT_ARCHIVED."""

    status = 409


class BadRequestError(AppError):
    status = 400


class RateLimitedError(AppError):
    status, code, title = 429, "RATE_LIMITED", "Too many attempts"

    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(headers={"Retry-After": str(retry_after_seconds)})


class PayloadTooLargeError(AppError):
    status, code, title = 413, "PAYLOAD_TOO_LARGE", "File is too large"


class UnsupportedMediaTypeError(AppError):
    status, code, title = 415, "UNSUPPORTED_MEDIA_TYPE", "Unsupported file type"


class ServiceUnavailableError(AppError):
    status = 503


class DomainValidationError(AppError):
    status, code, title = 422, "VALIDATION_ERROR", "Validation failed"

    def __init__(self, errors: list[dict[str, str]]) -> None:
        super().__init__(extra={"errors": errors})


def problem_body(
    *, status: int, code: str, title: str, detail: str | None = None, **extra: Any
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "type": f"https://evidea.example/problems/{code.lower().replace('_', '-')}",
        "title": title,
        "status": status,
        "code": code,
        "requestId": request_id_var.get() or "unknown",
    }
    if detail:
        body["detail"] = detail
    body.update(extra)
    return body


def problem_response(
    *,
    status: int,
    code: str,
    title: str,
    detail: str | None = None,
    headers: Mapping[str, str] | None = None,
    **extra: Any,
) -> JSONResponse:
    return JSONResponse(
        problem_body(status=status, code=code, title=title, detail=detail, **extra),
        status_code=status,
        media_type=PROBLEM_CONTENT_TYPE,
        headers=headers,
    )


def _field_path(loc: tuple[int | str, ...]) -> str:
    parts = [str(p) for p in loc]
    if parts and parts[0] in {"body", "query", "path", "header", "cookie"}:
        parts = parts[1:]
    return ".".join(parts) or "body"


def _message(raw: str) -> str:
    return raw.removeprefix("Value error, ")


_HTTP_CODES = {
    401: ("UNAUTHENTICATED", "Authentication required"),
    403: ("FORBIDDEN", "Forbidden"),
    404: ("NOT_FOUND", "Resource not found"),
    405: ("METHOD_NOT_ALLOWED", "Method not allowed"),
    413: ("PAYLOAD_TOO_LARGE", "File is too large"),
}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return problem_response(
            status=exc.status,
            code=exc.code,
            title=exc.title,
            detail=exc.detail,
            headers=exc.headers,
            **exc.extra,
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {
                "field": _field_path(tuple(e["loc"])),
                "message": _message(e["msg"]),
                "code": e["type"],
            }
            for e in exc.errors()
        ]
        return problem_response(
            status=422, code="VALIDATION_ERROR", title="Validation failed", errors=errors
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code, title = _HTTP_CODES.get(exc.status_code, ("INTERNAL_ERROR", "Internal server error"))
        return problem_response(status=exc.status_code, code=code, title=title, headers=exc.headers)
