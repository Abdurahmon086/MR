from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from datetime import date, datetime, timedelta
from app.database import get_db
from app.models.patient import Patient
from app.models.diagnosis import Diagnosis
from app.models.appointment import Appointment
from app.models.ai_result import AIResult
from app.models.audit_log import AuditLog
from app.models.user import User
from app.dependencies import get_current_user
from app.ai.ham10000_labels import HAM10000_CLASSES

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def dashboard_stats(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    today = date.today()

    total_patients = await db.execute(select(func.count(Patient.id)).where(Patient.is_active == True))
    total_diagnoses = await db.execute(select(func.count(Diagnosis.id)).where(Diagnosis.is_active == True))
    total_ai = await db.execute(select(func.count(AIResult.id)))
    today_appointments = await db.execute(
        select(func.count(Appointment.id)).where(
            func.date(Appointment.scheduled_at) == today,
            Appointment.status.in_(["scheduled", "confirmed"])
        )
    )
    new_patients_this_month = await db.execute(
        select(func.count(Patient.id)).where(
            extract("month", Patient.created_at) == today.month,
            extract("year", Patient.created_at) == today.year,
        )
    )

    return {
        "total_patients": total_patients.scalar(),
        "total_diagnoses": total_diagnoses.scalar(),
        "total_ai_analyses": total_ai.scalar(),
        "today_appointments": today_appointments.scalar(),
        "new_patients_this_month": new_patients_this_month.scalar(),
    }


@router.get("/charts/diagnoses-by-class")
async def diagnoses_by_class(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    data = []
    for cls, info in HAM10000_CLASSES.items():
        cnt = await db.execute(select(func.count(AIResult.id)).where(AIResult.predicted_class == cls))
        data.append({
            "class": cls,
            "label": info["name_uz"],
            "count": cnt.scalar(),
            "color": info["color"],
            "risk_level": info["risk_level"],
        })
    return data


@router.get("/charts/age-distribution")
async def age_distribution(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    today = date.today()
    brackets = [
        ("0-17", 0, 17),
        ("18-29", 18, 29),
        ("30-44", 30, 44),
        ("45-59", 45, 59),
        ("60-74", 60, 74),
        ("75+", 75, 150),
    ]
    result = []
    for label, min_age, max_age in brackets:
        min_birth = date(today.year - max_age - 1, today.month, today.day)
        max_birth = date(today.year - min_age, today.month, today.day)
        cnt = await db.execute(
            select(func.count(Patient.id)).where(
                Patient.birth_date >= min_birth,
                Patient.birth_date <= max_birth,
                Patient.is_active == True,
            )
        )
        result.append({"age_group": label, "count": cnt.scalar()})
    return result


@router.get("/charts/severity-trend")
async def severity_trend(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    last_6_months = []
    today = date.today()
    for i in range(5, -1, -1):
        month = (today.month - i - 1) % 12 + 1
        year = today.year - ((today.month - i - 1) // 12)
        counts = {}
        for sev in ["mild", "moderate", "severe", "critical"]:
            cnt = await db.execute(
                select(func.count(Diagnosis.id)).where(
                    Diagnosis.severity == sev,
                    extract("month", Diagnosis.created_at) == month,
                    extract("year", Diagnosis.created_at) == year,
                    Diagnosis.is_active == True,
                )
            )
            counts[sev] = cnt.scalar()
        last_6_months.append({"month": f"{year}-{month:02d}", **counts})
    return last_6_months


@router.get("/recent-activity")
async def recent_activity(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(20)
    )
    return result.scalars().all()


@router.get("/appointments/today")
async def today_appointments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    query = select(Appointment).where(
        func.date(Appointment.scheduled_at) == today,
    )
    if current_user.role == "doctor":
        query = query.where(Appointment.doctor_id == current_user.id)
    query = query.order_by(Appointment.scheduled_at)
    result = await db.execute(query)
    return result.scalars().all()
