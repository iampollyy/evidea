from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from evidea.core.db import get_session
from evidea.core.schemas import Page, PageMeta
from evidea.modules.auth.dependencies import get_current_user
from evidea.modules.cases.models import CaseAnamnesis
from evidea.modules.cases.repository import LatestPredictionRow
from evidea.modules.cases.schemas import (
    AnamnesisOut,
    AnamnesisReplace,
    CaseCreate,
    CaseDetail,
    CaseSummary,
    LabReportOut,
    LabResultOut,
    LatestPrediction,
    VitalSignsOut,
)
from evidea.modules.cases.service import CaseService, CaseView
from evidea.modules.catalog.schemas import AnalyteRef, PanelRef
from evidea.modules.doctors.models import Doctor
from evidea.modules.doctors.schemas import DoctorRef

router = APIRouter(tags=["Cases"])


def get_case_service(session: Session = Depends(get_session)) -> CaseService:
    return CaseService(session)


def _doctor_ref(doctor: Doctor) -> DoctorRef:
    return DoctorRef(id=doctor.id, name=doctor.name, surname=doctor.surname)


def _latest(row: LatestPredictionRow | None) -> LatestPrediction | None:
    if row is None:
        return None
    return LatestPrediction(
        run_id=row.run_id,
        completed_at=row.completed_at,
        top_disease_name=row.top_disease_name,
        top_score=float(row.top_score),
    )


def _anamnesis(anamnesis: CaseAnamnesis, author: Doctor) -> AnamnesisOut:
    return AnamnesisOut(
        id=anamnesis.id,
        chief_complaint=anamnesis.chief_complaint,
        symptoms_duration=anamnesis.symptoms_duration,
        clinical_notes=anamnesis.clinical_notes,
        family_history=anamnesis.family_history,
        medications=anamnesis.medications,
        past_medical_history=anamnesis.past_medical_history,
        allergies=anamnesis.allergies,
        created_by=_doctor_ref(author),
        created_at=anamnesis.created_at,
        updated_at=anamnesis.updated_at,
    )


def _case_detail(view: CaseView) -> CaseDetail:
    return CaseDetail(
        id=view.case.id,
        patient_id=view.case.patient_id,
        created_at=view.case.created_at,
        updated_at=view.case.updated_at,
        created_by=_doctor_ref(view.author),
        anamnesis=_anamnesis(view.anamnesis, view.anamnesis_author),
        vital_signs=[VitalSignsOut.model_validate(v) for v in view.vital_signs],
        lab_reports=[
            LabReportOut(
                id=r.report.id,
                panel=PanelRef.model_validate(r.panel),
                collected_at=r.report.collected_at,
                created_at=r.report.created_at,
                results=[
                    LabResultOut(
                        id=res.item.id,
                        analyte=AnalyteRef.model_validate(res.analyte),
                        value=res.value,
                    )
                    for res in r.results
                ],
            )
            for r in view.lab_reports
        ],
        latest_prediction=_latest(view.latest_prediction),
    )


@router.get(
    "/patients/{patient_id}/cases",
    response_model=Page[CaseSummary],
    operation_id="listPatientCases",
)
def list_patient_cases(
    patient_id: UUID,
    page: int = Query(1, ge=1, le=2_147_483_647),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
    _: Doctor = Depends(get_current_user),
    service: CaseService = Depends(get_case_service),
) -> Page[CaseSummary]:
    rows, total = service.list_for_patient(patient_id, page=page, page_size=page_size)
    return Page[CaseSummary](
        items=[
            CaseSummary(
                id=row.case.id,
                patient_id=row.case.patient_id,
                created_at=row.case.created_at,
                created_by=_doctor_ref(row.author),
                chief_complaint=row.chief_complaint,
                latest_prediction=_latest(latest),
            )
            for row, latest in rows
        ],
        meta=PageMeta.build(page=page, page_size=page_size, total_items=total),
    )


@router.post(
    "/patients/{patient_id}/cases",
    response_model=CaseDetail,
    status_code=status.HTTP_201_CREATED,
    operation_id="createCase",
)
def create_case(
    patient_id: UUID,
    body: CaseCreate,
    response: Response,
    user: Doctor = Depends(get_current_user),
    service: CaseService = Depends(get_case_service),
) -> CaseDetail:
    view = service.create(patient_id, body, actor=user)
    response.headers["Location"] = f"/api/v1/cases/{view.case.id}"
    return _case_detail(view)


@router.get("/cases/{case_id}", response_model=CaseDetail, operation_id="getCase")
def get_case(
    case_id: UUID,
    _: Doctor = Depends(get_current_user),
    service: CaseService = Depends(get_case_service),
) -> CaseDetail:
    return _case_detail(service.get(case_id))


@router.put(
    "/cases/{case_id}/anamnesis", response_model=AnamnesisOut, operation_id="replaceAnamnesis"
)
def replace_anamnesis(
    case_id: UUID,
    body: AnamnesisReplace,
    user: Doctor = Depends(get_current_user),
    service: CaseService = Depends(get_case_service),
) -> AnamnesisOut:
    return _anamnesis(*service.replace_anamnesis(case_id, body, actor=user))
