"""Imports every ORM model so SQLAlchemy knows all tables (foreign keys between modules)."""

from evidea.modules.audit.models import AuditLog
from evidea.modules.cases.models import (
    Case,
    CaseAnamnesis,
    CaseLabReport,
    CaseVitalSigns,
    LabReport,
    LabResultItem,
    VitalSigns,
)
from evidea.modules.catalog.models import LabAnalyte, LabCategory, LabPanel
from evidea.modules.doctors.models import Doctor, Invitation, Role
from evidea.modules.patients.models import Patient

__all__ = [
    "AuditLog",
    "Case",
    "CaseAnamnesis",
    "CaseLabReport",
    "CaseVitalSigns",
    "Doctor",
    "Invitation",
    "LabAnalyte",
    "LabCategory",
    "LabPanel",
    "LabReport",
    "LabResultItem",
    "Patient",
    "Role",
    "VitalSigns",
]
