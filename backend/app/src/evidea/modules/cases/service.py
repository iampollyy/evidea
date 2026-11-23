from collections import defaultdict
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from evidea.core.errors import DomainValidationError, NotFoundError
from evidea.modules.audit.service import record_event
from evidea.modules.cases.domain import from_columns, to_columns, validate_lab_reports
from evidea.modules.cases.models import (
    Case,
    CaseAnamnesis,
    LabReport,
    LabResultItem,
    VitalSigns,
)
from evidea.modules.cases.repository import (
    CaseRepository,
    CaseSummaryRow,
    LatestPredictionRow,
    NewLabReport,
)
from evidea.modules.cases.schemas import AnamnesisReplace, CaseCreate
from evidea.modules.catalog.models import LabAnalyte, LabPanel
from evidea.modules.catalog.repository import CatalogRepository
from evidea.modules.doctors.models import Doctor
from evidea.modules.patients.models import Patient
from evidea.modules.patients.repository import PatientRepository
from evidea.modules.patients.service import PatientArchivedError


def utcnow() -> datetime:
    return datetime.now(UTC)


@dataclass(frozen=True)
class LabResultView:
    item: LabResultItem
    analyte: LabAnalyte
    value: bool | int | float | str


@dataclass(frozen=True)
class LabReportView:
    report: LabReport
    panel: LabPanel
    results: list[LabResultView]


@dataclass(frozen=True)
class CaseView:
    case: Case
    author: Doctor
    anamnesis: CaseAnamnesis
    anamnesis_author: Doctor
    vital_signs: list[VitalSigns]
    lab_reports: list[LabReportView]
    latest_prediction: LatestPredictionRow | None


class CaseService:
    def __init__(self, session: Session, *, clock: Callable[[], datetime] = utcnow) -> None:
        self.session = session
        self.repo = CaseRepository(session)
        self.patients = PatientRepository(session)
        self.catalog = CatalogRepository(session)
        self.clock = clock

    def create(self, patient_id: UUID, data: CaseCreate, *, actor: Doctor) -> CaseView:
        patient = self._active_patient(patient_id)

        panels = self.catalog.panels_by_id(r.panel_id for r in data.lab_reports)
        analytes = self.catalog.analytes_by_id(
            item.analyte_id for r in data.lab_reports for item in r.results
        )
        errors = validate_lab_reports(
            data.lab_reports, panels=panels, analytes=analytes, now=self.clock()
        )
        if errors:
            raise DomainValidationError(errors)

        case = Case(id=uuid4(), patient_id=patient.id, created_by=actor.id)
        anamnesis = CaseAnamnesis(
            patient_id=patient.id,
            case_id=case.id,
            created_by_id=actor.id,
            **data.anamnesis.model_dump(),
        )
        vital_signs = (
            VitalSigns(patient_id=patient.id, **data.vital_signs.model_dump())
            if data.vital_signs
            else None
        )
        lab_reports = []
        for report_in in data.lab_reports:
            report = LabReport(
                id=uuid4(),
                patient_id=patient.id,
                panel_id=report_in.panel_id,
                collected_at=report_in.collected_at,
            )
            items = []
            for result in report_in.results:
                numeric_val, text_val = to_columns(result.value)
                items.append(
                    LabResultItem(
                        report_id=report.id,
                        analyte_id=result.analyte_id,
                        numeric_val=numeric_val,
                        text_val=text_val,
                    )
                )
            lab_reports.append(NewLabReport(report, items))

        self.repo.add_case(case, anamnesis, vital_signs, lab_reports)
        record_event(self.session, "case.created", actor_id=actor.id, case_id=case.id)
        self.session.commit()
        return self.get(case.id)

    def replace_anamnesis(
        self, case_id: UUID, data: AnamnesisReplace, *, actor: Doctor
    ) -> tuple[CaseAnamnesis, Doctor]:
        case = self._get_case(case_id)
        self._active_patient(case.patient_id)
        found = self.repo.get_anamnesis(case_id, for_update=True)
        if found is None:
            raise NotFoundError()
        anamnesis, author = found
        for field, value in data.model_dump().items():
            setattr(anamnesis, field, value)
        record_event(self.session, "case.anamnesis_updated", actor_id=actor.id, case_id=case_id)
        self.session.commit()
        return anamnesis, author

    def get(self, case_id: UUID) -> CaseView:
        case = self._get_case(case_id)
        found = self.repo.get_anamnesis(case_id)
        if found is None:
            raise NotFoundError()
        reports = self.repo.lab_reports(case_id)
        results_by_report: dict[UUID, list[LabResultView]] = defaultdict(list)
        for item, analyte in self.repo.lab_results([r.id for r, _ in reports]):
            value = from_columns(item.numeric_val, item.text_val, analyte.data_type)
            results_by_report[item.report_id].append(LabResultView(item, analyte, value))
        return CaseView(
            case=case,
            author=self.repo.get_author(case),
            anamnesis=found[0],
            anamnesis_author=found[1],
            vital_signs=self.repo.vital_signs(case_id),
            lab_reports=[
                LabReportView(report, panel, results_by_report[report.id])
                for report, panel in reports
            ],
            latest_prediction=self.repo.latest_predictions([case_id]).get(case_id),
        )

    def list_for_patient(
        self, patient_id: UUID, *, page: int, page_size: int
    ) -> tuple[list[tuple[CaseSummaryRow, LatestPredictionRow | None]], int]:
        if self.patients.get(patient_id) is None:
            raise NotFoundError()
        rows, total = self.repo.list_for_patient(patient_id, page=page, page_size=page_size)
        latest = self.repo.latest_predictions(row.case.id for row in rows)
        return [(row, latest.get(row.case.id)) for row in rows], total

    def _get_case(self, case_id: UUID) -> Case:
        case = self.repo.get(case_id)
        if case is None:
            raise NotFoundError()
        return case

    def _active_patient(self, patient_id: UUID) -> Patient:
        patient = self.patients.get(patient_id)
        if patient is None:
            raise NotFoundError()
        if patient.is_archived:
            raise PatientArchivedError()
        return patient
