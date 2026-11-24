from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from evidea.core.errors import ConflictError, NotFoundError, ServiceUnavailableError
from evidea.core.sql import violated_constraint
from evidea.domain.person import age_on
from evidea.modules.audit.service import record_event
from evidea.modules.cases.service import CaseService, CaseView
from evidea.modules.doctors.models import Doctor
from evidea.modules.patients.models import Patient
from evidea.modules.patients.repository import PatientRepository
from evidea.modules.patients.service import PatientArchivedError
from evidea.modules.predictions.inference import LabFeature, build_input_snapshot
from evidea.modules.predictions.models import (
    Disease,
    DiseaseHypothesis,
    PredictionExplanation,
    PredictionRun,
)
from evidea.modules.predictions.repository import (
    ONE_OPEN_RUN_CONSTRAINT,
    PredictionRepository,
    RunRow,
)

RETRY_AFTER_SECONDS = 2


class PredictionRunInProgressError(ConflictError):
    code, title = (
        "PREDICTION_RUN_IN_PROGRESS",
        "A prediction run is already in progress for this case",
    )

    def __init__(self, existing_run_id: UUID) -> None:
        super().__init__(extra={"existingRunId": str(existing_run_id)})


class NoActiveModelError(ServiceUnavailableError):
    code, title = "NO_ACTIVE_MODEL", "No active prediction model"


@dataclass(frozen=True)
class RunView:
    row: RunRow
    hypotheses: list[tuple[DiseaseHypothesis, Disease]]


def utcnow() -> datetime:
    return datetime.now(UTC)


def snapshot_from_case(view: CaseView, patient: Patient, today: datetime) -> dict[str, object]:
    anamnesis = view.anamnesis
    latest_vitals = view.vital_signs[-1] if view.vital_signs else None
    return build_input_snapshot(
        anamnesis={
            "chief_complaint": anamnesis.chief_complaint,
            "symptoms_duration": anamnesis.symptoms_duration,
            "clinical_notes": anamnesis.clinical_notes,
            "family_history": anamnesis.family_history,
            "medications": anamnesis.medications,
            "past_medical_history": anamnesis.past_medical_history,
            "allergies": anamnesis.allergies,
        },
        vital_signs=(
            {
                "weight_kg": _float(latest_vitals.weight_kg),
                "systolic_bp_mmhg": latest_vitals.systolic_bp_mmhg,
                "diastolic_bp_mmhg": latest_vitals.diastolic_bp_mmhg,
                "heart_rate_bpm": latest_vitals.heart_rate_bpm,
                "respiratory_rate": latest_vitals.respiratory_rate,
                "body_temp_celsius": _float(latest_vitals.body_temp_celsius),
                "spo2_percent": latest_vitals.spo2_percent,
            }
            if latest_vitals
            else None
        ),
        lab_features=[
            LabFeature(
                code=result.analyte.code,
                name=result.analyte.name,
                unit=result.analyte.unit,
                value=result.value,
            )
            for report in view.lab_reports
            for result in report.results
        ],
        age_years=age_on(patient.birth_date, today.date()),
        sex=patient.sex,
    )


def _float(value: object) -> float | None:
    return None if value is None else float(str(value))


class PredictionService:
    def __init__(self, session: Session, *, clock: Callable[[], datetime] = utcnow) -> None:
        self.session = session
        self.repo = PredictionRepository(session)
        self.cases = CaseService(session, clock=clock)
        self.patients = PatientRepository(session)
        self.clock = clock

    def request_run(self, case_id: UUID, *, actor: Doctor) -> RunView:
        case_view = self.cases.get(case_id)
        patient = self.patients.get(case_view.case.patient_id)
        if patient is None:
            raise NotFoundError()
        if patient.is_archived:
            raise PatientArchivedError()
        existing = self.repo.open_run(case_id)
        if existing is not None:
            raise PredictionRunInProgressError(existing.id)
        model = self.repo.active_model()
        if model is None:
            raise NoActiveModelError("Register and activate a model version first.")

        run = PredictionRun(
            initiated_by=actor.id,
            case_id=case_id,
            model_version_id=model.id,
            input_snapshot=snapshot_from_case(case_view, patient, self.clock()),
        )
        try:
            self.repo.add_run(run)
        except IntegrityError as error:
            self.session.rollback()
            if violated_constraint(error) == ONE_OPEN_RUN_CONSTRAINT:
                current = self.repo.open_run(case_id)
                if current is not None:
                    raise PredictionRunInProgressError(current.id) from error
            raise
        record_event(self.session, "prediction.requested", actor_id=actor.id, case_id=case_id)
        self.session.commit()
        return self.get_run(run.id)

    def get_run(self, run_id: UUID) -> RunView:
        row = self.repo.get_run(run_id)
        if row is None:
            raise NotFoundError()
        hypotheses = self.repo.hypotheses(run_id) if row[0].status == "completed" else []
        return RunView(row=row, hypotheses=hypotheses)

    def list_runs(self, case_id: UUID, *, page: int, page_size: int) -> tuple[list[RunRow], int]:
        if self.cases.repo.get(case_id) is None:
            raise NotFoundError()
        return self.repo.list_runs(case_id, page=page, page_size=page_size)

    def explanations(self, hypothesis_id: UUID) -> list[PredictionExplanation]:
        if self.repo.get_hypothesis(hypothesis_id) is None:
            raise NotFoundError()
        return self.repo.explanations(hypothesis_id)
