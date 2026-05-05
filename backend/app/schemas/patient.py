from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
import uuid


class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    birth_date: date
    gender: str
    blood_type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    region: Optional[str] = None
    district: Optional[str] = None
    passport_number: Optional[str] = None
    inn: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronic_diseases: Optional[List[str]] = None
    notes: Optional[str] = None
    assigned_doctor_id: Optional[uuid.UUID] = None


class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    blood_type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    region: Optional[str] = None
    district: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronic_diseases: Optional[List[str]] = None
    notes: Optional[str] = None
    assigned_doctor_id: Optional[uuid.UUID] = None


class PatientResponse(BaseModel):
    id: uuid.UUID
    patient_code: str
    first_name: str
    last_name: str
    middle_name: Optional[str]
    birth_date: date
    gender: str
    blood_type: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    region: Optional[str]
    district: Optional[str]
    allergies: Optional[List[str]]
    chronic_diseases: Optional[List[str]]
    notes: Optional[str]
    photo_url: Optional[str]
    assigned_doctor_id: Optional[uuid.UUID]
    created_at: datetime
    full_name: str
    age: int

    model_config = {"from_attributes": True}


class PatientListResponse(BaseModel):
    items: List[PatientResponse]
    total: int
    page: int
    limit: int
