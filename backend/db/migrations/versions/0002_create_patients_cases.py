"""Create patients, cases, anamneses and vital signs"""

from pathlib import Path

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

SQL_FILE = Path(__file__).resolve().parents[1] / "sql" / "0002_create_patients_cases.sql"


def upgrade() -> None:
    op.get_bind().connection.driver_connection.execute(SQL_FILE.read_text(encoding="utf-8"))


def downgrade() -> None:
    raise NotImplementedError("Forward-only migrations: add a corrective revision instead")
