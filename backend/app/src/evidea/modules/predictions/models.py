from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from evidea.core.db import Base

_NOW = text("now()")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[UUID] = mapped_column("model_version_id", primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100))
    version: Mapped[str] = mapped_column(String(30))
    artifact_uri: Mapped[str] = mapped_column(Text)
    eval_metrics: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    trained_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))


class Disease(Base):
    __tablename__ = "diseases"

    id: Mapped[UUID] = mapped_column("disease_id", primary_key=True, default=uuid4)
    orpha_code: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    icd_code: Mapped[str | None] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)
    inheritance_type: Mapped[str | None] = mapped_column(String(50))
    affected_systems: Mapped[list[str] | None] = mapped_column(JSONB)


class PredictionRun(Base):
    __tablename__ = "prediction_runs"
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[UUID] = mapped_column("prediction_run_id", primary_key=True, default=uuid4)
    initiated_by: Mapped[UUID] = mapped_column(ForeignKey("doctors_and_admin.doc_id"))
    case_id: Mapped[UUID] = mapped_column(ForeignKey("cases.case_id"))
    model_version_id: Mapped[UUID] = mapped_column(ForeignKey("model_versions.model_version_id"))
    status: Mapped[str] = mapped_column(String(20), server_default=text("'pending'"))
    input_snapshot: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error_message: Mapped[str | None] = mapped_column("error_msg", Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)


class DiseaseHypothesis(Base):
    __tablename__ = "disease_hypotheses"

    id: Mapped[UUID] = mapped_column("hypothesis_id", primary_key=True, default=uuid4)
    prediction_run_id: Mapped[UUID] = mapped_column(ForeignKey("prediction_runs.prediction_run_id"))
    disease_id: Mapped[UUID] = mapped_column(ForeignKey("diseases.disease_id"))
    rank: Mapped[int] = mapped_column(Integer)
    score: Mapped[Decimal] = mapped_column(Numeric(8, 6))


class PredictionExplanation(Base):
    __tablename__ = "prediction_explanation"
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[UUID] = mapped_column("explanation_id", primary_key=True, default=uuid4)
    hypothesis_id: Mapped[UUID] = mapped_column(ForeignKey("disease_hypotheses.hypothesis_id"))
    method: Mapped[str] = mapped_column(String(20))
    data: Mapped[dict[str, Any]] = mapped_column("explanation_data", JSONB)
    summary: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=_NOW)
