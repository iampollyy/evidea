from typing import Any
from uuid import uuid4

import pytest
from pydantic import ValidationError

from evidea.modules.auth.schemas import AcceptInvitationRequest, LoginRequest
from evidea.modules.patients.schemas import PatientCreate, PatientReplace

VALID_PATIENT: dict[str, Any] = {
    "name": " Alberto ",
    "surname": "Ripley",
    "birthDate": "1998-01-25",
    "sex": "male",
    "email": "alberto.ripley@mail.example",
}


def field_errors(error: ValidationError) -> dict[str, str]:
    return {".".join(str(p) for p in e["loc"]): e["msg"] for e in error.errors()}


def test_patient_create_trims_and_defaults_phone() -> None:
    patient = PatientCreate.model_validate({**VALID_PATIENT, "phoneNumber": "  "})
    assert patient.name == "Alberto"
    assert patient.phone_number is None


@pytest.mark.parametrize(
    ("override", "field"),
    [
        ({"name": "R2D2"}, "name"),
        ({"birthDate": "2999-01-01"}, "birthDate"),
        ({"sex": "robot"}, "sex"),
        ({"email": "not-an-email"}, "email"),
        ({"phoneNumber": "123"}, "phoneNumber"),
        ({"unexpected": 1}, "unexpected"),
    ],
)
def test_patient_create_rejects_invalid_fields(override: dict[str, Any], field: str) -> None:
    with pytest.raises(ValidationError) as caught:
        PatientCreate.model_validate({**VALID_PATIENT, **override})
    assert field in field_errors(caught.value)


def test_patient_replace_requires_every_field_including_phone() -> None:
    with pytest.raises(ValidationError) as caught:
        PatientReplace.model_validate(VALID_PATIENT)
    assert "phoneNumber" in field_errors(caught.value)
    cleared = PatientReplace.model_validate({**VALID_PATIENT, "phoneNumber": None})
    assert cleared.phone_number is None


def test_doctor_create_rules() -> None:
    from evidea.modules.doctors.schemas import DoctorCreate

    base = {"name": "Tomas", "surname": "Kazlauskas", "email": "t@clinic.example", "role": "admin"}
    doctor = DoctorCreate.model_validate(base)
    assert doctor.birth_date is None and doctor.sex is None and doctor.phone_number is None

    with pytest.raises(ValidationError) as caught:
        DoctorCreate.model_validate({**base, "birthDate": "2015-01-01", "role": "nurse"})
    errors = field_errors(caught.value)
    assert errors["birthDate"].endswith("Doctor must be at least 18 years old")
    assert "role" in errors


def test_case_create_rules() -> None:
    from evidea.modules.cases.schemas import AnamnesisCreate, CaseCreate

    with pytest.raises(ValidationError) as caught:
        CaseCreate.model_validate(
            {
                "anamnesis": {"chiefComplaint": "too short"},
                "vitalSigns": {"spo2Percent": None},
                "labReports": [
                    {"panelId": str(uuid4()), "collectedAt": "2026-01-01T08:00:00", "results": []}
                ],
            }
        )
    errors = field_errors(caught.value)
    assert "anamnesis.chiefComplaint" in errors
    assert "vitalSigns" in errors
    assert "labReports.0.collectedAt" in errors
    assert "labReports.0.results" in errors

    case = CaseCreate.model_validate(
        {"anamnesis": {"chiefComplaint": "Progressive muscle weakness", "allergies": " "}}
    )
    assert case.anamnesis.allergies is None
    assert case.vital_signs is None and case.lab_reports == []

    with pytest.raises(ValidationError) as caught:
        AnamnesisCreate.model_validate(
            {"chiefComplaint": "Progressive muscle weakness", "familyHistory": "Null\x00character"}
        )
    assert "familyHistory" in field_errors(caught.value)


@pytest.mark.parametrize(("value", "kind"), [(True, bool), (1520, int), (13.5, float), ("x", str)])
def test_lab_values_keep_their_json_type(value: object, kind: type) -> None:
    from evidea.modules.cases.schemas import LabResultCreate

    result = LabResultCreate.model_validate({"analyteId": str(uuid4()), "value": value})
    assert type(result.value) is kind


def test_password_is_not_trimmed_and_policy_is_enforced() -> None:
    login = LoginRequest.model_validate({"email": " a@b.example ", "password": " Pass#1 "})
    assert login.password == " Pass#1 "
    assert login.email == "a@b.example"

    with pytest.raises(ValidationError) as caught:
        AcceptInvitationRequest.model_validate({"token": "t" * 40, "password": "password1"})
    message = field_errors(caught.value)["password"]
    assert "uppercase" in message and "special character" in message
    assert AcceptInvitationRequest.model_validate({"token": "t" * 40, "password": "Clinic#2026"})
