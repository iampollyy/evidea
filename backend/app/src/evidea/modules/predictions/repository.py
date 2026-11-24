from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from evidea.modules.doctors.models import Doctor
from evidea.modules.predictions.models import (
    Disease,
    DiseaseHypothesis,
    ModelVersion,
    PredictionExplanation,
    PredictionRun,
)

OPEN_STATUSES = ("pending", "processing")
ONE_OPEN_RUN_CONSTRAINT = "uq_prediction_runs_one_open_per_case"

RunRow = tuple[PredictionRun, ModelVersion, Doctor]


class PredictionRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def active_model(self) -> ModelVersion | None:
        return self.session.scalars(select(ModelVersion).where(ModelVersion.is_active)).first()

    def active_diseases(self) -> list[Disease]:
        return list(
            self.session.scalars(
                select(Disease).where(Disease.is_active).order_by(Disease.orpha_code)
            )
        )

    def open_run(self, case_id: UUID) -> PredictionRun | None:
        return self.session.scalars(
            select(PredictionRun).where(
                PredictionRun.case_id == case_id, PredictionRun.status.in_(OPEN_STATUSES)
            )
        ).first()

    def add_run(self, run: PredictionRun) -> None:
        self.session.add(run)
        self.session.flush()

    def get_run(self, run_id: UUID) -> RunRow | None:
        row = self.session.execute(
            select(PredictionRun, ModelVersion, Doctor)
            .join(ModelVersion, ModelVersion.id == PredictionRun.model_version_id)
            .join(Doctor, Doctor.id == PredictionRun.initiated_by)
            .where(PredictionRun.id == run_id)
        ).first()
        return (row[0], row[1], row[2]) if row else None

    def list_runs(self, case_id: UUID, *, page: int, page_size: int) -> tuple[list[RunRow], int]:
        rows = self.session.execute(
            select(PredictionRun, ModelVersion, Doctor)
            .join(ModelVersion, ModelVersion.id == PredictionRun.model_version_id)
            .join(Doctor, Doctor.id == PredictionRun.initiated_by)
            .where(PredictionRun.case_id == case_id)
            .order_by(PredictionRun.created_at.desc(), PredictionRun.id)
            .limit(page_size)
            .offset((page - 1) * page_size)
        ).all()
        total = self.session.scalar(
            select(func.count(PredictionRun.id)).where(PredictionRun.case_id == case_id)
        )
        return [(r[0], r[1], r[2]) for r in rows], int(total or 0)

    def hypotheses(self, run_id: UUID) -> list[tuple[DiseaseHypothesis, Disease]]:
        rows = self.session.execute(
            select(DiseaseHypothesis, Disease)
            .join(Disease, Disease.id == DiseaseHypothesis.disease_id)
            .where(DiseaseHypothesis.prediction_run_id == run_id)
            .order_by(DiseaseHypothesis.rank)
        ).all()
        return [(r[0], r[1]) for r in rows]

    def get_hypothesis(self, hypothesis_id: UUID) -> DiseaseHypothesis | None:
        return self.session.get(DiseaseHypothesis, hypothesis_id)

    def explanations(self, hypothesis_id: UUID) -> list[PredictionExplanation]:
        return list(
            self.session.scalars(
                select(PredictionExplanation)
                .where(PredictionExplanation.hypothesis_id == hypothesis_id)
                .order_by(PredictionExplanation.created_at.desc(), PredictionExplanation.id)
            )
        )

    def claim_next_pending(self) -> PredictionRun | None:
        return self.session.scalars(
            select(PredictionRun)
            .where(PredictionRun.status == "pending")
            .order_by(PredictionRun.created_at, PredictionRun.id)
            .limit(1)
            .with_for_update(skip_locked=True)
        ).first()

    def stuck_runs(self, *, started_before: datetime) -> list[PredictionRun]:
        return list(
            self.session.scalars(
                select(PredictionRun)
                .where(
                    PredictionRun.status == "processing",
                    PredictionRun.started_at < started_before,
                )
                .with_for_update(skip_locked=True)
            )
        )
