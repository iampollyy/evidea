from fastapi import Depends, Request
from sqlalchemy.orm import Session

from evidea.core.config import Settings
from evidea.core.db import get_session
from evidea.core.errors import ForbiddenError, UnauthenticatedError
from evidea.core.security import decode_session_token
from evidea.modules.auth.service import AuthService
from evidea.modules.doctors.models import Doctor
from evidea.modules.doctors.repository import DoctorRepository


def get_settings_from_app(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_current_user(
    request: Request,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings_from_app),
) -> Doctor:
    token = request.cookies.get(settings.session_cookie_name)
    claims = (
        decode_session_token(token, secret=settings.jwt_secret.get_secret_value())
        if token
        else None
    )
    if claims is None:
        raise UnauthenticatedError()
    doctor = DoctorRepository(session).get(claims.user_id)
    if doctor is None or doctor.deactivated_at is not None:
        raise UnauthenticatedError()
    return doctor


def require_admin(user: Doctor = Depends(get_current_user)) -> Doctor:
    if not user.is_admin:
        raise ForbiddenError("This action requires the admin role.")
    return user


def get_auth_service(
    request: Request,
    session: Session = Depends(get_session),
    settings: Settings = Depends(get_settings_from_app),
) -> AuthService:
    return AuthService(session, settings, request.app.state.login_limiter)
