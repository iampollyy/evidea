import argparse
import getpass
import os
import sys
from collections.abc import Sequence
from importlib import import_module

from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from evidea.core.config import get_settings
from evidea.core.db import create_db_engine, create_session_factory
from evidea.core.security import hash_password, password_policy_errors
from evidea.core.sql import violated_constraint
from evidea.modules.audit.service import record_event
from evidea.modules.doctors.models import Doctor
from evidea.modules.doctors.repository import EMAIL_CONSTRAINT, DoctorRepository
from evidea.modules.doctors.schemas import DoctorCreate

CREDENTIAL_ENV_VAR = "EVIDEA_USER_PASSWORD"

import_module("evidea.models")


class CliError(Exception):
    pass


def create_user(session: Session, data: DoctorCreate, password: str) -> Doctor:
    problems = password_policy_errors(password)
    if problems:
        raise CliError("Password " + "; ".join(problems))
    repo = DoctorRepository(session)
    doctor = Doctor(
        **data.model_dump(exclude={"role"}),
        role_id=repo.role_by_name(data.role).id,
        password_hash=hash_password(password),
    )
    try:
        repo.add(doctor)
    except IntegrityError as error:
        session.rollback()
        if violated_constraint(error) == EMAIL_CONSTRAINT:
            raise CliError(f"An account with email {data.email} already exists") from error
        raise
    record_event(session, "doctor.created_by_cli", subject_id=doctor.id)
    session.commit()
    return doctor


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="python -m evidea.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    create = commands.add_parser("create-user", help="create an active account with a password")
    create.add_argument("--email", required=True)
    create.add_argument("--name", required=True)
    create.add_argument("--surname", required=True)
    create.add_argument("--role", choices=["admin", "clinician"], required=True)
    return parser


def run(argv: Sequence[str], session_factory: sessionmaker[Session]) -> int:
    args = _parser().parse_args(argv)
    try:
        data = DoctorCreate(name=args.name, surname=args.surname, email=args.email, role=args.role)
    except ValidationError as error:
        for problem in error.errors():
            print(f"{'.'.join(map(str, problem['loc']))}: {problem['msg']}", file=sys.stderr)
        return 2
    password = os.environ.get(CREDENTIAL_ENV_VAR) or getpass.getpass("Password: ")
    try:
        with session_factory() as session:
            doctor = create_user(session, data, password)
    except CliError as error:
        print(error, file=sys.stderr)
        return 1
    print(f"Created {data.role} {doctor.email} ({doctor.id})")
    return 0


def main() -> None:
    settings = get_settings()
    engine = create_db_engine(
        settings.database_app_url, connect_timeout_seconds=settings.db_connect_timeout_seconds
    )
    try:
        sys.exit(run(sys.argv[1:], create_session_factory(engine)))
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()
