from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import EmailStr, Field, ValidationInfo, field_validator

from evidea.adapters.images import image_version
from evidea.core.schemas import ApiModel, InputModel
from evidea.domain.person import (
    DOCTOR_MAX_AGE,
    DOCTOR_MIN_AGE,
    validate_birth_date,
    validate_person_name,
    validate_phone,
)
from evidea.modules.doctors.models import Doctor
from evidea.modules.doctors.repository import DoctorStatus

Sex = Literal["male", "female", "other", "unknown"]
RoleName = Literal["clinician", "admin"]


def avatar_url(doctor: Doctor) -> str | None:
    if doctor.avatar_key is None:
        return None
    return f"/api/v1/doctors/{doctor.id}/avatar?v={image_version(doctor.avatar_key)}"


class DoctorOut(ApiModel):
    id: UUID
    name: str
    surname: str
    birth_date: date | None
    sex: Sex | None
    email: str
    phone_number: str | None
    role: RoleName
    status: DoctorStatus
    avatar_url: str | None
    created_on: date
    deactivated_at: datetime | None

    @classmethod
    def build(cls, doctor: Doctor, status: DoctorStatus) -> "DoctorOut":
        return cls(
            id=doctor.id,
            name=doctor.name,
            surname=doctor.surname,
            birth_date=doctor.birth_date,
            sex=doctor.sex,
            email=doctor.email,
            phone_number=doctor.phone_number,
            role=doctor.role_name,
            status=status,
            avatar_url=avatar_url(doctor),
            created_on=doctor.created_at,
            deactivated_at=doctor.deactivated_at,
        )


class DoctorRef(ApiModel):
    id: UUID
    name: str
    surname: str


class ImageRef(ApiModel):
    url: str


class DoctorCreate(InputModel):
    name: str = Field(min_length=2, max_length=100)
    surname: str = Field(min_length=2, max_length=100)
    birth_date: date | None = Field(default=None, description="Optional. Age must be 18 to 100.")
    sex: Sex | None = None
    email: EmailStr = Field(max_length=254)
    phone_number: str | None = Field(default=None, max_length=30)
    role: RoleName

    @field_validator("name", "surname")
    @classmethod
    def _name(cls, value: str, info: ValidationInfo) -> str:
        return validate_person_name(value, (info.field_name or "name").capitalize())

    @field_validator("birth_date")
    @classmethod
    def _birth_date(cls, value: date | None) -> date | None:
        if value is None:
            return None
        return validate_birth_date(
            value,
            today=date.today(),
            min_age=DOCTOR_MIN_AGE,
            max_age=DOCTOR_MAX_AGE,
            min_age_message=f"Doctor must be at least {DOCTOR_MIN_AGE} years old",
        )

    @field_validator("phone_number")
    @classmethod
    def _phone(cls, value: str | None) -> str | None:
        return None if value is None or value == "" else validate_phone(value)


class InvitationIssued(ApiModel):
    expires_at: datetime
