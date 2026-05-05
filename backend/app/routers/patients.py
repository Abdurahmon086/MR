import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.database import get_db
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientListResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])


async def generate_patient_code(db: AsyncSession) -> str:
    year = date.today().year
    result = await db.execute(
        select(func.count(Patient.id)).where(
            Patient.patient_code.like(f"PAT-{year}-%")
        )
    )
    count = result.scalar() or 0
    return f"PAT-{year}-{count + 1:05d}"


@router.get("", response_model=PatientListResponse)
async def list_patients(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(""),
    gender: str = Query(""),
    region: str = Query(""),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    query = select(Patient).where(Patient.is_active == True)

    if search:
        term = f"%{search}%"
        query = query.where(
            or_(
                Patient.first_name.ilike(term),
                Patient.last_name.ilike(term),
                Patient.middle_name.ilike(term),
                Patient.patient_code.ilike(term),
                Patient.phone.ilike(term),
            )
        )
    if gender:
        query = query.where(Patient.gender == gender)
    if region:
        query = query.where(Patient.region == region)

    total_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = total_result.scalar()

    query = query.order_by(Patient.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    patients = result.scalars().all()

    return PatientListResponse(items=patients, total=total, page=page, limit=limit)


@router.post("", response_model=PatientResponse, status_code=201)
async def create_patient(
    data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    code = await generate_patient_code(db)
    patient = Patient(**data.model_dump(), patient_code=code, created_by=current_user.id)
    db.add(patient)
    await db.commit()
    await db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id, Patient.is_active == True))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Bemor topilmadi")
    return patient


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: uuid.UUID,
    data: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id, Patient.is_active == True))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Bemor topilmadi")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(patient, field, value)
    await db.commit()
    await db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Topilmadi")
    patient.is_active = False
    await db.commit()
