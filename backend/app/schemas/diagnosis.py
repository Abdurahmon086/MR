from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime
import uuid


class AIResultSchema(BaseModel):
    id: uuid.UUID
    image_id: uuid.UUID
    model_version: str
    predicted_class: str
    predicted_label: str
    confidence: float
    all_probabilities: Optional[Any]
    risk_level: Optional[str]
    processing_time_ms: Optional[int]
    is_reviewed: bool
    doctor_agreement: Optional[bool]
    doctor_notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SkinImageSchema(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    diagnosis_id: Optional[uuid.UUID]
    file_name: str
    file_path: str
    thumbnail_path: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    width: Optional[int]
    height: Optional[int]
    body_location: Optional[str]
    created_at: datetime
    ai_results: List[AIResultSchema] = []

    model_config = {"from_attributes": True}


class DiagnosisCreate(BaseModel):
    patient_id: uuid.UUID
    visit_date: date
    chief_complaint: str
    anamnesis: Optional[str] = None
    objective_data: Optional[str] = None
    icd10_code: Optional[str] = None
    icd10_name: Optional[str] = None
    diagnosis_text: str
    severity: Optional[str] = None
    treatment_plan: Optional[str] = None
    prescriptions: Optional[Any] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None
    is_ai_assisted: bool = False


class DiagnosisUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    anamnesis: Optional[str] = None
    objective_data: Optional[str] = None
    icd10_code: Optional[str] = None
    icd10_name: Optional[str] = None
    diagnosis_text: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    treatment_plan: Optional[str] = None
    prescriptions: Optional[Any] = None
    follow_up_date: Optional[date] = None
    notes: Optional[str] = None


class DiagnosisResponse(BaseModel):
    id: uuid.UUID
    diagnosis_code: str
    patient_id: uuid.UUID
    doctor_id: uuid.UUID
    visit_date: date
    chief_complaint: str
    anamnesis: Optional[str]
    objective_data: Optional[str]
    icd10_code: Optional[str]
    icd10_name: Optional[str]
    diagnosis_text: str
    severity: Optional[str]
    status: str
    treatment_plan: Optional[str]
    prescriptions: Optional[Any]
    follow_up_date: Optional[date]
    notes: Optional[str]
    is_ai_assisted: bool
    created_at: datetime
    images: List[SkinImageSchema] = []

    model_config = {"from_attributes": True}


class DiagnosisListResponse(BaseModel):
    items: List[DiagnosisResponse]
    total: int
    page: int
    limit: int
