from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from evidea.adapters.email import EmailSender, get_email_sender
from evidea.adapters.storage import FileStorage, get_storage
from evidea.core.db import get_session
from evidea.core.schemas import Page, PageMeta
from evidea.modules.auth.dependencies import get_current_user, require_admin
from evidea.modules.doctors.models import Doctor
from evidea.modules.doctors.repository import DoctorStatus
from evidea.modules.doctors.schemas import DoctorCreate, DoctorOut, InvitationIssued, RoleName
from evidea.modules.doctors.service import DoctorService

router = APIRouter(prefix="/doctors", tags=["Doctors"])


def get_doctor_service(
    request: Request,
    session: Session = Depends(get_session),
    storage: FileStorage = Depends(get_storage),
    email_sender: EmailSender = Depends(get_email_sender),
) -> DoctorService:
    return DoctorService(
        session, storage, settings=request.app.state.settings, email_sender=email_sender
    )


@router.get("", response_model=Page[DoctorOut], operation_id="listDoctors")
def list_doctors(
    page: int = Query(1, ge=1, le=2_147_483_647),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    search: str | None = Query(None, min_length=2, max_length=100, pattern=r"^[^\x00-\x1f\x7f]+$"),
    status_filter: DoctorStatus | None = Query(None, alias="status"),
    role: RoleName | None = Query(None),
    _: Doctor = Depends(require_admin),
    service: DoctorService = Depends(get_doctor_service),
) -> Page[DoctorOut]:
    rows, total = service.list(
        page=page, page_size=page_size, search=search, status=status_filter, role=role
    )
    return Page[DoctorOut](
        items=[DoctorOut.build(doctor, doctor_status) for doctor, doctor_status in rows],
        meta=PageMeta.build(page=page, page_size=page_size, total_items=total),
    )


@router.post(
    "", response_model=DoctorOut, status_code=status.HTTP_201_CREATED, operation_id="createDoctor"
)
def create_doctor(
    body: DoctorCreate,
    response: Response,
    admin: Doctor = Depends(require_admin),
    service: DoctorService = Depends(get_doctor_service),
) -> DoctorOut:
    doctor, doctor_status = service.create(body, actor=admin)
    response.headers["Location"] = f"/api/v1/doctors/{doctor.id}"
    return DoctorOut.build(doctor, doctor_status)


@router.get("/{doctor_id}", response_model=DoctorOut, operation_id="getDoctor")
def get_doctor(
    doctor_id: UUID,
    _: Doctor = Depends(require_admin),
    service: DoctorService = Depends(get_doctor_service),
) -> DoctorOut:
    return DoctorOut.build(*service.get(doctor_id))


@router.post("/{doctor_id}/deactivate", response_model=DoctorOut, operation_id="deactivateDoctor")
def deactivate_doctor(
    doctor_id: UUID,
    admin: Doctor = Depends(require_admin),
    service: DoctorService = Depends(get_doctor_service),
) -> DoctorOut:
    return DoctorOut.build(*service.deactivate(doctor_id, actor=admin))


@router.post("/{doctor_id}/activate", response_model=DoctorOut, operation_id="activateDoctor")
def activate_doctor(
    doctor_id: UUID,
    admin: Doctor = Depends(require_admin),
    service: DoctorService = Depends(get_doctor_service),
) -> DoctorOut:
    return DoctorOut.build(*service.activate(doctor_id, actor=admin))


@router.post(
    "/{doctor_id}/invitations",
    response_model=InvitationIssued,
    status_code=status.HTTP_202_ACCEPTED,
    operation_id="resendInvitation",
)
def resend_invitation(
    doctor_id: UUID,
    admin: Doctor = Depends(require_admin),
    service: DoctorService = Depends(get_doctor_service),
) -> InvitationIssued:
    return InvitationIssued(expires_at=service.resend_invitation(doctor_id, actor=admin))


@router.get(
    "/{doctor_id}/avatar",
    response_class=Response,
    responses={200: {"content": {"image/png": {}, "image/jpeg": {}, "image/webp": {}}}},
    operation_id="getDoctorAvatar",
)
def get_doctor_avatar(
    doctor_id: UUID,
    _: Doctor = Depends(get_current_user),
    service: DoctorService = Depends(get_doctor_service),
) -> Response:
    data, media_type = service.get_avatar(doctor_id)
    return Response(
        data, media_type=media_type, headers={"Cache-Control": "private, max-age=86400"}
    )
