import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Float, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class AIResult(Base):
    __tablename__ = "ai_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("skin_images.id"), nullable=False, index=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    predicted_class: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    predicted_label: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    all_probabilities: Mapped[dict] = mapped_column(JSONB, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    processing_time_ms: Mapped[int | None] = mapped_column(Integer)
    is_reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    doctor_agreement: Mapped[bool | None] = mapped_column(Boolean)
    doctor_notes: Mapped[str | None] = mapped_column(Text)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    image: Mapped["SkinImage"] = relationship("SkinImage", back_populates="ai_results")
    reviewer: Mapped["User | None"] = relationship("User", foreign_keys=[reviewed_by])
