from pydantic import ConfigDict, EmailStr, Field, field_validator

from evidea.core.schemas import InputModel
from evidea.core.security import PASSWORD_MAX_LENGTH, password_policy_errors


class _RawInput(InputModel):

    model_config = ConfigDict(str_strip_whitespace=False)


class LoginRequest(_RawInput):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)

    @field_validator("email", mode="before")
    @classmethod
    def _trim_email(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class AcceptInvitationRequest(_RawInput):
    token: str = Field(min_length=20, max_length=200)
    password: str = Field(
        min_length=8,
        max_length=PASSWORD_MAX_LENGTH,
        description=(
            "At least 8 characters with an uppercase letter, a lowercase letter, "
            "a digit and a special character."
        ),
    )

    @field_validator("password")
    @classmethod
    def _password_policy(cls, value: str) -> str:
        errors = password_policy_errors(value)
        if errors:
            raise ValueError("Password " + "; ".join(errors))
        return value
