"""Request and response models of the cases API (see docs/reference/openapi.yaml)."""

from datetime import datetime
from decimal import Decimal
from typing import Annotated, Self
from uuid import UUID

from pydantic import (
    AwareDatetime,
    Field,
    StrictBool,
    StrictFloat,
    StrictInt,
    StrictStr,
    field_validator,
    model_validator,
)

from evidea.core.schemas import ApiModel, InputModel
from evidea.modules.catalog.schemas import AnalyteRef, PanelRef
from evidea.modules.doctors.schemas import DoctorRef

ChiefComplaint = Annotated[
    str, Field(min_length=10, max_length=2000, description="At least 10 characters (DQ-20).")
]
_OPTIONAL_TEXT = (
    "symptoms_duration",
    "clinical_notes",
    "family_history",
    "medications",
    "past_medical_history",
    "allergies",
)


class _AnamnesisInput(InputModel):
    @field_validator(*_OPTIONAL_TEXT, check_fields=False)
    @classmethod
    def _empty_to_none(cls, value: str | None) -> str | None:
        return value or None


class AnamnesisCreate(_AnamnesisInput):
    """Do not enter patient identifiers (names, IDs) in free text (DQ-27)."""

    chief_complaint: ChiefComplaint
    symptoms_duration: str | None = Field(default=None, max_length=200)
    clinical_notes: str | None = Field(default=None, max_length=10000)
    family_history: str | None = Field(default=None, max_length=5000)
    medications: str | None = Field(default=None, max_length=5000)
    past_medical_history: str | None = Field(default=None, max_length=5000)
    allergies: str | None = Field(default=None, max_length=5000)


class AnamnesisReplace(_AnamnesisInput):
    """PUT = full replacement: every field must be sent; `null` clears an optional one."""

    chief_complaint: ChiefComplaint
    symptoms_duration: str | None = Field(max_length=200)
    clinical_notes: str | None = Field(max_length=10000)
    family_history: str | None = Field(max_length=5000)
    medications: str | None = Field(max_length=5000)
    past_medical_history: str | None = Field(max_length=5000)
    allergies: str | None = Field(max_length=5000)


class AnamnesisOut(ApiModel):
    id: UUID
    chief_complaint: str
    symptoms_duration: str | None
    clinical_notes: str | None
    family_history: str | None
    medications: str | None
    past_medical_history: str | None
    allergies: str | None
    created_by: DoctorRef
    created_at: datetime
    updated_at: datetime





class _VitalSignsFields(ApiModel):
    weight_kg: float | None = Field(default=None, ge=0.1, le=500, description="kg, one decimal")
    systolic_bp_mmhg: int | None = Field(default=None, ge=20, le=300)
    diastolic_bp_mmhg: int | None = Field(default=None, ge=20, le=300)
    heart_rate_bpm: int | None = Field(default=None, ge=10, le=300)
    respiratory_rate: int | None = Field(default=None, ge=1, le=120, description="Breaths/min.")
    body_temp_celsius: float | None = Field(default=None, ge=25, le=45)
    spo2_percent: int | None = Field(default=None, ge=0, le=100)


class VitalSignsCreate(_VitalSignsFields, InputModel):
    @model_validator(mode="after")
    def _at_least_one(self) -> Self:
        if all(value is None for value in self.model_dump().values()):
            raise ValueError("At least one vital sign measurement is required")
        return self


class VitalSignsOut(_VitalSignsFields):
    id: UUID
    created_at: datetime

    @field_validator("weight_kg", "body_temp_celsius", mode="before")
    @classmethod
    def _decimal_to_float(cls, value: Decimal | float | None) -> float | None:
        return None if value is None else float(value)






LabValue = (
    StrictBool | StrictInt | StrictFloat | Annotated[StrictStr, Field(min_length=1, max_length=500)]
)


class LabResultCreate(InputModel):
    analyte_id: UUID
    value: LabValue = Field(description="Number for numeric, boolean for boolean, string for text.")


class LabReportCreate(InputModel):
    panel_id: UUID
    collected_at: AwareDatetime = Field(description="Sample collection time; not in the future.")
    results: list[LabResultCreate] = Field(min_length=1, max_length=100)


class LabResultOut(ApiModel):
    id: UUID
    analyte: AnalyteRef
    value: bool | int | float | str


class LabReportOut(ApiModel):
    id: UUID
    panel: PanelRef
    collected_at: datetime
    created_at: datetime
    results: list[LabResultOut]





class CaseCreate(InputModel):
    anamnesis: AnamnesisCreate
    vital_signs: VitalSignsCreate | None = None
    lab_reports: list[LabReportCreate] = Field(default_factory=list, max_length=20)


class LatestPrediction(ApiModel):
    """Top-1 hypothesis of the latest completed run (view `v_case_latest_prediction`)."""

    run_id: UUID
    completed_at: datetime
    top_disease_name: str
    top_score: float


class CaseSummary(ApiModel):
    id: UUID
    patient_id: UUID
    created_at: datetime
    created_by: DoctorRef
    chief_complaint: str
    latest_prediction: LatestPrediction | None


class CaseDetail(ApiModel):
    id: UUID
    patient_id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: DoctorRef
    anamnesis: AnamnesisOut
    vital_signs: list[VitalSignsOut]
    lab_reports: list[LabReportOut]
    latest_prediction: LatestPrediction | None
