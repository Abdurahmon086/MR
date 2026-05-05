import uuid
from datetime import date, datetime
from sqlalchemy import String, Date, DateTime, Text, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    diagnosis_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    visit_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    chief_complaint: Mapped[str] = mapped_column(Text, nullable=False)
    anamnesis: Mapped[str | None] = mapped_column(Text)
    objective_data: Mapped[str | None] = mapped_column(Text)
    icd10_code: Mapped[str | None] = mapped_column(String(10))
    icd10_name: Mapped[str | None] = mapped_column(String(200))
    diagnosis_text: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str | None] = mapped_column(SAEnum("mild", "moderate", "severe", "critical", name="severity_enum"))
    status: Mapped[str] = mapped_column(
        SAEnum("initial", "confirmed", "revised", "closed", name="diagnosis_status_enum"),
        default="initial"
    )
    treatment_plan: Mapped[str | None] = mapped_column(Text)
    prescriptions: Mapped[dict | None] = mapped_column(JSONB)
    follow_up_date: Mapped[date | None] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text)
    is_ai_assisted: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="diagnoses")
    doctor: Mapped["User"] = relationship("User", back_populates="diagnoses")
    skin_images: Mapped[list["SkinImage"]] = relationship("SkinImage", back_populates="diagnosis")
