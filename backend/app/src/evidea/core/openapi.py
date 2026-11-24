from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml
from fastapi import FastAPI

from evidea.core.logging import get_logger


@lru_cache
def _read_contract(path: Path) -> dict[str, Any]:
    contract: dict[str, Any] = yaml.safe_load(path.read_text(encoding="utf-8"))
    return contract


def load_contract(path: Path | None, server_url: str) -> dict[str, Any] | None:
    if path is None or not path.is_file():
        get_logger(__name__).warning("openapi_contract_missing", path=str(path))
        return None
    return {
        **_read_contract(path.resolve()),
        "servers": [{"url": server_url, "description": "This server"}],
    }


class ContractFastAPI(FastAPI):
    contract_schema: dict[str, Any] | None = None

    def openapi(self) -> dict[str, Any]:
        return self.contract_schema or super().openapi()
