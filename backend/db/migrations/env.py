import hashlib
import os
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import create_engine, text

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

SQL_DIR = Path(__file__).resolve().parent / "sql"

# Journal of applied revisions with a SHA-256 checksum of the SQL file.
# Alembic's own alembic_version table has no checksums, so we keep this extra table.
JOURNAL_DDL = """
CREATE TABLE IF NOT EXISTS migration_checksums (
    revision    TEXT PRIMARY KEY,
    checksum    TEXT NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
)
"""


def sql_file_for(revision: str) -> Path:
    matches = sorted(SQL_DIR.glob(f"{revision}_*.sql"))
    if len(matches) != 1:
        raise RuntimeError(f"expected exactly one SQL file for revision {revision}, found {len(matches)}")
    return matches[0]


def checksum_for(revision: str) -> str:
    return hashlib.sha256(sql_file_for(revision).read_bytes()).hexdigest()


def database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


def verify_applied_checksums(conn) -> None:
    rows = conn.execute(text("SELECT revision, checksum FROM migration_checksums")).all()
    for revision, stored in rows:
        if checksum_for(revision) != stored:
            raise RuntimeError(
                f"checksum mismatch for applied migration {revision}. "
                "Applied migrations must not be edited; add a new revision instead."
            )


def on_version_apply(ctx, step, heads, run_args):
    if step.is_upgrade and step.up_revision_id:
        ctx.connection.execute(
            text("INSERT INTO migration_checksums (revision, checksum) VALUES (:rev, :sum)"),
            {"rev": step.up_revision_id, "sum": checksum_for(step.up_revision_id)},
        )


def run_migrations_online() -> None:
    engine = create_engine(database_url())
    with engine.connect() as conn:
        conn.execute(text(JOURNAL_DDL))
        conn.commit()
        verify_applied_checksums(conn)
        conn.commit()

        context.configure(
            connection=conn,
            transaction_per_migration=True,
            on_version_apply=[on_version_apply],
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    raise RuntimeError("offline mode is not supported: checksums need a live database")

run_migrations_online()
