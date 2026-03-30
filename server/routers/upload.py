import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from config import settings

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = {
    "text/csv",
    "text/tab-separated-values",
    "application/vnd.ms-excel",
    "application/octet-stream",
}
ALLOWED_EXTENSIONS = {".csv", ".tsv"}

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("")
async def upload_file(file: UploadFile):
    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Use: {', '.join(ALLOWED_EXTENSIONS)}")

    contents = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_upload_size_mb}MB limit")

    file_id = uuid.uuid4().hex
    saved_name = f"{file_id}{extension}"
    dest = UPLOADS_DIR / saved_name
    dest.write_bytes(contents)

    return {
        "file_id": file_id,
        "filename": file.filename,
        "saved_as": saved_name,
        "size_bytes": len(contents),
    }
