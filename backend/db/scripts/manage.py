import os
import subprocess
import sys
from pathlib import Path

import psycopg
from psycopg import sql

DB_DIR = Path(__file__).resolve().parents[1]
APP_ROLE = "evidea_app"


def owner_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("DATABASE_URL is not set")
    return url


def ensure_app_role(url: str) -> None:
    password = os.environ.get("EVIDEA_APP_PASSWORD")
    if not password:
        sys.exit("EVIDEA_APP_PASSWORD is not set")
    with psycopg.connect(url, autocommit=True) as connection:
        exists = connection.execute(
            "SELECT 1 FROM pg_roles WHERE rolname = %s", (APP_ROLE,)
        ).fetchone()
        action = "ALTER ROLE {role} WITH LOGIN NOSUPERUSER PASSWORD {password}"
        if not exists:
            action = "CREATE ROLE {role} LOGIN NOSUPERUSER PASSWORD {password} IN ROLE app_write"
        connection.execute(
            sql.SQL(action).format(role=sql.Identifier(APP_ROLE), password=sql.Literal(password))
        )
        connection.execute(
            sql.SQL("GRANT app_write TO {role}").format(role=sql.Identifier(APP_ROLE))
        )
    print(f"role {APP_ROLE} is ready")


def run_sql_file(url: str, name: str) -> None:
    script = (DB_DIR / "seeds" / name).read_text(encoding="utf-8")
    with psycopg.connect(url, autocommit=True) as connection:
        connection.execute(script)
    print(f"applied {name}")


def migrate(url: str) -> None:
    subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=DB_DIR, check=True)
    ensure_app_role(url)


COMMANDS = {
    "migrate": migrate,
    "demo-seed": lambda url: run_sql_file(url, "demo_seed.sql"),
    "dev-seed": lambda url: run_sql_file(url, "dev_seed.sql"),
}


def main() -> None:
    command = sys.argv[1] if len(sys.argv) > 1 else "migrate"
    if command not in COMMANDS:
        sys.exit(f"unknown command {command!r}; use one of: {', '.join(COMMANDS)}")
    COMMANDS[command](owner_url())


if __name__ == "__main__":
    main()
