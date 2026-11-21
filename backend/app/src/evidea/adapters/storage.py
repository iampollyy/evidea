import uuid
from pathlib import Path
from typing import Protocol

from fastapi import Request


class FileStorage(Protocol):
    def save(self, data: bytes, *, folder: str, extension: str) -> str: ...

    def read(self, key: str) -> bytes | None: ...

    def delete(self, key: str) -> None: ...


class LocalFileStorage:
    """Stores files on disk (a Docker volume in deployment). File names are generated, never
    taken from the client, so uploads cannot overwrite other files or escape the folder."""

    def __init__(self, base_dir: Path) -> None:
        self.base_dir = base_dir.resolve()

    def _path(self, key: str) -> Path:
        path = (self.base_dir / key).resolve()
        if not path.is_relative_to(self.base_dir):
            raise ValueError("storage key escapes the storage directory")
        return path

    def save(self, data: bytes, *, folder: str, extension: str) -> str:
        key = f"{folder}/{uuid.uuid4().hex}.{extension}"
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return key

    def read(self, key: str) -> bytes | None:
        path = self._path(key)
        return path.read_bytes() if path.is_file() else None

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)


def get_storage(request: Request) -> FileStorage:
    storage: FileStorage = request.app.state.storage
    return storage
