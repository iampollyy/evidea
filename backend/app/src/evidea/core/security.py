import hashlib
import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from pwdlib.hashers.argon2 import Argon2Hasher

_password_hash = PasswordHash((Argon2Hasher(),))


_DUMMY_HASH = _password_hash.hash(secrets.token_urlsafe(32))


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        _password_hash.verify(password, _DUMMY_HASH)
        return False
    try:
        return _password_hash.verify(password, password_hash)
    except UnknownHashError:
        return False


def unusable_password_hash() -> str:
    return hash_password(secrets.token_urlsafe(48))


PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


def password_policy_errors(password: str) -> list[str]:
    errors = []
    if not PASSWORD_MIN_LENGTH <= len(password) <= PASSWORD_MAX_LENGTH:
        errors.append(f"must be {PASSWORD_MIN_LENGTH} to {PASSWORD_MAX_LENGTH} characters long")
    if not re.search(r"[A-Z]", password):
        errors.append("must contain an uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("must contain a lowercase letter")
    if not re.search(r"[0-9]", password):
        errors.append("must contain a digit")
    if not re.search(r"[^A-Za-z0-9]", password):
        errors.append("must contain a special character")
    return errors


_JWT_ALGORITHM = "HS256"


@dataclass(frozen=True)
class SessionClaims:
    user_id: UUID
    role: str
    expires_at: datetime


def create_session_token(
    *, user_id: UUID, role: str, secret: str, ttl: timedelta, now: datetime | None = None
) -> str:
    issued = now or datetime.now(UTC)
    payload = {"sub": str(user_id), "role": role, "iat": issued, "exp": issued + ttl}
    return jwt.encode(payload, secret, algorithm=_JWT_ALGORITHM)


def decode_session_token(token: str, *, secret: str) -> SessionClaims | None:
    try:
        payload = jwt.decode(
            token, secret, algorithms=[_JWT_ALGORITHM], options={"require": ["sub", "exp", "iat"]}
        )
        return SessionClaims(
            user_id=UUID(payload["sub"]),
            role=str(payload.get("role", "")),
            expires_at=datetime.fromtimestamp(payload["exp"], tz=UTC),
        )
    except (jwt.PyJWTError, ValueError, KeyError):
        return None




def generate_one_time_token() -> str:
    """32 random bytes, URL-safe. Sent to the user once; only its hash is stored."""
    return secrets.token_urlsafe(32)


def hash_one_time_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
