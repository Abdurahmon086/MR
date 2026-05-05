import uuid
from datetime import date, datetime
from sqlalchemy import String, Date, DateTime, Text, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    middle_name: Mapped[str | None] = mapped_column(String(100))
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(SAEnum("male", "female", "other", name="gender_enum"), nullable=False)
    blood_type: Mapped[str | None] = mapped_column(SAEnum("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", name="blood_type_enum"))
    phone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(Text)
    region: Mapped[str | None] = mapped_column(String(100))
    district: Mapped[str | None] = mapped_column(String(100))
    passport_number: Mapped[str | None] = mapped_column(String(20))
    inn: Mapped[str | None] = mapped_column(String(14))
    allergies: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    chronic_diseases: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    notes: Mapped[str | None] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    assigned_doctor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    assigned_doctor: Mapped["User"] = relationship("User", back_populates="patients", foreign_keys=[assigned_doctor_id])
    diagnoses: Mapped[list["Diagnosis"]] = relationship("Diagnosis", back_populates="patient", cascade="all, delete-orphan")
    skin_images: Mapped[list["SkinImage"]] = relationship("SkinImage", back_populates="patient", cascade="all, delete-orphan")
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        parts = [self.last_name, self.first_name]
        if self.middle_name:
            parts.append(self.middle_name)
        return " ".join(parts)

    @property
    def age(self) -> int:
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )
