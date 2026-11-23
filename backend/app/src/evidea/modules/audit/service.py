from typing import Literal
from uuid import UUID

from sqlalchemy.orm import Session

from evidea.modules.audit.models import AuditLog

Level = Literal["INFO", "WARN", "ERROR", "FATAL"]


def record_event(
    session: Session,
    event: str,
    *,
    actor_id: UUID | None = None,
    subject_id: UUID | None = None,
    case_id: UUID | None = None,
    level: Level = "INFO",
    error_code: str | None = None,
) -> None:
    message = event if subject_id is None else f"{event} id={subject_id}"
    session.add(
        AuditLog(
            user_id=actor_id,
            case_id=case_id,
            level=level,
            error_code=error_code,
            message=message,
        )
    )
