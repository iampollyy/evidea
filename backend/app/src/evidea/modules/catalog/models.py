"""ORM mapping of the lab reference catalog (read-only for the application role)."""

from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from evidea.core.db import Base


class LabCategory(Base):
    __tablename__ = "lab_categories"

    id: Mapped[UUID] = mapped_column("category_id", primary_key=True)
    code: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean)


class LabPanel(Base):
    __tablename__ = "lab_panels"

    id: Mapped[UUID] = mapped_column("panel_id", primary_key=True)
    category_id: Mapped[UUID] = mapped_column(ForeignKey("lab_categories.category_id"))
    code: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(150))
    is_active: Mapped[bool] = mapped_column(Boolean)


class LabAnalyte(Base):
    __tablename__ = "lab_analytes"

    id: Mapped[UUID] = mapped_column("analyte_id", primary_key=True)
    panel_id: Mapped[UUID] = mapped_column(ForeignKey("lab_panels.panel_id"))
    code: Mapped[str] = mapped_column(String(50))
    name: Mapped[str] = mapped_column(String(150))
    unit: Mapped[str | None] = mapped_column(String(30))
    data_type: Mapped[str] = mapped_column(String(20))
    is_active: Mapped[bool] = mapped_column(Boolean)
