from email.message import EmailMessage
from typing import Any, ClassVar

import pytest
from pydantic import SecretStr

from evidea.adapters import email as email_module
from evidea.adapters.email import OutgoingEmail, SmtpEmailSender
from evidea.core.config import Settings


class FakeSMTP:
    instances: ClassVar[list["FakeSMTP"]] = []

    def __init__(self, host: str, port: int, timeout: int) -> None:
        self.address = (host, port)
        self.calls: list[str] = []
        self.sent: list[EmailMessage] = []
        FakeSMTP.instances.append(self)

    def __enter__(self) -> "FakeSMTP":
        return self

    def __exit__(self, *exc: Any) -> None:
        self.calls.append("quit")

    def starttls(self) -> None:
        self.calls.append("starttls")

    def login(self, user: str, password: str) -> None:
        self.calls.append(f"login:{user}:{password}")

    def send_message(self, message: EmailMessage) -> None:
        self.sent.append(message)


@pytest.fixture(autouse=True)
def fake_smtp(monkeypatch: pytest.MonkeyPatch) -> None:
    FakeSMTP.instances.clear()
    monkeypatch.setattr(email_module.smtplib, "SMTP", FakeSMTP)


def make_settings(**override: Any) -> Settings:
    return Settings(DATABASE_APP_URL="postgresql://u:p@db/evidea", JWT_SECRET="x" * 40, **override)


MAIL = OutgoingEmail(to="doc@clinic.example", subject="Invitation", body="Hello")


def test_plain_smtp_for_local_mail_catcher() -> None:
    SmtpEmailSender(make_settings()).send(MAIL)
    smtp = FakeSMTP.instances[0]
    assert smtp.address == ("localhost", 1025)
    assert smtp.calls == ["quit"]
    message = smtp.sent[0]
    assert message["To"] == "doc@clinic.example"
    assert message["From"] == "EVIDEA <no-reply@evidea.local>"
    assert message.get_content().strip() == "Hello"


def test_starttls_and_login_for_a_real_provider() -> None:
    settings = make_settings(
        smtp_host="smtp.provider.example",
        smtp_port=587,
        smtp_starttls=True,
        smtp_username="api",
        smtp_password=SecretStr("secret"),
    )
    SmtpEmailSender(settings).send(MAIL)
    assert FakeSMTP.instances[0].calls == ["starttls", "login:api:secret", "quit"]
