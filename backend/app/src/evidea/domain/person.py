import re
from datetime import date

NAME_MIN_LENGTH = 2
NAME_MAX_LENGTH = 100
_NAME_EXTRA_CHARS = frozenset(" '-")

_PHONE_PATTERN = re.compile(r"^\+?[0-9\s()-]+$")
PHONE_MIN_DIGITS = 7
PHONE_MAX_DIGITS = 15

PATIENT_MAX_AGE = 130
DOCTOR_MIN_AGE = 18
DOCTOR_MAX_AGE = 100


def validate_person_name(value: str, label: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError(f"{label} is required")
    if len(cleaned) < NAME_MIN_LENGTH:
        raise ValueError(f"{label} must be at least {NAME_MIN_LENGTH} characters")
    if len(cleaned) > NAME_MAX_LENGTH:
        raise ValueError(f"{label} must be at most {NAME_MAX_LENGTH} characters")
    if not all(ch.isalpha() or ch in _NAME_EXTRA_CHARS for ch in cleaned):
        raise ValueError(f"{label} can only contain letters, spaces, ' and -")
    return cleaned


def validate_phone(value: str) -> str:
    cleaned = value.strip()
    digits = sum(ch.isdigit() for ch in cleaned)
    if not _PHONE_PATTERN.match(cleaned) or not PHONE_MIN_DIGITS <= digits <= PHONE_MAX_DIGITS:
        raise ValueError("Enter a valid phone number")
    return cleaned


def age_on(birth_date: date, today: date) -> int:
    had_birthday = (today.month, today.day) >= (birth_date.month, birth_date.day)
    return today.year - birth_date.year - (0 if had_birthday else 1)


def validate_birth_date(
    value: date,
    *,
    today: date,
    max_age: int,
    min_age: int = 0,
    min_age_message: str | None = None,
) -> date:
    if value > today:
        raise ValueError("Date of birth cannot be in the future")
    age = age_on(value, today)
    if age < min_age:
        raise ValueError(min_age_message or f"Must be at least {min_age} years old")
    if age > max_age:
        raise ValueError("Enter a valid date of birth")
    return value
