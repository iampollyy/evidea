from pathlib import Path

import pytest

from evidea.adapters import images
from evidea.adapters.storage import LocalFileStorage
from evidea.core.errors import PayloadTooLargeError, UnsupportedMediaTypeError

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 16
WEBP = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"\x00" * 8


@pytest.mark.parametrize(
    ("data", "media_type"), [(PNG, "image/png"), (JPEG, "image/jpeg"), (WEBP, "image/webp")]
)
def test_detects_image_type_from_content(data: bytes, media_type: str) -> None:
    detected = images.validate_image(data, max_bytes=1024)
    assert detected.media_type == media_type
    assert images.media_type_for_key(f"x/abc.{detected.extension}") == media_type


def test_rejects_non_images_and_large_files() -> None:
    with pytest.raises(UnsupportedMediaTypeError):
        images.validate_image(b"%PDF-1.7 not an image", max_bytes=1024)
    with pytest.raises(UnsupportedMediaTypeError):
        images.validate_image(b"GIF89a", max_bytes=1024)
    with pytest.raises(PayloadTooLargeError):
        images.validate_image(PNG + b"\x00" * 2048, max_bytes=1024)


def test_image_version_comes_from_key() -> None:
    assert images.image_version("patients/0123456789abcdef.png") == "0123456789ab"


def test_local_storage_round_trip(tmp_path: Path) -> None:
    storage = LocalFileStorage(tmp_path)
    key = storage.save(PNG, folder="patients", extension="png")
    assert key.startswith("patients/") and key.endswith(".png")
    assert storage.read(key) == PNG
    storage.delete(key)
    assert storage.read(key) is None
    storage.delete(key)


def test_local_storage_rejects_path_traversal(tmp_path: Path) -> None:
    storage = LocalFileStorage(tmp_path / "files")
    with pytest.raises(ValueError, match="escapes"):
        storage.read("../secret.txt")
