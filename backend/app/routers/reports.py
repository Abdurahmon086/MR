import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.database import get_db
from app.models.report import Report
from app.models.user import User
from app.dependencies import get_current_user
from app.services.report_service import generate_patient_pdf

router = APIRouter(prefix="/reports", tags=["Reports"])


class ReportRequest(BaseModel):
    report_type: str
    title: str
    patient_id: Optional[uuid.UUID] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None


@router.post("/generate", status_code=201)
async def request_report(
    data: ReportRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = Report(
        report_type=data.report_type,
        title=data.title,
        generated_by=current_user.id,
        patient_id=data.patient_id,
        date_from=data.date_from,
        date_to=data.date_to,
        status="generating",
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    background_tasks.add_task(_generate_report_task, str(report.id), data.patient_id)
    return {"report_id": str(report.id), "status": "generating"}


async def _generate_report_task(report_id: str, patient_id: Optional[uuid.UUID]):
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession as AS
    from app.config import settings

    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, class_=AS, expire_on_commit=False)

    async with Session() as db:
        r = await db.execute(select(Report).where(Report.id == uuid.UUID(report_id)))
        report = r.scalar_one_or_none()
        if not report:
            return
        try:
            path = await generate_patient_pdf(db, patient_id, report_id)
            report.file_path = path
            report.status = "ready"
        except Exception as e:
            report.status = "failed"
        await db.commit()

    await engine.dispose()


@router.get("")
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Report)
        .where(Report.generated_by == current_user.id)
        .order_by(Report.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{report_id}")
async def get_report(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Hisobot topilmadi")
    return report


@router.get("/{report_id}/download")
async def download_report(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report or not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Fayl tayyor emas")
    return FileResponse(report.file_path, media_type="application/pdf", filename=f"report_{report_id}.pdf")
