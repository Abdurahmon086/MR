import uuid
from datetime import date, datetime
from sqlalchemy import String, DateTime, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_type: Mapped[str] = mapped_column(
        SAEnum("patient_summary", "diagnosis_report", "statistics", "ai_audit", name="report_type_enum"),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    generated_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    patient_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("patients.id"))
    date_from: Mapped[date | None] = mapped_column(Date)
    date_to: Mapped[date | None] = mapped_column(Date)
    file_path: Mapped[str | None] = mapped_column(String(500))
    parameters: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "generating", "ready", "failed", name="report_status_enum"),
        default="pending"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
