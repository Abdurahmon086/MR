import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.diagnosis import Diagnosis
from app.models.skin_image import SkinImage
from app.models.user import User
from app.schemas.diagnosis import DiagnosisCreate, DiagnosisUpdate, DiagnosisResponse, DiagnosisListResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/diagnoses", tags=["Diagnoses"])


async def generate_diagnosis_code(db: AsyncSession) -> str:
    year = date.today().year
    result = await db.execute(
        select(func.count(Diagnosis.id)).where(
            Diagnosis.diagnosis_code.like(f"DX-{year}-%")
        )
    )
    count = result.scalar() or 0
    return f"DX-{year}-{count + 1:05d}"


@router.get("", response_model=DiagnosisListResponse)
async def list_diagnoses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    patient_id: uuid.UUID | None = Query(None),
    doctor_id: uuid.UUID | None = Query(None),
    severity: str = Query(""),
    status: str = Query(""),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = select(Diagnosis).where(Diagnosis.is_active == True)

    if patient_id:
        query = query.where(Diagnosis.patient_id == patient_id)
    if doctor_id:
        query = query.where(Diagnosis.doctor_id == doctor_id)
    if severity:
        query = query.where(Diagnosis.severity == severity)
    if status:
        query = query.where(Diagnosis.status == status)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    query = query.order_by(Diagnosis.visit_date.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)

    return DiagnosisListResponse(items=result.scalars().all(), total=total, page=page, limit=limit)


@router.post("", response_model=DiagnosisResponse, status_code=201)
async def create_diagnosis(
    data: DiagnosisCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    code = await generate_diagnosis_code(db)
    diagnosis = Diagnosis(**data.model_dump(), diagnosis_code=code, doctor_id=current_user.id)
    db.add(diagnosis)
    await db.commit()
    await db.refresh(diagnosis)
    return diagnosis


@router.get("/{diagnosis_id}", response_model=DiagnosisResponse)
async def get_diagnosis(
    diagnosis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(Diagnosis)
        .options(selectinload(Diagnosis.skin_images).selectinload(SkinImage.ai_results))
        .where(Diagnosis.id == diagnosis_id, Diagnosis.is_active == True)
    )
    diagnosis = result.scalar_one_or_none()
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Tashxis topilmadi")

    # Map skin_images → images field expected by DiagnosisResponse schema
    from app.schemas.diagnosis import DiagnosisResponse
    data = {c.name: getattr(diagnosis, c.name) for c in diagnosis.__table__.columns}
    data["images"] = diagnosis.skin_images
    return DiagnosisResponse.model_validate(data)


@router.patch("/{diagnosis_id}", response_model=DiagnosisResponse)
async def update_diagnosis(
    diagnosis_id: uuid.UUID,
    data: DiagnosisUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Diagnosis).where(Diagnosis.id == diagnosis_id, Diagnosis.is_active == True))
    diagnosis = result.scalar_one_or_none()
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Topilmadi")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(diagnosis, field, value)
    await db.commit()
    await db.refresh(diagnosis)
    return diagnosis


@router.delete("/{diagnosis_id}", status_code=204)
async def delete_diagnosis(
    diagnosis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Diagnosis).where(Diagnosis.id == diagnosis_id))
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Topilmadi")
    d.is_active = False
    await db.commit()
