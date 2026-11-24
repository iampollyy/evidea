from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Request, Response, UploadFile, status
from sqlalchemy.orm import Session

from evidea.adapters.storage import FileStorage, get_storage
from evidea.adapters.uploads import read_upload
from evidea.core.db import get_session
from evidea.core.schemas import Page, PageMeta
from evidea.modules.auth.dependencies import get_current_user, require_admin
from evidea.modules.doctors.models import Doctor
from evidea.modules.doctors.schemas import ImageRef
from evidea.modules.patients.repository import PatientSort, PatientStatusFilter
from evidea.modules.patients.schemas import (
    PatientCreate,
    PatientListItem,
    PatientOut,
    PatientReplace,
    photo_url,
)
from evidea.modules.patients.service import PatientService, today

router = APIRouter(prefix="/patients", tags=["Patients"])


def get_patient_service(
    request: Request,
    session: Session = Depends(get_session),
    storage: FileStorage = Depends(get_storage),
) -> PatientService:
    return PatientService(
        session, storage, max_upload_bytes=request.app.state.settings.max_upload_bytes
    )


@router.get("", response_model=Page[PatientListItem], operation_id="listPatients")
def list_patients(
    page: int = Query(1, ge=1, le=2_147_483_647),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    search: str | None = Query(None, min_length=2, max_length=100, pattern=r"^[^\x00-\x1f\x7f]+$"),
    status_filter: PatientStatusFilter = Query("active", alias="status"),
    sort: PatientSort = Query("name"),
    _: Doctor = Depends(get_current_user),
    service: PatientService = Depends(get_patient_service),
) -> Page[PatientListItem]:
    rows, total = service.list(
        page=page, page_size=page_size, status=status_filter, search=search, sort=sort
    )
    now = today()
    return Page[PatientListItem](
        items=[PatientListItem.build(r, now) for r in rows],
        meta=PageMeta.build(page=page, page_size=page_size, total_items=total),
    )


@router.post(
    "",
    response_model=PatientOut,
    status_code=status.HTTP_201_CREATED,
    operation_id="createPatient",
)
def create_patient(
    body: PatientCreate,
    response: Response,
    user: Doctor = Depends(get_current_user),
    service: PatientService = Depends(get_patient_service),
) -> PatientOut:
    row = service.create(body, actor=user)
    response.headers["Location"] = f"/api/v1/patients/{row.patient.id}"
    return PatientOut.build(row, today())


@router.get("/{patient_id}", response_model=PatientOut, operation_id="getPatient")
def get_patient(
    patient_id: UUID,
    _: Doctor = Depends(get_current_user),
    service: PatientService = Depends(get_patient_service),
) -> PatientOut:
    return PatientOut.build(service.get(patient_id), today())


@router.put("/{patient_id}", response_model=PatientOut, operation_id="replacePatient")
def replace_patient(
    patient_id: UUID,
    body: PatientReplace,
    user: Doctor = Depends(get_current_user),
    service: PatientService = Depends(get_patient_service),
) -> PatientOut:
    return PatientOut.build(service.replace(patient_id, body, actor=user), today())


@router.post("/{patient_id}/archive", response_model=PatientOut, operation_id="archivePatient")
def archive_patient(
    patient_id: UUID,
    user: Doctor = Depends(get_current_user),
    service: PatientService = Depends(get_patient_service),
) -> PatientOut:
    return PatientOut.build(service.archive(patient_id, actor=user), today())


@router.post("/{patient_id}/anonymize", response_model=PatientOut, operation_id="anonymizePatient")
def anonymize_patient(
    patient_id: UUID,
    admin: Doctor = Depends(require_admin),
    service: PatientService = Depends(get_patient_service),
) -> PatientOut:
    return PatientOut.build(service.anonymize(patient_id, actor=admin), today())


@router.get(
    "/{patient_id}/photo",
    response_class=Response,
    responses={200: {"content": {"image/png": {}, "image/jpeg": {}, "image/webp": {}}}},
    operation_id="getPatientPhoto",
)
def get_patient_photo(
    patient_id: UUID,
    _: Doctor = Depends(get_current_user),
    service: PatientService = Depends(get_patient_service),
) -> Response:
    data, media_type = service.get_photo(patient_id)

    return Response(
        data, media_type=media_type, headers={"Cache-Control": "private, max-age=86400"}
    )


@router.put("/{patient_id}/photo", response_model=ImageRef, operation_id="uploadPatientPhoto")
def upload_patient_photo(
    patient_id: UUID,
    request: Request,
    file: UploadFile = File(description="PNG, JPEG or WebP, at most 2 MB."),
    user: Doctor = Depends(get_current_user),
    service: PatientService = Depends(get_patient_service),
) -> ImageRef:
    data = read_upload(file, max_bytes=request.app.state.settings.max_upload_bytes)
    patient = service.set_photo(patient_id, data, actor=user)
    return ImageRef(url=photo_url(patient.id, patient.photo_key) or "")


@router.delete(
    "/{patient_id}/photo",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="deletePatientPhoto",
)
def delete_patient_photo(
    patient_id: UUID,
    user: Doctor = Depends(get_current_user),
    service: PatientService = Depends(get_patient_service),
) -> None:
    service.delete_photo(patient_id, actor=user)
