"""Lab result rules (DQ-22) are pure functions: tested without a database."""

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

import pytest

from evidea.modules.cases.domain import (
    LabValue,
    from_columns,
    to_columns,
    validate_lab_reports,
    value_matches_type,
)

NOW = datetime(2026, 11, 21, 12, 0, tzinfo=UTC)


@dataclass(frozen=True)
class Panel:
    id: UUID
    is_active: bool = True


@dataclass(frozen=True)
class Analyte:
    id: UUID
    panel_id: UUID
    data_type: str
    is_active: bool = True


@dataclass(frozen=True)
class Result:
    analyte_id: UUID
    value: LabValue


@dataclass(frozen=True)
class Report:
    panel_id: UUID
    results: list[Result]
    collected_at: datetime = field(default=NOW - timedelta(hours=2))


PANEL = Panel(uuid4())
OTHER_PANEL = Panel(uuid4())
INACTIVE_PANEL = Panel(uuid4(), is_active=False)
CK = Analyte(uuid4(), PANEL.id, "numeric")
POSITIVE = Analyte(uuid4(), PANEL.id, "boolean")
COMMENT = Analyte(uuid4(), PANEL.id, "text")
HGB = Analyte(uuid4(), OTHER_PANEL.id, "numeric")
RETIRED = Analyte(uuid4(), PANEL.id, "numeric", is_active=False)

PANELS = {p.id: p for p in (PANEL, OTHER_PANEL, INACTIVE_PANEL)}
ANALYTES = {a.id: a for a in (CK, POSITIVE, COMMENT, HGB, RETIRED)}


def check(*reports: Report) -> list[dict[str, str]]:
    return validate_lab_reports(list(reports), panels=PANELS, analytes=ANALYTES, now=NOW)


def test_valid_report_with_every_data_type() -> None:
    report = Report(
        PANEL.id,
        [Result(CK.id, 1520), Result(POSITIVE.id, True), Result(COMMENT.id, "haemolysed")],
    )
    assert check(report) == []


@pytest.mark.parametrize(
    ("report", "field", "code"),
    [
        (Report(uuid4(), [Result(CK.id, 1)]), "labReports.0.panelId", "unknown_panel"),
        (Report(INACTIVE_PANEL.id, [Result(CK.id, 1)]), "labReports.0.panelId", "unknown_panel"),
        (
            Report(PANEL.id, [Result(CK.id, 1)], collected_at=NOW + timedelta(minutes=5)),
            "labReports.0.collectedAt",
            "in_future",
        ),
        (
            Report(PANEL.id, [Result(uuid4(), 1)]),
            "labReports.0.results.0.analyteId",
            "unknown_analyte",
        ),
        (
            Report(PANEL.id, [Result(RETIRED.id, 1)]),
            "labReports.0.results.0.analyteId",
            "unknown_analyte",
        ),
        (
            Report(PANEL.id, [Result(HGB.id, 13.5)]),
            "labReports.0.results.0.analyteId",
            "wrong_panel",
        ),
        (
            Report(PANEL.id, [Result(CK.id, 1), Result(CK.id, 2)]),
            "labReports.0.results.1.analyteId",
            "duplicate",
        ),
        (Report(PANEL.id, [Result(CK.id, "high")]), "labReports.0.results.0.value", "wrong_type"),
        (Report(PANEL.id, [Result(CK.id, True)]), "labReports.0.results.0.value", "wrong_type"),
        (Report(PANEL.id, [Result(POSITIVE.id, 1)]), "labReports.0.results.0.value", "wrong_type"),
        (Report(PANEL.id, [Result(COMMENT.id, 5)]), "labReports.0.results.0.value", "wrong_type"),
        (Report(PANEL.id, [Result(CK.id, 1e9)]), "labReports.0.results.0.value", "out_of_range"),
    ],
)
def test_invalid_reports(report: Report, field: str, code: str) -> None:
    errors = check(report)
    assert [(e["field"], e["code"]) for e in errors] == [(field, code)]


def test_all_errors_are_reported_together() -> None:
    errors = check(
        Report(PANEL.id, [Result(CK.id, "x")]),
        Report(uuid4(), [Result(CK.id, 1)]),
    )
    assert [e["field"] for e in errors] == ["labReports.0.results.0.value", "labReports.1.panelId"]


def test_bool_is_not_a_number() -> None:
    assert value_matches_type(1, "numeric")
    assert not value_matches_type(False, "numeric")


@pytest.mark.parametrize(
    ("value", "data_type", "columns"),
    [
        (1520, "numeric", (Decimal("1520"), None)),
        (13.5, "numeric", (Decimal("13.5"), None)),
        (True, "boolean", (None, "true")),
        (False, "boolean", (None, "false")),
        ("haemolysed", "text", (None, "haemolysed")),
    ],
)
def test_values_round_trip_through_columns(
    value: LabValue, data_type: str, columns: tuple[Decimal | None, str | None]
) -> None:
    assert to_columns(value) == columns
    restored = from_columns(*columns, data_type)
    assert restored == value and type(restored) is type(value)


def test_stored_numeric_with_trailing_zeros_comes_back_as_int() -> None:
    assert from_columns(Decimal("1520.0000"), None, "numeric") == 1520
    assert isinstance(from_columns(Decimal("1520.0000"), None, "numeric"), int)
