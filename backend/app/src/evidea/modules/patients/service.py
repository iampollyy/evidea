"""Patient use cases. Each public method is one transaction: it commits on success,
and on any error the session is rolled back by the request (see core/db.py)."""

from collections.abc import Callable
from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from evidea.adapters.images import media_type_for_key, validate_image
from evidea.adapters.storage import FileStorage
from evidea.core.errors import ConflictError, NotFoundError
from evidea.core.sql import violated_constraint
from evidea.modules.audit.service import record_event
from evidea.modules.doctors.models import Doctor
from evidea.modules.patients.models import Patient
from evidea.modules.patients.repository import (
    ACTIVE_EMAIL_CONSTRAINT,
    PatientRepository,
    PatientRow,
    PatientSort,
    PatientStatusFilter,
)
from evidea.modules.patients.schemas import PatientCreate, PatientReplace


class EmailAlreadyUsedError(ConflictError):
    code, title = "EMAIL_ALREADY_USED", "Email already used"


class PatientArchivedError(ConflictError):
    code, title = "PATIENT_ARCHIVED", "Patient is archived"

    def __init__(self) -> None:
        super().__init__("Archived patients cannot be changed or get new cases.")


def utcnow() -> datetime:
    return datetime.now(UTC)


class PatientService:
    def __init__(
        self,
        session: Session,
        storage: FileStorage,
        *,
        max_upload_bytes: int,
        clock: Callable[[], datetime] = utcnow,
    ) -> None:
        self.session = session
        self.repo = PatientRepository(session)
        self.storage = storage
        self.max_upload_bytes = max_upload_bytes
        self.clock = clock



    def get(self, patient_id: UUID) -> PatientRow:
        row = self.repo.get_row(patient_id)
        if row is None:
            raise NotFoundError()
        return row

    def list(
        self,
        *,
        page: int,
        page_size: int,
        status: PatientStatusFilter,
        search: str | None,
        sort: PatientSort,
    ) -> tuple[list[PatientRow], int]:
        return self.repo.list(
            page=page, page_size=page_size, status=status, search=search, sort=sort
        )

    def get_photo(self, patient_id: UUID) -> tuple[bytes, str]:
        patient = self.repo.get(patient_id)
        data = self.storage.read(patient.photo_key) if patient and patient.photo_key else None
        if patient is None or patient.photo_key is None or data is None:
            raise NotFoundError()
        return data, media_type_for_key(patient.photo_key)



    def create(self, data: PatientCreate, *, actor: Doctor) -> PatientRow:
        patient = Patient(**data.model_dump())
        self._save(patient)
        record_event(self.session, "patient.created", actor_id=actor.id, subject_id=patient.id)
        self.session.commit()
        return PatientRow(patient, last_visit_at=None)

    def replace(self, patient_id: UUID, data: PatientReplace, *, actor: Doctor) -> PatientRow:
        patient = self._get_active_for_update(patient_id)
        for field, value in data.model_dump().items():
            setattr(patient, field, value)
        self._save(patient)
        record_event(self.session, "patient.updated", actor_id=actor.id, subject_id=patient.id)
        self.session.commit()
        return self.get(patient_id)

    def archive(self, patient_id: UUID, *, actor: Doctor) -> PatientRow:
        """Irreversible (agreed in Phase 2). Idempotent: archiving twice changes nothing."""
        patient = self._get_for_update(patient_id)
        if patient.deleted_at is None:
            patient.deleted_at = self.clock()
            record_event(self.session, "patient.archived", actor_id=actor.id, subject_id=patient.id)
            self.session.commit()
        return self.get(patient_id)

    def anonymize(self, patient_id: UUID, *, actor: Doctor) -> PatientRow:
        """Right to erasure: the DB procedure replaces personal data; we also drop the photo."""
        patient = self._get_for_update(patient_id)
        old_photo = patient.photo_key
        patient.photo_key = None
        self.session.flush()
        self.repo.anonymize(patient_id)
        record_event(self.session, "patient.anonymized", actor_id=actor.id, subject_id=patient_id)
        self.session.commit()
        self.session.refresh(patient)
        if old_photo:
            self.storage.delete(old_photo)
        return self.get(patient_id)

    def set_photo(self, patient_id: UUID, data: bytes, *, actor: Doctor) -> Patient:
        image_type = validate_image(data, max_bytes=self.max_upload_bytes)
        patient = self._get_active_for_update(patient_id)
        new_key = self.storage.save(data, folder="patients", extension=image_type.extension)
        old_key = patient.photo_key
        try:
            patient.photo_key = new_key
            record_event(
                self.session, "patient.photo_changed", actor_id=actor.id, subject_id=patient_id
            )
            self.session.commit()
        except Exception:
            self.storage.delete(new_key)
            raise
        if old_key:
            self.storage.delete(old_key)
        return patient

    def delete_photo(self, patient_id: UUID, *, actor: Doctor) -> None:
        patient = self._get_for_update(patient_id)
        old_key = patient.photo_key
        if old_key is None:
            return
        patient.photo_key = None
        record_event(
            self.session, "patient.photo_removed", actor_id=actor.id, subject_id=patient_id
        )
        self.session.commit()
        self.storage.delete(old_key)



    def _get_for_update(self, patient_id: UUID) -> Patient:
        patient = self.repo.get(patient_id, for_update=True)
        if patient is None:
            raise NotFoundError()
        return patient

    def _get_active_for_update(self, patient_id: UUID) -> Patient:
        patient = self._get_for_update(patient_id)
        if patient.is_archived:
            raise PatientArchivedError()
        return patient

    def _save(self, patient: Patient) -> None:
        try:
            self.repo.add(patient)
        except IntegrityError as error:
            self.session.rollback()
            if violated_constraint(error) == ACTIVE_EMAIL_CONSTRAINT:
                raise EmailAlreadyUsedError(
                    "Another active patient already uses this email."
                ) from error
            raise


def today() -> date:
    return datetime.now(UTC).date()
