import os
import uuid
from io import BytesIO
from pathlib import Path
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.patient import Patient
from app.models.diagnosis import Diagnosis
from app.models.ai_result import AIResult
from app.models.skin_image import SkinImage


async def generate_patient_pdf(
    db: AsyncSession,
    patient_id: uuid.UUID | None,
    report_id: str,
) -> str:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    # Register fonts for Uzbek/Russian text support
    font_dir = Path(__file__).parent.parent.parent / "fonts"
    font_dir.mkdir(exist_ok=True)

    try:
        pdfmetrics.registerFont(TTFont("Roboto", str(font_dir / "Roboto-Regular.ttf")))
        pdfmetrics.registerFont(TTFont("Roboto-Bold", str(font_dir / "Roboto-Bold.ttf")))
        font_name = "Roboto"
        font_bold = "Roboto-Bold"
    except Exception:
        font_name = "Helvetica"
        font_bold = "Helvetica-Bold"

    reports_dir = Path("uploads") / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    output_path = str(reports_dir / f"{report_id}.pdf")

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", fontName=font_bold, fontSize=14, spaceAfter=6, alignment=1)
    h2_style = ParagraphStyle("H2", fontName=font_bold, fontSize=11, spaceAfter=4, textColor=colors.HexColor("#1890FF"))
    normal_style = ParagraphStyle("Normal", fontName=font_name, fontSize=9, spaceAfter=3)

    story = []
    story.append(Paragraph("Dermatologik Tashxis Axborot Tizimi", title_style))
    story.append(Paragraph("BEMOR XULOSASI", title_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#1890FF")))
    story.append(Spacer(1, 6 * mm))

    if patient_id:
        p_result = await db.execute(select(Patient).where(Patient.id == patient_id))
        patient = p_result.scalar_one_or_none()

        if patient:
            story.append(Paragraph("BEMOR MA'LUMOTLARI", h2_style))
            data = [
                ["F.I.O.:", patient.full_name],
                ["Bemor kodi:", patient.patient_code],
                ["Tug'ilgan sana:", str(patient.birth_date)],
                ["Yoshi:", f"{patient.age} yosh"],
                ["Jinsi:", "Erkak" if patient.gender == "male" else "Ayol"],
                ["Telefon:", patient.phone or "—"],
                ["Viloyat:", patient.region or "—"],
                ["Qon guruhi:", patient.blood_type or "—"],
            ]
            table = Table(data, colWidths=[50 * mm, 120 * mm])
            table.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (-1, -1), font_name),
                ("FONTNAME", (0, 0), (0, -1), font_bold),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E6F7FF")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D9D9D9")),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
            ]))
            story.append(table)
            story.append(Spacer(1, 6 * mm))

        # Diagnoses
        d_result = await db.execute(
            select(Diagnosis)
            .where(Diagnosis.patient_id == patient_id, Diagnosis.is_active == True)
            .order_by(Diagnosis.visit_date.desc())
        )
        diagnoses = d_result.scalars().all()

        if diagnoses:
            story.append(Paragraph("TASHXISLAR TARIXI", h2_style))
            for diag in diagnoses:
                story.append(Paragraph(f"<b>{diag.diagnosis_code}</b> — {diag.visit_date}", normal_style))
                story.append(Paragraph(f"Shikoyat: {diag.chief_complaint}", normal_style))
                story.append(Paragraph(f"Tashxis: {diag.diagnosis_text}", normal_style))
                if diag.icd10_code:
                    story.append(Paragraph(f"ICD-10: {diag.icd10_code} — {diag.icd10_name or ''}", normal_style))
                if diag.treatment_plan:
                    story.append(Paragraph(f"Davolash: {diag.treatment_plan}", normal_style))
                story.append(Spacer(1, 3 * mm))

    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph(f"Hisobot sanasi: {date.today()}", normal_style))
    story.append(Paragraph("Dermatologik Tashxis Axborot Tizimi", normal_style))

    doc.build(story)
    pdf_bytes = buffer.getvalue()

    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    return output_path
