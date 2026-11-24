from fastapi import APIRouter, Depends, File, Request, Response, UploadFile, status
from sqlalchemy.orm import Session

from evidea.adapters.uploads import read_upload
from evidea.core.config import Settings
from evidea.core.db import get_session
from evidea.core.errors import NotFoundError
from evidea.modules.auth.dependencies import (
    get_auth_service,
    get_current_user,
    get_settings_from_app,
)
from evidea.modules.auth.schemas import AcceptInvitationRequest, LoginRequest
from evidea.modules.auth.service import AuthService
from evidea.modules.doctors.models import Doctor
from evidea.modules.doctors.repository import DoctorRepository
from evidea.modules.doctors.router import get_doctor_service
from evidea.modules.doctors.schemas import DoctorOut, ImageRef, avatar_url
from evidea.modules.doctors.service import DoctorService

auth_router = APIRouter(prefix="/auth", tags=["Auth"])
me_router = APIRouter(prefix="/me", tags=["Me"])


def _set_session_cookie(response: Response, settings: Settings, token: str | None) -> None:
    if token is None:
        response.delete_cookie(
            settings.session_cookie_name,
            path="/api",
            secure=settings.cookie_secure,
            httponly=True,
            samesite="strict",
        )
        return
    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=settings.jwt_ttl_hours * 3600,
        path="/api",
        secure=settings.cookie_secure,
        httponly=True,
        samesite="strict",
    )


@auth_router.post("/login", response_model=DoctorOut, operation_id="login")
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
    settings: Settings = Depends(get_settings_from_app),
) -> DoctorOut:
    result = service.login(
        email=body.email,
        password=body.password,
        client_ip=request.client.host if request.client else "unknown",
    )
    _set_session_cookie(response, settings, result.session_token)
    return DoctorOut.build(result.doctor, result.status)


@auth_router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, operation_id="logout")
def logout(response: Response, settings: Settings = Depends(get_settings_from_app)) -> None:
    _set_session_cookie(response, settings, None)


@auth_router.post(
    "/invitations/accept",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="acceptInvitation",
)
def accept_invitation(
    body: AcceptInvitationRequest, service: AuthService = Depends(get_auth_service)
) -> None:
    service.accept_invitation(token=body.token, password=body.password)


@me_router.get("", response_model=DoctorOut, operation_id="getCurrentUser")
def get_me(
    user: Doctor = Depends(get_current_user), session: Session = Depends(get_session)
) -> DoctorOut:
    found = DoctorRepository(session).get_with_status(user.id)
    if found is None:
        raise NotFoundError()
    return DoctorOut.build(*found)


@me_router.put("/avatar", response_model=ImageRef, operation_id="uploadMyAvatar")
def upload_my_avatar(
    request: Request,
    file: UploadFile = File(description="PNG, JPEG or WebP, at most 2 MB."),
    user: Doctor = Depends(get_current_user),
    service: DoctorService = Depends(get_doctor_service),
) -> ImageRef:
    data = read_upload(file, max_bytes=request.app.state.settings.max_upload_bytes)
    doctor = service.set_avatar(user, data)
    return ImageRef(url=avatar_url(doctor) or "")


@me_router.delete("/avatar", status_code=status.HTTP_204_NO_CONTENT, operation_id="deleteMyAvatar")
def delete_my_avatar(
    user: Doctor = Depends(get_current_user),
    service: DoctorService = Depends(get_doctor_service),
) -> None:
    service.delete_avatar(user)
