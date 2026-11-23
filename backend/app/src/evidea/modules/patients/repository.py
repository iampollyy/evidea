from dataclasses import dataclass
from datetime import datetime
from typing import Literal
from uuid import UUID

from sqlalchemy import ColumnElement, ScalarSelect, func, or_, select, text
from sqlalchemy.orm import Session

from evidea.core.sql import contains_pattern
from evidea.modules.cases.models import Case
from evidea.modules.patients.models import Patient

PatientStatusFilter = Literal["active", "archived"]
PatientSort = Literal["name", "-createdOn", "-lastVisitAt"]

ACTIVE_EMAIL_CONSTRAINT = "uq_patients_active_email"


@dataclass(frozen=True)
class PatientRow:
    patient: Patient
    last_visit_at: datetime | None


def _last_visit_expr() -> ScalarSelect[datetime]:

    return (
        select(func.max(Case.created_at))
        .where(Case.patient_id == Patient.id)
        .correlate(Patient)
        .scalar_subquery()
    )


class PatientRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, patient_id: UUID, *, for_update: bool = False) -> Patient | None:
        return self.session.get(Patient, patient_id, with_for_update=for_update)

    def get_row(self, patient_id: UUID) -> PatientRow | None:
        row = self.session.execute(
            select(Patient, _last_visit_expr()).where(Patient.id == patient_id)
        ).first()
        return PatientRow(row[0], row[1]) if row else None

    @staticmethod
    def _conditions(
        *, status: PatientStatusFilter, search: str | None
    ) -> list[ColumnElement[bool]]:
        conditions: list[ColumnElement[bool]] = [
            Patient.deleted_at.is_(None) if status == "active" else Patient.deleted_at.is_not(None)
        ]
        if search:
            pattern = contains_pattern(search)
            conditions.append(
                or_(
                    Patient.name.ilike(pattern, escape="\\"),
                    Patient.surname.ilike(pattern, escape="\\"),
                    (Patient.name + " " + Patient.surname).ilike(pattern, escape="\\"),
                    Patient.email.ilike(pattern, escape="\\"),
                )
            )
        return conditions

    def list(
        self,
        *,
        page: int,
        page_size: int,
        status: PatientStatusFilter,
        search: str | None,
        sort: PatientSort,
    ) -> tuple[list[PatientRow], int]:
        last_visit = _last_visit_expr().label("last_visit_at")
        order_by = {
            "name": (Patient.surname, Patient.name, Patient.id),
            "-createdOn": (Patient.created_at.desc(), Patient.id),
            "-lastVisitAt": (text("last_visit_at DESC NULLS LAST"), Patient.id),
        }[sort]
        conditions = self._conditions(status=status, search=search)
        rows = self.session.execute(
            select(Patient, last_visit)
            .where(*conditions)
            .order_by(*order_by)
            .limit(page_size)
            .offset((page - 1) * page_size)
        ).all()
        total = self.session.scalar(select(func.count(Patient.id)).where(*conditions))
        return [PatientRow(r[0], r[1]) for r in rows], int(total or 0)

    def add(self, patient: Patient) -> None:
        self.session.add(patient)
        self.session.flush()

    def anonymize(self, patient_id: UUID) -> None:
        self.session.execute(text("CALL anonymize_patient(:id)"), {"id": patient_id})
