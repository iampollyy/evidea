from datetime import date

import pytest

from evidea.domain import person

TODAY = date(2026, 11, 21)


@pytest.mark.parametrize("value", ["Al", "Anna-Maria", "O'Neil", "Jürgen", "Полина", " Ann "])
def test_valid_names(value: str) -> None:
    assert person.validate_person_name(value, "Name") == value.strip()


@pytest.mark.parametrize(
    ("value", "message"),
    [
        ("", "Name is required"),
        ("   ", "Name is required"),
        ("A", "Name must be at least 2 characters"),
        ("A" * 101, "Name must be at most 100 characters"),
        ("R2D2", "Name can only contain letters, spaces, ' and -"),
        ("<script>", "Name can only contain letters, spaces, ' and -"),
    ],
)
def test_invalid_names(value: str, message: str) -> None:
    with pytest.raises(ValueError, match=message):
        person.validate_person_name(value, "Name")


@pytest.mark.parametrize("value", ["+370 612 45 648", "(0612) 45-648", "1234567", "+" + "1" * 15])
def test_valid_phones(value: str) -> None:
    assert person.validate_phone(value) == value


@pytest.mark.parametrize("value", ["123456", "+" + "1" * 16, "phone 1234567", "12#34567"])
def test_invalid_phones(value: str) -> None:
    with pytest.raises(ValueError, match="Enter a valid phone number"):
        person.validate_phone(value)


@pytest.mark.parametrize(
    ("birth", "age"),
    [
        (date(2000, 11, 21), 26),
        (date(2000, 11, 22), 25),
        (date(2000, 2, 29), 26),
        (TODAY, 0),
    ],
)
def test_age_on(birth: date, age: int) -> None:
    assert person.age_on(birth, TODAY) == age


def test_birth_date_rules() -> None:
    assert person.validate_birth_date(date(1990, 1, 1), today=TODAY, max_age=130)
    with pytest.raises(ValueError, match="cannot be in the future"):
        person.validate_birth_date(date(2026, 11, 22), today=TODAY, max_age=130)
    with pytest.raises(ValueError, match="Enter a valid date of birth"):
        person.validate_birth_date(date(1890, 1, 1), today=TODAY, max_age=130)
    with pytest.raises(ValueError, match="Doctor must be at least 18 years old"):
        person.validate_birth_date(
            date(2015, 1, 1),
            today=TODAY,
            min_age=18,
            max_age=100,
            min_age_message="Doctor must be at least 18 years old",
        )
