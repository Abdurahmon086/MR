import uuid
from datetime import date, datetime
from sqlalchemy import String, Date, DateTime, Text, ForeignKey, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class SkinImage(Base):
    __tablename__ = "skin_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    diagnosis_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("diagnoses.id"))
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False, index=True)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_path: Mapped[str | None] = mapped_column(String(500))
    file_size: Mapped[int | None] = mapped_column(Integer)
    mime_type: Mapped[str | None] = mapped_column(String(50))
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)
    body_location: Mapped[str | None] = mapped_column(String(100))
    capture_date: Mapped[date | None] = mapped_column(Date)
    hash_sha256: Mapped[str | None] = mapped_column(String(64), index=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text)
    metadata_: Mapped[dict | None] = mapped_column(JSONB, name="metadata")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    diagnosis: Mapped["Diagnosis"] = relationship("Diagnosis", back_populates="skin_images")
    patient: Mapped["Patient"] = relationship("Patient", back_populates="skin_images")
    ai_results: Mapped[list["AIResult"]] = relationship("AIResult", back_populates="image", cascade="all, delete-orphan")
