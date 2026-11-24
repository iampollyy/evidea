from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, FetchedValue, ForeignKey, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from evidea.core.db import Base


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[UUID] = mapped_column("role_id", primary_key=True)
    name: Mapped[str] = mapped_column("role_name", String(20))


class Doctor(Base):
    __tablename__ = "doctors_and_admin"
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[UUID] = mapped_column("doc_id", primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(Text)
    surname: Mapped[str] = mapped_column(Text)
    birth_date: Mapped[date | None] = mapped_column(Date)
    sex: Mapped[str | None] = mapped_column(String(64))
    email: Mapped[str] = mapped_column(Text)
    phone_number: Mapped[str | None] = mapped_column(Text)
    role_id: Mapped[UUID] = mapped_column("role", ForeignKey("roles.role_id"))
    password_hash: Mapped[str] = mapped_column(Text)
    created_at: Mapped[date] = mapped_column(Date, server_default=text("CURRENT_DATE"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()"), server_onupdate=FetchedValue()
    )
    deactivated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    avatar_key: Mapped[str | None] = mapped_column(Text)

    role: Mapped[Role] = relationship(lazy="joined")

    @property
    def role_name(self) -> str:
        return self.role.name

    @property
    def is_admin(self) -> bool:
        return self.role.name == "admin"


class Invitation(Base):
    __tablename__ = "invitations"
    __mapper_args__ = {"eager_defaults": True}

    id: Mapped[UUID] = mapped_column("invite_id", primary_key=True, default=uuid4)
    doctor_id: Mapped[UUID] = mapped_column(ForeignKey("doctors_and_admin.doc_id"))
    token_hash: Mapped[str] = mapped_column(Text)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )
