"""Business rules for lab results (DQ-22), independent of FastAPI and the database.

The database enforces the same rules with a trigger; checking them here first lets the API
return precise field errors (e.g. `labReports.0.results.1.value`) instead of a generic failure.
"""

from collections.abc import Mapping, Sequence
from datetime import datetime
from decimal import Decimal
from typing import Protocol
from uuid import UUID

LabValue = bool | int | float | str


NUMERIC_LIMIT = Decimal("100000000")


class PanelInfo(Protocol):
    @property
    def id(self) -> UUID: ...
    @property
    def is_active(self) -> bool: ...


class AnalyteInfo(Protocol):
    @property
    def id(self) -> UUID: ...
    @property
    def panel_id(self) -> UUID: ...
    @property
    def data_type(self) -> str: ...
    @property
    def is_active(self) -> bool: ...


class LabResultInput(Protocol):
    @property
    def analyte_id(self) -> UUID: ...
    @property
    def value(self) -> LabValue: ...


class LabReportInput(Protocol):
    @property
    def panel_id(self) -> UUID: ...
    @property
    def collected_at(self) -> datetime: ...
    @property
    def results(self) -> Sequence[LabResultInput]: ...


def _error(field: str, message: str, code: str) -> dict[str, str]:
    return {"field": field, "message": message, "code": code}


def value_matches_type(value: LabValue, data_type: str) -> bool:
    if data_type == "numeric":

        return isinstance(value, int | float) and not isinstance(value, bool)
    if data_type == "boolean":
        return isinstance(value, bool)
    return isinstance(value, str)


def validate_lab_reports(
    reports: Sequence[LabReportInput],
    *,
    panels: Mapping[UUID, PanelInfo],
    analytes: Mapping[UUID, AnalyteInfo],
    now: datetime,
) -> list[dict[str, str]]:
    """Return all field errors at once (empty list = valid)."""
    errors: list[dict[str, str]] = []
    for i, report in enumerate(reports):
        prefix = f"labReports.{i}"
        panel = panels.get(report.panel_id)
        if panel is None or not panel.is_active:
            errors.append(
                _error(f"{prefix}.panelId", "Unknown or inactive lab panel", "unknown_panel")
            )
            continue
        if report.collected_at > now:
            errors.append(
                _error(
                    f"{prefix}.collectedAt", "Collection time cannot be in the future", "in_future"
                )
            )
        seen: set[UUID] = set()
        for j, result in enumerate(report.results):
            field = f"{prefix}.results.{j}"
            analyte = analytes.get(result.analyte_id)
            if analyte is None or not analyte.is_active:
                errors.append(
                    _error(f"{field}.analyteId", "Unknown or inactive analyte", "unknown_analyte")
                )
            elif analyte.panel_id != report.panel_id:
                errors.append(
                    _error(
                        f"{field}.analyteId", "Analyte does not belong to the panel", "wrong_panel"
                    )
                )
            elif result.analyte_id in seen:
                errors.append(
                    _error(
                        f"{field}.analyteId", "Analyte is listed twice in the report", "duplicate"
                    )
                )
            elif not value_matches_type(result.value, analyte.data_type):
                errors.append(
                    _error(f"{field}.value", f"Value must be {analyte.data_type}", "wrong_type")
                )
            elif (
                analyte.data_type == "numeric" and abs(Decimal(str(result.value))) >= NUMERIC_LIMIT
            ):
                errors.append(_error(f"{field}.value", "Value is out of range", "out_of_range"))
            seen.add(result.analyte_id)
    return errors


def to_columns(value: LabValue) -> tuple[Decimal | None, str | None]:
    """Map an API value to (numeric_val, text_val). Call only after validation."""
    if isinstance(value, bool):
        return None, "true" if value else "false"
    if isinstance(value, int | float):
        return Decimal(str(value)), None
    return None, value


def from_columns(numeric: Decimal | None, text: str | None, data_type: str) -> LabValue:
    """Map stored columns back to a typed API value."""
    if data_type == "numeric" and numeric is not None:
        return int(numeric) if numeric == numeric.to_integral_value() else float(numeric)
    if data_type == "boolean":
        return text == "true"
    return text or ""
