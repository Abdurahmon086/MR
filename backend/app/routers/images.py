import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.skin_image import SkinImage
from app.models.user import User
from app.utils.file_handler import save_upload, delete_file
from app.dependencies import get_current_user
from app.config import settings
import os

router = APIRouter(prefix="/images", tags=["Images"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/bmp", "image/tiff", "image/webp"}


@router.post("/upload", status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    patient_id: uuid.UUID = Form(...),
    diagnosis_id: uuid.UUID | None = Form(None),
    body_location: str = Form(""),
    notes: str = Form(""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Faqat JPEG, PNG, BMP, TIFF formatlar qabul qilinadi")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"Fayl hajmi {settings.MAX_UPLOAD_SIZE_MB}MB dan oshmasligi kerak")

    saved = save_upload(content, str(patient_id), file.filename or "image.jpg")

    image = SkinImage(
        patient_id=patient_id,
        diagnosis_id=diagnosis_id if diagnosis_id else None,
        uploaded_by=current_user.id,
        file_name=saved["file_name"],
        file_path=saved["file_path"],
        thumbnail_path=saved["thumbnail_path"],
        file_size=saved["file_size"],
        mime_type=file.content_type,
        width=saved["width"],
        height=saved["height"],
        body_location=body_location or None,
        notes=notes or None,
        hash_sha256=saved["hash_sha256"],
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)

    return {
        "id": str(image.id),
        "file_name": image.file_name,
        "file_path": image.file_path,
        "thumbnail_path": image.thumbnail_path,
        "width": image.width,
        "height": image.height,
        "created_at": image.created_at,
    }


@router.get("/{image_id}")
async def get_image_meta(
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(SkinImage).where(SkinImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Rasm topilmadi")
    return image


@router.get("/{image_id}/download")
async def download_image(
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(SkinImage).where(SkinImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image or not os.path.exists(image.file_path):
        raise HTTPException(status_code=404, detail="Fayl topilmadi")
    return FileResponse(image.file_path, media_type=image.mime_type or "image/jpeg")


@router.delete("/{image_id}", status_code=204)
async def delete_image(
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(SkinImage).where(SkinImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Topilmadi")
    delete_file(image.file_path)
    if image.thumbnail_path:
        delete_file(image.thumbnail_path)
    await db.delete(image)
    await db.commit()
