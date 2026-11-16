"""Create ML registry: model versions, diseases, prediction runs and hypotheses"""

from pathlib import Path

from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

SQL_FILE = Path(__file__).resolve().parents[1] / "sql" / "0005_create_ml_registry.sql"


def upgrade() -> None:
    op.get_bind().connection.driver_connection.execute(SQL_FILE.read_text(encoding="utf-8"))


def downgrade() -> None:
    raise NotImplementedError("Forward-only migrations: add a corrective revision instead")
