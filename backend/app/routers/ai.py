import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.skin_image import SkinImage
from app.models.ai_result import AIResult
from app.models.user import User
from app.dependencies import get_current_user
from app.ai.ham10000_labels import HAM10000_CLASSES
from datetime import datetime

router = APIRouter(prefix="/ai", tags=["AI"])

_predictor = None


def get_predictor():
    global _predictor
    return _predictor


def set_predictor(p):
    global _predictor
    _predictor = p


async def _run_analysis(image_id: uuid.UUID, db_url: str):
    """Background task: run AI inference and save result."""
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession as AS
    from app.config import settings

    engine = create_async_engine(db_url)
    Session = async_sessionmaker(engine, class_=AS, expire_on_commit=False)

    async with Session() as db:
        result = await db.execute(select(SkinImage).where(SkinImage.id == image_id))
        image = result.scalar_one_or_none()
        if not image:
            return

        predictor = get_predictor()
        if not predictor:
            return

        try:
            prediction = predictor.predict(image.file_path)
        except Exception as e:
            return

        ai_result = AIResult(
            image_id=image.id,
            model_version=prediction["model_version"],
            predicted_class=prediction["predicted_class"],
            predicted_label=prediction["predicted_label"],
            confidence=prediction["confidence"],
            all_probabilities=prediction["all_probabilities"],
            risk_level=prediction["risk_level"],
            processing_time_ms=prediction["processing_time_ms"],
        )
        db.add(ai_result)
        await db.commit()

    await engine.dispose()


@router.post("/analyze")
async def analyze_image(
    image_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(SkinImage).where(SkinImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise HTTPException(status_code=404, detail="Rasm topilmadi")

    predictor = get_predictor()
    if not predictor:
        raise HTTPException(status_code=503, detail="AI model yuklanmagan")

    # Synchronous for speed (< 500ms on CPU)
    try:
        prediction = predictor.predict(image.file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI tahlil xatosi: {str(e)}")

    ai_result = AIResult(
        image_id=image.id,
        model_version=prediction["model_version"],
        predicted_class=prediction["predicted_class"],
        predicted_label=prediction["predicted_label"],
        confidence=prediction["confidence"],
        all_probabilities=prediction["all_probabilities"],
        risk_level=prediction["risk_level"],
        processing_time_ms=prediction["processing_time_ms"],
    )
    db.add(ai_result)
    await db.commit()
    await db.refresh(ai_result)

    return {
        "result_id": str(ai_result.id),
        "predicted_class": prediction["predicted_class"],
        "predicted_label": prediction["predicted_label"],
        "confidence": prediction["confidence"],
        "all_probabilities": prediction["all_probabilities"],
        "risk_level": prediction["risk_level"],
        "description_uz": prediction["description_uz"],
        "icd10": prediction["icd10"],
        "processing_time_ms": prediction["processing_time_ms"],
    }


@router.get("/results/{result_id}")
async def get_result(
    result_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(AIResult).where(AIResult.id == result_id))
    ai = result.scalar_one_or_none()
    if not ai:
        raise HTTPException(status_code=404, detail="Natija topilmadi")
    return ai


@router.patch("/results/{result_id}/review")
async def review_result(
    result_id: uuid.UUID,
    doctor_agreement: bool,
    doctor_notes: str = "",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(AIResult).where(AIResult.id == result_id))
    ai = result.scalar_one_or_none()
    if not ai:
        raise HTTPException(status_code=404, detail="Topilmadi")

    ai.is_reviewed = True
    ai.doctor_agreement = doctor_agreement
    ai.doctor_notes = doctor_notes
    ai.reviewed_by = current_user.id
    ai.reviewed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(ai)
    return ai


@router.get("/patient/{patient_id}/results")
async def get_patient_ai_results(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(AIResult, SkinImage)
        .join(SkinImage, AIResult.image_id == SkinImage.id)
        .where(SkinImage.patient_id == patient_id)
        .order_by(AIResult.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "id": str(ai.id),
            "image_id": str(ai.image_id),
            "predicted_class": ai.predicted_class,
            "predicted_label": ai.predicted_label,
            "confidence": ai.confidence,
            "risk_level": ai.risk_level,
            "all_probabilities": ai.all_probabilities,
            "is_reviewed": ai.is_reviewed,
            "doctor_agreement": ai.doctor_agreement,
            "doctor_notes": ai.doctor_notes,
            "model_version": ai.model_version,
            "processing_time_ms": ai.processing_time_ms,
            "created_at": ai.created_at.isoformat() if ai.created_at else None,
            "reviewed_at": ai.reviewed_at.isoformat() if ai.reviewed_at else None,
            "image_path": img.file_path,
            "thumbnail_path": img.thumbnail_path,
        }
        for ai, img in rows
    ]


@router.get("/statistics")
async def ai_statistics(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    total = await db.execute(select(func.count(AIResult.id)))
    reviewed = await db.execute(select(func.count(AIResult.id)).where(AIResult.is_reviewed == True))
    agreed = await db.execute(select(func.count(AIResult.id)).where(AIResult.doctor_agreement == True))

    class_dist = {}
    for cls in HAM10000_CLASSES:
        cnt = await db.execute(select(func.count(AIResult.id)).where(AIResult.predicted_class == cls))
        class_dist[cls] = cnt.scalar()

    return {
        "total_analyses": total.scalar(),
        "reviewed": reviewed.scalar(),
        "doctor_agreed": agreed.scalar(),
        "class_distribution": class_dist,
    }


@router.get("/model-info")
async def model_info(_=Depends(get_current_user)):
    predictor = get_predictor()
    is_loaded = predictor is not None and getattr(predictor, "loaded", False)
    return {
        "model_name": "BiT-ResNet50 + Dermoscopic Analysis",
        "dataset": "HAM10000 (10,015 dermoscopic images, 7 classes)",
        "classes": list(HAM10000_CLASSES.keys()),
        "loaded": is_loaded,
        "mode": "real" if is_loaded else "demo",
        "device": "cpu",
    }
