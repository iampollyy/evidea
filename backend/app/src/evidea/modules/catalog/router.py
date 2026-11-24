from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from evidea.core.db import get_session
from evidea.modules.auth.dependencies import get_current_user
from evidea.modules.catalog.repository import CatalogRepository
from evidea.modules.catalog.schemas import (
    AnalyteRef,
    CatalogCategory,
    CatalogPanel,
    LabCatalog,
)
from evidea.modules.doctors.models import Doctor

router = APIRouter(prefix="/lab-catalog", tags=["Lab catalog"])


@router.get("", response_model=LabCatalog, operation_id="getLabCatalog")
def get_lab_catalog(
    _: Doctor = Depends(get_current_user), session: Session = Depends(get_session)
) -> LabCatalog:
    categories, panels, analytes = CatalogRepository(session).active_catalog()

    analytes_by_panel: dict[UUID, list[AnalyteRef]] = defaultdict(list)
    for analyte in analytes:
        analytes_by_panel[analyte.panel_id].append(AnalyteRef.model_validate(analyte))

    panels_by_category: dict[UUID, list[CatalogPanel]] = defaultdict(list)
    for panel in panels:
        panels_by_category[panel.category_id].append(
            CatalogPanel(
                id=panel.id,
                code=panel.code,
                name=panel.name,
                analytes=analytes_by_panel[panel.id],
            )
        )

    return LabCatalog(
        categories=[
            CatalogCategory(id=c.id, code=c.code, name=c.name, panels=panels_by_category[c.id])
            for c in categories
        ]
    )
