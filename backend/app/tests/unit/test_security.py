from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from evidea.core import security

SECRET = "unit-test-secret-that-is-long-enough-123456"


def test_hash_and_verify_password() -> None:
    hashed = security.hash_password("Clinic#2026")
    assert hashed.startswith("$argon2id$")
    assert security.verify_password("Clinic#2026", hashed)
    assert not security.verify_password("clinic#2026", hashed)


@pytest.mark.parametrize("stored", [None, "", "not-a-known-hash-format"])
def test_verify_password_rejects_missing_or_unknown_hash(stored: str | None) -> None:
    assert not security.verify_password("Clinic#2026", stored)


def test_unusable_password_hash_matches_db_format_and_no_password() -> None:
    hashed = security.unusable_password_hash()
    assert hashed.startswith("$argon2id$")
    assert not security.verify_password("", hashed)


@pytest.mark.parametrize(
    ("password", "violations"),
    [
        ("Clinic#2026", 0),
        ("Clinic 2026", 0),
        ("clinic#2026", 1),
        ("CLINIC#2026", 1),
        ("Clinic#Test", 1),
        ("Clinic2026", 1),
        ("Cl#1", 1),
        ("A" * 120 + "a1#" + "x" * 10, 1),
        ("", 5),
    ],
)
def test_password_policy(password: str, violations: int) -> None:
    assert len(security.password_policy_errors(password)) == violations


def test_session_token_round_trip() -> None:
    user_id = uuid4()
    token = security.create_session_token(
        user_id=user_id, role="admin", secret=SECRET, ttl=timedelta(hours=8)
    )
    claims = security.decode_session_token(token, secret=SECRET)
    assert claims is not None
    assert claims.user_id == user_id
    assert claims.role == "admin"


def test_expired_session_token_is_rejected() -> None:
    token = security.create_session_token(
        user_id=uuid4(),
        role="clinician",
        secret=SECRET,
        ttl=timedelta(hours=8),
        now=datetime.now(UTC) - timedelta(hours=9),
    )
    assert security.decode_session_token(token, secret=SECRET) is None


def test_session_token_with_wrong_secret_or_garbage_is_rejected() -> None:
    token = security.create_session_token(
        user_id=uuid4(), role="clinician", secret=SECRET, ttl=timedelta(hours=1)
    )
    assert security.decode_session_token(token, secret=SECRET + "x") is None
    assert security.decode_session_token("garbage", secret=SECRET) is None


def test_one_time_token_is_random_and_hash_is_stable() -> None:
    first, second = security.generate_one_time_token(), security.generate_one_time_token()
    assert first != second
    assert len(first) >= 40
    digest = security.hash_one_time_token(first)
    assert digest == security.hash_one_time_token(first)
    assert len(digest) == 64
    assert digest != first
