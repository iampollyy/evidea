from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from evidea.adapters.email import EmailSender, OutgoingEmail
from evidea.adapters.images import media_type_for_key, validate_image
from evidea.adapters.storage import FileStorage
from evidea.core.config import Settings
from evidea.core.errors import ConflictError, NotFoundError
from evidea.core.logging import get_logger
from evidea.core.security import (
    generate_one_time_token,
    hash_one_time_token,
    unusable_password_hash,
)
from evidea.core.sql import violated_constraint
from evidea.modules.audit.service import record_event
from evidea.modules.doctors.models import Doctor, Invitation
from evidea.modules.doctors.repository import EMAIL_CONSTRAINT, DoctorRepository, DoctorStatus
from evidea.modules.doctors.schemas import DoctorCreate

log = get_logger(__name__)


class EmailAlreadyUsedError(ConflictError):
    code, title = "EMAIL_ALREADY_USED", "Email already used"


class CannotDeactivateSelfError(ConflictError):
    code, title = "CANNOT_DEACTIVATE_SELF", "You cannot deactivate your own account"


class DoctorNotInvitedError(ConflictError):
    code, title = "DOCTOR_NOT_INVITED", "Doctor is not awaiting an invitation"

    def __init__(self) -> None:
        super().__init__("The doctor already has a password or is deactivated.")


def utcnow() -> datetime:
    return datetime.now(UTC)


class DoctorService:
    def __init__(
        self,
        session: Session,
        storage: FileStorage,
        *,
        settings: Settings,
        email_sender: EmailSender | None = None,
        clock: Callable[[], datetime] = utcnow,
    ) -> None:
        self.session = session
        self.repo = DoctorRepository(session)
        self.storage = storage
        self.settings = settings
        self.email_sender = email_sender
        self.clock = clock

    def list(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None,
        status: DoctorStatus | None,
        role: str | None,
    ) -> tuple[list[tuple[Doctor, DoctorStatus]], int]:
        return self.repo.list(
            page=page, page_size=page_size, search=search, status=status, role=role
        )

    def get(self, doctor_id: UUID) -> tuple[Doctor, DoctorStatus]:
        found = self.repo.get_with_status(doctor_id)
        if found is None:
            raise NotFoundError()
        return found

    def create(self, data: DoctorCreate, *, actor: Doctor) -> tuple[Doctor, DoctorStatus]:
        doctor = Doctor(
            **data.model_dump(exclude={"role"}),
            role_id=self.repo.role_by_name(data.role).id,
            password_hash=unusable_password_hash(),
        )
        try:
            self.repo.add(doctor)
        except IntegrityError as error:
            self.session.rollback()
            if violated_constraint(error) == EMAIL_CONSTRAINT:
                raise EmailAlreadyUsedError("Another account already uses this email.") from error
            raise
        token, _ = self._issue_invitation(doctor)
        record_event(self.session, "doctor.created", actor_id=actor.id, subject_id=doctor.id)
        self.session.commit()

        self._send_invitation(doctor, token, actor=actor)
        return self.get(doctor.id)

    def resend_invitation(self, doctor_id: UUID, *, actor: Doctor) -> datetime:
        doctor, status = self.get(doctor_id)
        if status != "invited":
            raise DoctorNotInvitedError()
        self.repo.expire_open_invitations(doctor.id, now=self.clock())
        token, expires_at = self._issue_invitation(doctor)
        record_event(
            self.session, "doctor.invitation_resent", actor_id=actor.id, subject_id=doctor.id
        )
        self.session.commit()
        self._send_invitation(doctor, token, actor=actor)
        return expires_at

    def deactivate(self, doctor_id: UUID, *, actor: Doctor) -> tuple[Doctor, DoctorStatus]:
        if doctor_id == actor.id:
            raise CannotDeactivateSelfError()
        doctor = self._get_doctor(doctor_id)
        if doctor.deactivated_at is None:
            doctor.deactivated_at = self.clock()
            record_event(
                self.session, "doctor.deactivated", actor_id=actor.id, subject_id=doctor.id
            )
            self.session.commit()
        return self.get(doctor_id)

    def activate(self, doctor_id: UUID, *, actor: Doctor) -> tuple[Doctor, DoctorStatus]:
        doctor = self._get_doctor(doctor_id)
        if doctor.deactivated_at is not None:
            doctor.deactivated_at = None
            record_event(self.session, "doctor.activated", actor_id=actor.id, subject_id=doctor.id)
            self.session.commit()
        return self.get(doctor_id)

    def set_avatar(self, doctor: Doctor, data: bytes) -> Doctor:
        image_type = validate_image(data, max_bytes=self.settings.max_upload_bytes)
        new_key = self.storage.save(data, folder="avatars", extension=image_type.extension)
        old_key = doctor.avatar_key
        try:
            doctor.avatar_key = new_key
            record_event(self.session, "doctor.avatar_changed", actor_id=doctor.id)
            self.session.commit()
        except Exception:
            self.storage.delete(new_key)
            raise
        if old_key:
            self.storage.delete(old_key)
        return doctor

    def delete_avatar(self, doctor: Doctor) -> None:
        old_key = doctor.avatar_key
        if old_key is None:
            return
        doctor.avatar_key = None
        record_event(self.session, "doctor.avatar_removed", actor_id=doctor.id)
        self.session.commit()
        self.storage.delete(old_key)

    def get_avatar(self, doctor_id: UUID) -> tuple[bytes, str]:
        doctor = self.repo.get(doctor_id)
        data = self.storage.read(doctor.avatar_key) if doctor and doctor.avatar_key else None
        if doctor is None or doctor.avatar_key is None or data is None:
            raise NotFoundError()
        return data, media_type_for_key(doctor.avatar_key)

    def _get_doctor(self, doctor_id: UUID) -> Doctor:
        doctor = self.repo.get(doctor_id)
        if doctor is None:
            raise NotFoundError()
        return doctor

    def _issue_invitation(self, doctor: Doctor) -> tuple[str, datetime]:
        token = generate_one_time_token()
        expires_at = self.clock() + timedelta(hours=self.settings.invitation_ttl_hours)
        self.repo.add_invitation(
            Invitation(
                doctor_id=doctor.id,
                token_hash=hash_one_time_token(token),
                expires_at=expires_at,
            )
        )
        return token, expires_at

    def _send_invitation(self, doctor: Doctor, token: str, *, actor: Doctor) -> None:
        if self.email_sender is None:
            return
        link = f"{self.settings.frontend_url.rstrip('/')}/accept-invitation?token={token}"
        email = OutgoingEmail(
            to=doctor.email,
            subject="Your EVIDEA account invitation",
            body=(
                f"Hello {doctor.name},\n\n"
                "An administrator has created an EVIDEA account for you.\n"
                f"Set your password here (the link works once and expires in "
                f"{self.settings.invitation_ttl_hours} hours):\n\n{link}\n\n"
                "If you did not expect this email, you can ignore it.\n"
            ),
        )
        try:
            self.email_sender.send(email)
        except Exception:
            log.exception("invitation_email_failed", doctor_id=str(doctor.id))
            record_event(
                self.session,
                "doctor.invitation_email_failed",
                actor_id=actor.id,
                subject_id=doctor.id,
                level="ERROR",
                error_code="EMAIL_FAILED",
            )
            self.session.commit()
