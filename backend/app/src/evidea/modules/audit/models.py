from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from evidea.core.db import Base


class AuditLog(Base):
    """Business audit trail (`system_logs`). IDs only, never personal data (DQ-41)."""

    __tablename__ = "system_logs"

    id: Mapped[UUID] = mapped_column("log_id", primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("doctors_and_admin.doc_id"))
    case_id: Mapped[UUID | None] = mapped_column(ForeignKey("cases.case_id"))
    level: Mapped[str] = mapped_column("log_lvl", String(20))
    error_code: Mapped[str | None] = mapped_column(String(20))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=text("now()")
    )
