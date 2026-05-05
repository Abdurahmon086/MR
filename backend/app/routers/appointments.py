import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.database import get_db
from app.models.appointment import Appointment
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])


class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    scheduled_at: datetime
    duration_mins: int = 30
    type: str = "initial"
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    duration_mins: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("")
async def list_appointments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    doctor_id: Optional[uuid.UUID] = Query(None),
    patient_id: Optional[uuid.UUID] = Query(None),
):
    query = select(Appointment).order_by(Appointment.scheduled_at.desc())
    if current_user.role == "doctor":
        query = query.where(Appointment.doctor_id == current_user.id)
    elif doctor_id:
        query = query.where(Appointment.doctor_id == doctor_id)
    if patient_id:
        query = query.where(Appointment.patient_id == patient_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("", status_code=201)
async def create_appointment(
    data: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = Appointment(**data.model_dump(), created_by=current_user.id)
    db.add(appt)
    await db.commit()
    await db.refresh(appt)
    return appt


@router.get("/{appt_id}")
async def get_appointment(
    appt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appt_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Qabul topilmadi")
    return appt


@router.patch("/{appt_id}")
async def update_appointment(
    appt_id: uuid.UUID,
    data: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Appointment).where(Appointment.id == appt_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Topilmadi")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(appt, field, value)
    await db.commit()
    await db.refresh(appt)
    return appt
