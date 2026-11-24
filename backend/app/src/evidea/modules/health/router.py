from typing import Literal

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from evidea.core.db import get_session
from evidea.core.logging import get_logger
from evidea.core.schemas import ApiModel

router = APIRouter(prefix="/health", tags=["Health"])
log = get_logger(__name__)

CheckStatus = Literal["ok", "unavailable"]


class Health(ApiModel):
    status: CheckStatus
    checks: dict[str, CheckStatus] | None = None


@router.get(
    "/live", response_model=Health, response_model_exclude_none=True, operation_id="liveness"
)
def liveness() -> Health:
    return Health(status="ok")


@router.get(
    "/ready",
    response_model=Health,
    responses={503: {"model": Health}},
    operation_id="readiness",
)
def readiness(session: Session = Depends(get_session)) -> Health | JSONResponse:
    try:
        session.execute(text("SELECT 1"))
    except SQLAlchemyError:
        log.warning("readiness_database_unavailable")
        body = Health(status="unavailable", checks={"database": "unavailable"})
        return JSONResponse(body.model_dump(by_alias=True), status_code=503)
    return Health(status="ok", checks={"database": "ok"})
