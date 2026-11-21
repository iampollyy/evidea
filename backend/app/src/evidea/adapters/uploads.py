from fastapi import UploadFile


def read_upload(file: UploadFile, *, max_bytes: int) -> bytes:
    return file.file.read(max_bytes + 1)
