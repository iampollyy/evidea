from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from evidea.core.schemas import ApiModel
from evidea.modules.doctors.schemas import DoctorRef
from evidea.modules.predictions.models import Disease, DiseaseHypothesis, PredictionExplanation
from evidea.modules.predictions.repository import RunRow

RunStatus = Literal["pending", "processing", "completed", "failed", "unsupported"]


class ModelVersionRef(ApiModel):
    id: UUID
    name: str
    version: str


class DiseaseOut(ApiModel):
    id: UUID
    orpha_code: str
    name: str
    icd_code: str | None
    inheritance_type: str | None


class HypothesisOut(ApiModel):
    id: UUID
    rank: int
    score: float
    disease: DiseaseOut

    @classmethod
    def build(cls, hypothesis: DiseaseHypothesis, disease: Disease) -> "HypothesisOut":
        return cls(
            id=hypothesis.id,
            rank=hypothesis.rank,
            score=float(hypothesis.score),
            disease=DiseaseOut.model_validate(disease),
        )


class PredictionRunSummary(ApiModel):
    id: UUID
    case_id: UUID
    status: RunStatus
    model_version: ModelVersionRef
    initiated_by: DoctorRef
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    error_message: str | None

    @classmethod
    def build(cls, row: RunRow) -> "PredictionRunSummary":
        run, model, doctor = row
        return cls(
            id=run.id,
            case_id=run.case_id,
            status=run.status,
            model_version=ModelVersionRef.model_validate(model),
            initiated_by=DoctorRef(id=doctor.id, name=doctor.name, surname=doctor.surname),
            created_at=run.created_at,
            started_at=run.started_at,
            completed_at=run.completed_at,
            error_message=run.error_message,
        )


class PredictionRunOut(PredictionRunSummary):
    hypotheses: list[HypothesisOut]


class ExplanationOut(ApiModel):
    id: UUID
    method: Literal["shap", "lime"]
    summary: str | None
    data: dict[str, Any]
    created_at: datetime

    @classmethod
    def build(cls, explanation: PredictionExplanation) -> "ExplanationOut":
        return cls(
            id=explanation.id,
            method=explanation.method,
            summary=explanation.summary,
            data=explanation.data,
            created_at=explanation.created_at,
        )


class ExplanationList(ApiModel):
    items: list[ExplanationOut]
