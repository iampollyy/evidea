from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, FetchedValue, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from evidea.core.db import Base


class Patient(Base):
    __tablename__ = "patients"
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[UUID] = mapped_column("patient_id", primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(Text)
    surname: Mapped[str] = mapped_column(Text)
    birth_date: Mapped[date] = mapped_column(Date)
    sex: Mapped[str] = mapped_column(String(64))
    email: Mapped[str] = mapped_column(Text)
    phone_number: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[date] = mapped_column(Date, server_default=text("CURRENT_DATE"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), server_onupdate=FetchedValue()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    photo_key: Mapped[str | None] = mapped_column(Text)

    @property
    def is_archived(self) -> bool:
        return self.deleted_at is not None
