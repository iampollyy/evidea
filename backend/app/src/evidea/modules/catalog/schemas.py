from typing import Literal
from uuid import UUID

from evidea.core.schemas import ApiModel

DataType = Literal["numeric", "text", "boolean"]


class AnalyteRef(ApiModel):
    id: UUID
    code: str
    name: str
    unit: str | None
    data_type: DataType


class PanelRef(ApiModel):
    id: UUID
    code: str
    name: str


class CatalogPanel(PanelRef):
    analytes: list[AnalyteRef]


class CatalogCategory(ApiModel):
    id: UUID
    code: str
    name: str
    panels: list[CatalogPanel]


class LabCatalog(ApiModel):
    categories: list[CatalogCategory]
