"""Data access for cases and their clinical data. Every read uses a fixed number of queries
(no query per row), regardless of how many vital signs or lab results a case has."""

from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import DateTime, Numeric, Text, Uuid, column, func, select, table
from sqlalchemy.orm import Session

from evidea.modules.cases.models import (
    Case,
    CaseAnamnesis,
    CaseLabReport,
    CaseVitalSigns,
    LabReport,
    LabResultItem,
    VitalSigns,
)
from evidea.modules.catalog.models import LabAnalyte, LabPanel
from evidea.modules.doctors.models import Doctor

v_case_latest_prediction = table(
    "v_case_latest_prediction",
    column("case_id", Uuid),
    column("prediction_run_id", Uuid),
    column("completed_at", DateTime(timezone=True)),
    column("top_disease", Text),
    column("top_score", Numeric),
)


@dataclass(frozen=True)
class LatestPredictionRow:
    run_id: UUID
    completed_at: datetime
    top_disease_name: str
    top_score: Decimal


@dataclass(frozen=True)
class CaseSummaryRow:
    case: Case
    author: Doctor
    chief_complaint: str


@dataclass(frozen=True)
class NewLabReport:
    report: LabReport
    items: list[LabResultItem]


class CaseRepository:
    def __init__(self, session: Session) -> None:
        self.session = session



    def get(self, case_id: UUID) -> Case | None:
        return self.session.get(Case, case_id)

    def get_anamnesis(
        self, case_id: UUID, *, for_update: bool = False
    ) -> tuple[CaseAnamnesis, Doctor] | None:
        stmt = (
            select(CaseAnamnesis, Doctor)
            .join(Doctor, Doctor.id == CaseAnamnesis.created_by_id)
            .where(CaseAnamnesis.case_id == case_id)
            .order_by(CaseAnamnesis.created_at)
        )
        if for_update:
            stmt = stmt.with_for_update(of=CaseAnamnesis)
        row = self.session.execute(stmt).first()
        return (row[0], row[1]) if row else None

    def get_author(self, case: Case) -> Doctor:
        return self.session.get_one(Doctor, case.created_by)

    def vital_signs(self, case_id: UUID) -> list[VitalSigns]:
        return list(
            self.session.scalars(
                select(VitalSigns)
                .join(CaseVitalSigns, CaseVitalSigns.vital_sign_id == VitalSigns.id)
                .where(CaseVitalSigns.case_id == case_id)
                .order_by(VitalSigns.created_at)
            )
        )

    def lab_reports(self, case_id: UUID) -> list[tuple[LabReport, LabPanel]]:
        rows = self.session.execute(
            select(LabReport, LabPanel)
            .join(CaseLabReport, CaseLabReport.report_id == LabReport.id)
            .join(LabPanel, LabPanel.id == LabReport.panel_id)
            .where(CaseLabReport.case_id == case_id)
            .order_by(LabReport.collected_at, LabReport.id)
        ).all()
        return [(r[0], r[1]) for r in rows]

    def lab_results(self, report_ids: Sequence[UUID]) -> list[tuple[LabResultItem, LabAnalyte]]:
        if not report_ids:
            return []
        rows = self.session.execute(
            select(LabResultItem, LabAnalyte)
            .join(LabAnalyte, LabAnalyte.id == LabResultItem.analyte_id)
            .where(LabResultItem.report_id.in_(report_ids))
            .order_by(LabAnalyte.name)
        ).all()
        return [(r[0], r[1]) for r in rows]

    def latest_predictions(self, case_ids: Iterable[UUID]) -> dict[UUID, LatestPredictionRow]:
        ids = list(case_ids)
        if not ids:
            return {}
        v = v_case_latest_prediction.c
        rows = self.session.execute(
            select(
                v.case_id, v.prediction_run_id, v.completed_at, v.top_disease, v.top_score
            ).where(v.case_id.in_(ids))
        ).all()
        return {
            r.case_id: LatestPredictionRow(
                r.prediction_run_id, r.completed_at, r.top_disease, r.top_score
            )
            for r in rows
        }

    def list_for_patient(
        self, patient_id: UUID, *, page: int, page_size: int
    ) -> tuple[list[CaseSummaryRow], int]:
        rows = self.session.execute(
            select(Case, Doctor, CaseAnamnesis.chief_complaint)
            .join(Doctor, Doctor.id == Case.created_by)
            .join(CaseAnamnesis, CaseAnamnesis.case_id == Case.id)
            .where(Case.patient_id == patient_id)
            .order_by(Case.created_at.desc(), Case.id)
            .limit(page_size)
            .offset((page - 1) * page_size)
        ).all()
        total = self.session.scalar(
            select(func.count(Case.id)).where(Case.patient_id == patient_id)
        )
        return [CaseSummaryRow(r[0], r[1], r[2]) for r in rows], int(total or 0)



    def add_case(
        self,
        case: Case,
        anamnesis: CaseAnamnesis,
        vital_signs: VitalSigns | None,
        lab_reports: list[NewLabReport],
    ) -> None:
        """Insert everything in dependency order. The caller commits (one transaction)."""
        self.session.add(case)
        self.session.flush()

        self.session.add(anamnesis)
        if vital_signs is not None:
            self.session.add(vital_signs)
        for new in lab_reports:
            self.session.add(new.report)
        self.session.flush()

        if vital_signs is not None:
            self.session.add(
                CaseVitalSigns(
                    vital_sign_id=vital_signs.id, case_id=case.id, patient_id=case.patient_id
                )
            )
        for new in lab_reports:
            self.session.add(
                CaseLabReport(report_id=new.report.id, case_id=case.id, patient_id=case.patient_id)
            )
            self.session.add_all(new.items)
        self.session.flush()
