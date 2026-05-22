import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.user import User
from app.schemas.auth import UserResponse, UserCreate
from app.utils.security import hash_password
from app.dependencies import require_admin, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/doctors", response_model=list[UserResponse])
async def list_doctors(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(User).where(User.role == "doctor", User.is_active == True).order_by(User.last_name)
    )
    return result.scalars().all()


@router.get("", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan")

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        first_name=data.first_name,
        last_name=data.last_name,
        middle_name=data.middle_name,
        phone=data.phone,
        specialty=data.specialty,
        license_number=data.license_number,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    return user


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Topilmadi")
    await db.delete(user)
    await db.commit()
