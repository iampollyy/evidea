from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from evidea.modules.catalog.models import LabAnalyte, LabCategory, LabPanel


class CatalogRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def active_catalog(self) -> tuple[list[LabCategory], list[LabPanel], list[LabAnalyte]]:
        categories = self.session.scalars(
            select(LabCategory).where(LabCategory.is_active).order_by(LabCategory.name)
        ).all()
        panels = self.session.scalars(
            select(LabPanel).where(LabPanel.is_active).order_by(LabPanel.name)
        ).all()
        analytes = self.session.scalars(
            select(LabAnalyte).where(LabAnalyte.is_active).order_by(LabAnalyte.name)
        ).all()
        return list(categories), list(panels), list(analytes)

    def panels_by_id(self, ids: Iterable[UUID]) -> dict[UUID, LabPanel]:
        ids = set(ids)
        if not ids:
            return {}
        rows = self.session.scalars(select(LabPanel).where(LabPanel.id.in_(ids))).all()
        return {panel.id: panel for panel in rows}

    def analytes_by_id(self, ids: Iterable[UUID]) -> dict[UUID, LabAnalyte]:
        ids = set(ids)
        if not ids:
            return {}
        rows = self.session.scalars(select(LabAnalyte).where(LabAnalyte.id.in_(ids))).all()
        return {analyte.id: analyte for analyte in rows}
