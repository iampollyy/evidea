from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from evidea.core.config import Settings
from evidea.core.errors import (
    BadRequestError,
    ForbiddenError,
    InvalidCredentialsError,
    RateLimitedError,
)
from evidea.core.security import (
    create_session_token,
    hash_one_time_token,
    hash_password,
    verify_password,
)
from evidea.modules.audit.service import record_event
from evidea.modules.auth.rate_limit import LoginRateLimiter
from evidea.modules.doctors.models import Doctor
from evidea.modules.doctors.repository import DoctorRepository, DoctorStatus


class AccountDeactivatedError(ForbiddenError):
    code, title = "ACCOUNT_DEACTIVATED", "Account deactivated"

    def __init__(self) -> None:
        super().__init__("Your account has been deactivated. Contact an administrator.")


class InvitationInvalidError(BadRequestError):
    code, title = "INVITATION_INVALID", "Invitation is invalid or expired"


@dataclass(frozen=True)
class LoginResult:
    doctor: Doctor
    status: DoctorStatus
    session_token: str


def utcnow() -> datetime:
    return datetime.now(UTC)


class AuthService:
    def __init__(
        self,
        session: Session,
        settings: Settings,
        limiter: LoginRateLimiter,
        *,
        clock: Callable[[], datetime] = utcnow,
    ) -> None:
        self.session = session
        self.settings = settings
        self.limiter = limiter
        self.repo = DoctorRepository(session)
        self.clock = clock

    def login(self, *, email: str, password: str, client_ip: str) -> LoginResult:
        key = f"{client_ip}|{email.strip().lower()}"
        retry_after = self.limiter.retry_after(key)
        if retry_after is not None:
            raise RateLimitedError(retry_after)

        doctor = self.repo.get_by_email(email)

        password_ok = verify_password(password, doctor.password_hash if doctor else None)
        if doctor is None or not password_ok:
            self.limiter.register_failure(key)
            record_event(
                self.session,
                "auth.login_failed",
                actor_id=doctor.id if doctor else None,
                level="WARN",
                error_code="INVALID_CREDENTIALS",
            )
            self.session.commit()
            raise InvalidCredentialsError()

        self.limiter.reset(key)
        if doctor.deactivated_at is not None:
            record_event(
                self.session,
                "auth.login_rejected",
                actor_id=doctor.id,
                level="WARN",
                error_code="ACCOUNT_DEACTIVATED",
            )
            self.session.commit()
            raise AccountDeactivatedError()

        record_event(self.session, "auth.login", actor_id=doctor.id)
        self.session.commit()

        token = create_session_token(
            user_id=doctor.id,
            role=doctor.role_name,
            secret=self.settings.jwt_secret.get_secret_value(),
            ttl=timedelta(hours=self.settings.jwt_ttl_hours),
            now=self.clock(),
        )
        found = self.repo.get_with_status(doctor.id)
        status: DoctorStatus = found[1] if found else "active"
        return LoginResult(doctor=doctor, status=status, session_token=token)

    def accept_invitation(self, *, token: str, password: str) -> None:
        now = self.clock()
        invitation = self.repo.find_open_invitation(hash_one_time_token(token), now=now)
        doctor = self.repo.get(invitation.doctor_id) if invitation else None

        if invitation is None or doctor is None or doctor.deactivated_at is not None:
            raise InvitationInvalidError()

        doctor.password_hash = hash_password(password)
        invitation.used_at = now
        record_event(self.session, "auth.invitation_accepted", actor_id=doctor.id)
        self.session.commit()
