"""ORM mapping of clinical case tables (owned by the SQL migrations in backend/db).

Measurements (vital signs, lab reports) belong to the patient and are linked to cases through
junction tables. Composite foreign keys (case_id, patient_id) in the database guarantee that a
case only links data of its own patient.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, FetchedValue, ForeignKey, Integer, Numeric, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from evidea.core.db import Base

_NOW = text("now()")


class Case(Base):
    __tablename__ = "cases"
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[UUID] = mapped_column("case_id", primary_key=True, default=uuid4)
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.patient_id"))
    created_by: Mapped[UUID] = mapped_column(ForeignKey("doctors_and_admin.doc_id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=_NOW, server_onupdate=FetchedValue()
    )


class CaseAnamnesis(Base):
    __tablename__ = "case_anamneses"
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[UUID] = mapped_column("anamnesis_id", primary_key=True, default=uuid4)
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.patient_id"))
    case_id: Mapped[UUID] = mapped_column(ForeignKey("cases.case_id"))
    created_by_id: Mapped[UUID] = mapped_column(ForeignKey("doctors_and_admin.doc_id"))
    chief_complaint: Mapped[str] = mapped_column(Text)
    symptoms_duration: Mapped[str | None] = mapped_column(Text)
    clinical_notes: Mapped[str | None] = mapped_column(Text)
    family_history: Mapped[str | None] = mapped_column(Text)
    medications: Mapped[str | None] = mapped_column(Text)
    past_medical_history: Mapped[str | None] = mapped_column("past_med_history", Text)
    allergies: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=_NOW, server_onupdate=FetchedValue()
    )


class VitalSigns(Base):
    __tablename__ = "vital_signs"
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[UUID] = mapped_column("vital_sign_id", primary_key=True, default=uuid4)
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.patient_id"))
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(5, 1))
    systolic_bp_mmhg: Mapped[int | None] = mapped_column(Integer)
    diastolic_bp_mmhg: Mapped[int | None] = mapped_column(Integer)
    heart_rate_bpm: Mapped[int | None] = mapped_column(Integer)
    respiratory_rate: Mapped[int | None] = mapped_column(Integer)
    body_temp_celsius: Mapped[Decimal | None] = mapped_column(Numeric(4, 1))
    spo2_percent: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=_NOW, server_onupdate=FetchedValue()
    )


class CaseVitalSigns(Base):
    __tablename__ = "case_vital_signs"

    vital_sign_id: Mapped[UUID] = mapped_column(primary_key=True)
    case_id: Mapped[UUID] = mapped_column(primary_key=True)
    patient_id: Mapped[UUID] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)


class LabReport(Base):
    __tablename__ = "lab_reports"
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[UUID] = mapped_column("report_id", primary_key=True, default=uuid4)
    patient_id: Mapped[UUID] = mapped_column(ForeignKey("patients.patient_id"))
    panel_id: Mapped[UUID] = mapped_column(ForeignKey("lab_panels.panel_id"))
    collected_at: Mapped[datetime] = mapped_column("collected", DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)


class CaseLabReport(Base):
    __tablename__ = "case_lab_reports"

    report_id: Mapped[UUID] = mapped_column(primary_key=True)
    case_id: Mapped[UUID] = mapped_column(primary_key=True)
    patient_id: Mapped[UUID] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)


class LabResultItem(Base):
    __tablename__ = "lab_results_items"
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[UUID] = mapped_column("result_id", primary_key=True, default=uuid4)
    report_id: Mapped[UUID] = mapped_column(ForeignKey("lab_reports.report_id"))
    analyte_id: Mapped[UUID] = mapped_column(ForeignKey("lab_analytes.analyte_id"))
    numeric_val: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    text_val: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)
