"""Data access for doctors and invitations. The only place with SQL for these tables."""

from datetime import datetime
from typing import Literal, cast
from uuid import UUID

from sqlalchemy import ColumnElement, and_, case, exists, func, or_, select, update
from sqlalchemy.orm import Session

from evidea.core.sql import contains_pattern
from evidea.modules.doctors.models import Doctor, Invitation, Role

DoctorStatus = Literal["invited", "active", "deactivated"]

EMAIL_CONSTRAINT = "uq_doctors_and_admin_email"


def doctor_status_expr() -> ColumnElement[str]:
    """Account status computed in SQL (one query also works for lists, no N+1).

    deactivated: deactivated_at is set; invited: has invitations but none accepted;
    active: everything else (e.g. the bootstrap admin, who was never invited).
    """
    has_invitation = exists().where(Invitation.doctor_id == Doctor.id)
    has_accepted = exists().where(
        Invitation.doctor_id == Doctor.id, Invitation.used_at.is_not(None)
    )
    return case(
        (Doctor.deactivated_at.is_not(None), "deactivated"),
        (and_(has_invitation, ~has_accepted), "invited"),
        else_="active",
    )


class DoctorRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get(self, doctor_id: UUID) -> Doctor | None:
        return self.session.get(Doctor, doctor_id)

    def get_by_email(self, email: str) -> Doctor | None:
        return self.session.scalars(
            select(Doctor).where(func.lower(Doctor.email) == email.strip().lower())
        ).first()

    def get_with_status(self, doctor_id: UUID) -> tuple[Doctor, DoctorStatus] | None:
        row = self.session.execute(
            select(Doctor, doctor_status_expr()).where(Doctor.id == doctor_id)
        ).first()
        return (row[0], cast(DoctorStatus, row[1])) if row else None

    def list(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        status: DoctorStatus | None,
        role: str | None,
    ) -> tuple[list[tuple[Doctor, DoctorStatus]], int]:
        status_expr = doctor_status_expr()
        conditions: list[ColumnElement[bool]] = []
        if search:
            pattern = contains_pattern(search)
            conditions.append(
                or_(
                    Doctor.name.ilike(pattern, escape="\\"),
                    Doctor.surname.ilike(pattern, escape="\\"),
                    (Doctor.name + " " + Doctor.surname).ilike(pattern, escape="\\"),
                    Doctor.email.ilike(pattern, escape="\\"),
                )
            )
        if status:
            conditions.append(status_expr == status)
        if role:
            conditions.append(
                Doctor.role_id == select(Role.id).where(Role.name == role).scalar_subquery()
            )

        rows = self.session.execute(
            select(Doctor, status_expr)
            .where(*conditions)
            .order_by(Doctor.surname, Doctor.name, Doctor.id)
            .limit(page_size)
            .offset((page - 1) * page_size)
        ).all()
        total = self.session.scalar(select(func.count(Doctor.id)).where(*conditions))
        return [(r[0], cast(DoctorStatus, r[1])) for r in rows], int(total or 0)

    def add(self, doctor: Doctor) -> None:
        self.session.add(doctor)
        self.session.flush()

    def role_by_name(self, name: str) -> Role:
        return self.session.scalars(select(Role).where(Role.name == name)).one()

    def add_invitation(self, invitation: Invitation) -> None:
        self.session.add(invitation)
        self.session.flush()

    def expire_open_invitations(self, doctor_id: UUID, *, now: datetime) -> None:
        """Invalidate earlier unused links when a new invitation is issued."""
        self.session.execute(
            update(Invitation)
            .where(
                Invitation.doctor_id == doctor_id,
                Invitation.used_at.is_(None),
                Invitation.expires_at > now,
            )
            .values(expires_at=now)
        )

    def find_open_invitation(self, token_hash: str, *, now: datetime) -> Invitation | None:
        """Unused, unexpired invitation; the row is locked so it cannot be accepted twice."""
        return self.session.scalars(
            select(Invitation)
            .where(
                Invitation.token_hash == token_hash,
                Invitation.used_at.is_(None),
                Invitation.expires_at > now,
            )
            .with_for_update()
        ).first()
