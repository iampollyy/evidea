from dataclasses import dataclass
from pathlib import PurePosixPath

from evidea.core.errors import PayloadTooLargeError, UnsupportedMediaTypeError


@dataclass(frozen=True)
class ImageType:
    media_type: str
    extension: str


PNG = ImageType("image/png", "png")
JPEG = ImageType("image/jpeg", "jpg")
WEBP = ImageType("image/webp", "webp")

_BY_EXTENSION = {t.extension: t for t in (PNG, JPEG, WEBP)}


def detect_image_type(data: bytes) -> ImageType | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return PNG
    if data.startswith(b"\xff\xd8\xff"):
        return JPEG
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return WEBP
    return None


def validate_image(data: bytes, *, max_bytes: int) -> ImageType:
    if len(data) > max_bytes:
        raise PayloadTooLargeError(f"The file must be at most {max_bytes // (1024 * 1024)} MB.")
    image_type = detect_image_type(data)
    if image_type is None:
        raise UnsupportedMediaTypeError("Upload a PNG, JPEG or WebP image.")
    return image_type


def media_type_for_key(key: str) -> str:
    return _BY_EXTENSION[PurePosixPath(key).suffix.lstrip(".")].media_type


def image_version(key: str) -> str:
    return PurePosixPath(key).stem[:12]
