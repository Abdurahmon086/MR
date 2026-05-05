from app.models.user import User
from app.models.patient import Patient
from app.models.diagnosis import Diagnosis
from app.models.skin_image import SkinImage
from app.models.ai_result import AIResult
from app.models.appointment import Appointment
from app.models.audit_log import AuditLog
from app.models.report import Report

__all__ = [
    "User", "Patient", "Diagnosis", "SkinImage",
    "AIResult", "Appointment", "AuditLog", "Report"
]
