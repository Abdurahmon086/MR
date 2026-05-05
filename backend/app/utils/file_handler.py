import hashlib
import os
import uuid
from datetime import date
from pathlib import Path
from PIL import Image
from app.config import settings


def get_upload_path(patient_id: str) -> Path:
    today = date.today().strftime("%Y-%m")
    path = Path(settings.UPLOAD_DIR) / str(patient_id) / today
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_thumbnail_path(original_path: str) -> str:
    p = Path(original_path)
    return str(p.parent / "thumbs" / p.name)


def save_upload(file_bytes: bytes, patient_id: str, original_filename: str) -> dict:
    ext = Path(original_filename).suffix.lower() or ".jpg"
    unique_name = f"{uuid.uuid4()}{ext}"
    upload_dir = get_upload_path(patient_id)
    file_path = upload_dir / unique_name

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    sha256 = hashlib.sha256(file_bytes).hexdigest()

    thumb_dir = upload_dir / "thumbs"
    thumb_dir.mkdir(exist_ok=True)
    thumb_path = thumb_dir / unique_name

    try:
        with Image.open(file_path) as img:
            width, height = img.size
            img.thumbnail((300, 300))
            img.save(thumb_path, quality=85)
    except Exception:
        width, height = None, None
        thumb_path = None

    return {
        "file_name": unique_name,
        "file_path": str(file_path).replace("\\", "/"),
        "thumbnail_path": str(thumb_path).replace("\\", "/") if thumb_path else None,
        "file_size": len(file_bytes),
        "hash_sha256": sha256,
        "width": width,
        "height": height,
    }


def delete_file(file_path: str) -> None:
    try:
        os.remove(file_path)
    except OSError:
        pass
