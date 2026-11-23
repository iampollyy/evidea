from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from evidea.core.db import get_session
from evidea.core.schemas import Page, PageMeta
from evidea.modules.auth.dependencies import get_current_user
from evidea.modules.doctors.models import Doctor
from evidea.modules.predictions.schemas import (
    ExplanationList,
    ExplanationOut,
    HypothesisOut,
    PredictionRunOut,
    PredictionRunSummary,
)
from evidea.modules.predictions.service import RETRY_AFTER_SECONDS, PredictionService, RunView

router = APIRouter(tags=["Predictions"])


def get_prediction_service(session: Session = Depends(get_session)) -> PredictionService:
    return PredictionService(session)


def _run_out(view: RunView) -> PredictionRunOut:
    return PredictionRunOut(
        **PredictionRunSummary.build(view.row).model_dump(),
        hypotheses=[HypothesisOut.build(h, d) for h, d in view.hypotheses],
    )


@router.post(
    "/cases/{case_id}/prediction-runs",
    response_model=PredictionRunOut,
    status_code=status.HTTP_202_ACCEPTED,
    operation_id="createPredictionRun",
)
def create_prediction_run(
    case_id: UUID,
    response: Response,
    user: Doctor = Depends(get_current_user),
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionRunOut:
    view = service.request_run(case_id, actor=user)
    response.headers["Location"] = f"/api/v1/prediction-runs/{view.row[0].id}"
    response.headers["Retry-After"] = str(RETRY_AFTER_SECONDS)
    return _run_out(view)


@router.get(
    "/cases/{case_id}/prediction-runs",
    response_model=Page[PredictionRunSummary],
    operation_id="listCasePredictionRuns",
)
def list_case_prediction_runs(
    case_id: UUID,
    page: int = Query(1, ge=1, le=2_147_483_647),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    _: Doctor = Depends(get_current_user),
    service: PredictionService = Depends(get_prediction_service),
) -> Page[PredictionRunSummary]:
    rows, total = service.list_runs(case_id, page=page, page_size=page_size)
    return Page[PredictionRunSummary](
        items=[PredictionRunSummary.build(row) for row in rows],
        meta=PageMeta.build(page=page, page_size=page_size, total_items=total),
    )


@router.get(
    "/prediction-runs/{run_id}", response_model=PredictionRunOut, operation_id="getPredictionRun"
)
def get_prediction_run(
    run_id: UUID,
    _: Doctor = Depends(get_current_user),
    service: PredictionService = Depends(get_prediction_service),
) -> PredictionRunOut:
    return _run_out(service.get_run(run_id))


@router.get(
    "/hypotheses/{hypothesis_id}/explanations",
    response_model=ExplanationList,
    operation_id="listHypothesisExplanations",
)
def list_hypothesis_explanations(
    hypothesis_id: UUID,
    _: Doctor = Depends(get_current_user),
    service: PredictionService = Depends(get_prediction_service),
) -> ExplanationList:
    return ExplanationList(
        items=[ExplanationOut.build(e) for e in service.explanations(hypothesis_id)]
    )
