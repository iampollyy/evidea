"""Create lab reports, results and the result consistency trigger"""

from pathlib import Path

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

SQL_FILE = Path(__file__).resolve().parents[1] / "sql" / "0004_create_lab_reports.sql"


def upgrade() -> None:
    op.get_bind().connection.driver_connection.execute(SQL_FILE.read_text(encoding="utf-8"))


def downgrade() -> None:
    raise NotImplementedError("Forward-only migrations: add a corrective revision instead")
