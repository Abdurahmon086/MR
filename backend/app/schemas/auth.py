from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    first_name: str
    last_name: str
    middle_name: Optional[str]
    phone: Optional[str]
    specialty: Optional[str]
    preferred_lang: str
    avatar_url: Optional[str]
    full_name: str

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    preferred_lang: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    license_number: Optional[str] = None
