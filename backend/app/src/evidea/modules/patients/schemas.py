from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import EmailStr, Field, ValidationInfo, field_validator

from evidea.adapters.images import image_version
from evidea.core.schemas import ApiModel, InputModel
from evidea.domain.person import (
    PATIENT_MAX_AGE,
    age_on,
    validate_birth_date,
    validate_person_name,
    validate_phone,
)
from evidea.modules.patients.repository import PatientRow

Sex = Literal["male", "female", "other", "unknown"]
PatientStatus = Literal["active", "archived"]


class _PatientFields(InputModel):
    name: str = Field(min_length=2, max_length=100)
    surname: str = Field(min_length=2, max_length=100)
    birth_date: date = Field(description="Not in the future; age at most 130.")
    sex: Sex
    email: EmailStr = Field(max_length=254)

    @field_validator("name", "surname")
    @classmethod
    def _name(cls, value: str, info: ValidationInfo) -> str:
        return validate_person_name(value, (info.field_name or "name").capitalize())

    @field_validator("birth_date")
    @classmethod
    def _birth_date(cls, value: date) -> date:
        return validate_birth_date(value, today=date.today(), max_age=PATIENT_MAX_AGE)

    @field_validator("phone_number", check_fields=False)
    @classmethod
    def _phone(cls, value: str | None) -> str | None:
        return None if value is None or value == "" else validate_phone(value)


class PatientCreate(_PatientFields):
    phone_number: str | None = Field(default=None, max_length=30)


class PatientReplace(_PatientFields):
    phone_number: str | None = Field(max_length=30)


def photo_url(patient_id: UUID, key: str | None) -> str | None:
    if key is None:
        return None
    return f"/api/v1/patients/{patient_id}/photo?v={image_version(key)}"


class PatientListItem(ApiModel):
    id: UUID
    name: str
    surname: str
    age: int
    sex: Sex
    status: PatientStatus
    photo_url: str | None
    last_visit_at: datetime | None

    @classmethod
    def build(cls, row: PatientRow, today: date) -> "PatientListItem":
        p = row.patient
        return cls(
            id=p.id,
            name=p.name,
            surname=p.surname,
            age=age_on(p.birth_date, today),
            sex=p.sex,
            status="archived" if p.is_archived else "active",
            photo_url=photo_url(p.id, p.photo_key),
            last_visit_at=row.last_visit_at,
        )


class PatientOut(PatientListItem):
    birth_date: date
    email: str
    phone_number: str | None
    created_on: date
    archived_at: datetime | None

    @classmethod
    def build(cls, row: PatientRow, today: date) -> "PatientOut":
        p = row.patient
        return cls(
            **PatientListItem.build(row, today).model_dump(),
            birth_date=p.birth_date,
            email=p.email,
            phone_number=p.phone_number,
            created_on=p.created_at,
            archived_at=p.deleted_at,
        )
