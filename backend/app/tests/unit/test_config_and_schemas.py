import pytest
from pydantic import ValidationError

from evidea.core.config import Settings
from evidea.core.schemas import PageMeta


def test_database_url_gets_psycopg_driver() -> None:
    settings = Settings(DATABASE_APP_URL="postgresql://u:p@db:5432/evidea", JWT_SECRET="x" * 32)
    assert settings.database_app_url == "postgresql+psycopg://u:p@db:5432/evidea"


def test_short_jwt_secret_is_rejected() -> None:
    with pytest.raises(ValidationError):
        Settings(DATABASE_APP_URL="postgresql://u:p@db/evidea", JWT_SECRET="too-short")


@pytest.mark.parametrize(
    ("total", "page_size", "pages"), [(0, 20, 0), (1, 20, 1), (20, 20, 1), (21, 20, 2)]
)
def test_page_meta_total_pages(total: int, page_size: int, pages: int) -> None:
    meta = PageMeta.build(page=1, page_size=page_size, total_items=total)
    assert meta.total_pages == pages
    assert meta.model_dump(by_alias=True)["totalItems"] == total
