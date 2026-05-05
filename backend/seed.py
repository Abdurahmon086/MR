"""
Seed script — real o'zbek ismlari bilan test ma'lumotlar yaratadi.
Ishlatish: python seed.py
"""
import asyncio
import uuid
from datetime import date, datetime, timedelta
import random
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.database import Base
from app.models.user import User
from app.models.patient import Patient
from app.models.diagnosis import Diagnosis
from app.models.appointment import Appointment
from app.utils.security import hash_password

REGIONS = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg'ona", "Xorazm", "Qashqadaryo", "Surxondaryo", "Jizzax", "Sirdaryo", "Navoiy", "Qoraqalpog'iston"]

MALE_NAMES = ["Abdulloh", "Bobur", "Doniyor", "Eldor", "Farrux", "Husan", "Ibrohim", "Jasur", "Kamol", "Lochinbek", "Mansur", "Nodir", "Otabek", "Parviz", "Rustam", "Sardor", "Temur", "Ulugbek", "Vohid", "Zafar"]
FEMALE_NAMES = ["Adolat", "Barno", "Dilnoza", "Feruza", "Gulnora", "Hulkar", "Iroda", "Kamola", "Lobar", "Malika", "Nargiza", "Ozoda", "Parizod", "Rohila", "Sarvinoz", "Shahlo", "Umida", "Vasila", "Yulduz", "Zulfiya"]
LASTNAMES = ["Ahmedov", "Baxtiyorov", "Ergashev", "Hasanov", "Ismoilov", "Karimov", "Mirzayev", "Nazarov", "Ortiqov", "Qodirov", "Rahimov", "Sobirov", "Toshmatov", "Umarov", "Xolmatov", "Yusupov"]
MIDDLE_NAMES_M = ["Alisher o'g'li", "Bobur o'g'li", "Davron o'g'li", "Erkin o'g'li", "Farruх o'g'li"]
MIDDLE_NAMES_F = ["Alisher qizi", "Bobur qizi", "Davron qizi", "Erkin qizi", "Farruх qizi"]

DIAGNOSES_DATA = [
    ("Atopik dermatit", "L20", "Atopic dermatitis", "mild", "Antihistamin dorilar va namlash kremlar"),
    ("Psorіaz", "L40", "Psoriasis vulgaris", "moderate", "Kortikosteroid kremlar, UVB terapiya"),
    ("Ekzema", "L30.0", "Nummular eczema", "mild", "Steroid kremlar, quruq teri emolentlari"),
    ("Urtikáriya", "L50", "Urticaria", "mild", "Antihistamin preparatlar"),
    ("Melanositar nevus", "D22", "Melanocytic nevus", "mild", "Kuzatish, agar o'zgarsa — olib tashlash"),
    ("Akné vulgaris", "L70.0", "Acne vulgaris", "mild", "Benzoil peroksid, antibiotiklar"),
    ("Qo'ziqorin kasalligi", "B35", "Tinea pedis", "mild", "Antifungal kremlar"),
    ("Seborey dermatiti", "L21", "Seborrheic dermatitis", "mild", "Ketokonazol shampuni"),
]


async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        # Check if already seeded
        existing = await db.execute(select(User).where(User.email == "admin@derm.uz"))
        if existing.scalar_one_or_none():
            print("Ma'lumotlar allaqachon mavjud. Seed o'tkazib yuborildi.")
            return

        # --- Users ---
        admin = User(
            email="admin@derm.uz",
            password_hash=hash_password("Admin1234!"),
            role="admin",
            first_name="Admin",
            last_name="Tizim",
            is_active=True,
        )
        doctor1 = User(
            email="doctor1@derm.uz",
            password_hash=hash_password("Doctor123!"),
            role="doctor",
            first_name="Murod",
            last_name="Xolmatov",
            middle_name="Ibrohim o'g'li",
            specialty="Dermatologiya",
            license_number="UZ-DERM-001",
            is_active=True,
        )
        doctor2 = User(
            email="doctor2@derm.uz",
            password_hash=hash_password("Doctor123!"),
            role="doctor",
            first_name="Ra'no",
            last_name="Xurramova",
            middle_name="Ibragimovna",
            specialty="Dermatologiya va venerologiya",
            license_number="UZ-DERM-002",
            is_active=True,
        )
        nurse1 = User(
            email="nurse1@derm.uz",
            password_hash=hash_password("Nurse123!"),
            role="nurse",
            first_name="Dilnoza",
            last_name="Rahimova",
            is_active=True,
        )
        db.add_all([admin, doctor1, doctor2, nurse1])
        await db.flush()

        print(f"Foydalanuvchilar yaratildi: admin, 2 doktor, 1 hamshira")

        # --- Patients (50 ta) ---
        patients = []
        year = date.today().year
        for i in range(1, 51):
            gender = random.choice(["male", "female"])
            first_name = random.choice(MALE_NAMES if gender == "male" else FEMALE_NAMES)
            last_name = random.choice(LASTNAMES) + ("" if gender == "male" else "a")
            middle_name = random.choice(MIDDLE_NAMES_M if gender == "male" else MIDDLE_NAMES_F)
            birth_year = random.randint(1955, 2005)
            birth_date = date(birth_year, random.randint(1, 12), random.randint(1, 28))

            patient = Patient(
                patient_code=f"PAT-{year}-{i:05d}",
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
                birth_date=birth_date,
                gender=gender,
                blood_type=random.choice(["A+", "A-", "B+", "B-", "AB+", "O+", "O-"]),
                phone=f"+998{random.randint(90, 99)}{random.randint(1000000, 9999999)}",
                region=random.choice(REGIONS),
                district=f"{random.choice(LASTNAMES)} tumani",
                assigned_doctor_id=random.choice([doctor1.id, doctor2.id]),
                created_by=admin.id,
                allergies=random.choice([None, ["Penitsillin"], ["Aspirin", "Ibuprofen"], []]),
                chronic_diseases=random.choice([None, ["Diabet"], ["Gipertenziya"], []]),
            )
            patients.append(patient)

        db.add_all(patients)
        await db.flush()
        print(f"50 ta bemor yaratildi")

        # --- Diagnoses ---
        diagnoses_created = []
        diag_count = 0
        for patient in patients[:30]:
            num_diags = random.randint(1, 3)
            for _ in range(num_diags):
                diag_count += 1
                d_data = random.choice(DIAGNOSES_DATA)
                days_ago = random.randint(1, 365)
                visit_date = date.today() - timedelta(days=days_ago)
                diag = Diagnosis(
                    diagnosis_code=f"DX-{year}-{diag_count:05d}",
                    patient_id=patient.id,
                    doctor_id=random.choice([doctor1.id, doctor2.id]),
                    visit_date=visit_date,
                    chief_complaint=f"Terida qichishish va qizarish",
                    anamnesis=f"Bemor {random.randint(1, 12)} oydan beri shikoyat qilmoqda",
                    diagnosis_text=d_data[0],
                    icd10_code=d_data[1],
                    icd10_name=d_data[2],
                    severity=d_data[3],
                    treatment_plan=d_data[4],
                    status=random.choice(["initial", "confirmed", "closed"]),
                    is_ai_assisted=random.choice([True, False]),
                )
                diagnoses_created.append(diag)

        db.add_all(diagnoses_created)
        await db.flush()
        print(f"{len(diagnoses_created)} ta tashxis yaratildi")

        # --- Appointments (bugungi) ---
        appointments_list = []
        for i, patient in enumerate(patients[:8]):
            hour = 9 + i
            appt = Appointment(
                patient_id=patient.id,
                doctor_id=doctor1.id if i % 2 == 0 else doctor2.id,
                scheduled_at=datetime.combine(date.today(), datetime.min.time()).replace(hour=hour, minute=0),
                duration_mins=30,
                type=random.choice(["initial", "follow_up"]),
                status=random.choice(["scheduled", "confirmed"]),
                created_by=admin.id,
            )
            appointments_list.append(appt)

        db.add_all(appointments_list)
        await db.commit()
        print(f"{len(appointments_list)} ta bugungi qabul yaratildi")

    await engine.dispose()
    print("\n[OK] Seed muvaffaqiyatli yakunlandi!")
    print("=" * 40)
    print("Login ma'lumotlari:")
    print("  Admin:    admin@derm.uz    / Admin1234!")
    print("  Doktor1:  doctor1@derm.uz  / Doctor123!")
    print("  Doktor2:  doctor2@derm.uz  / Doctor123!")
    print("  Hamshira: nurse1@derm.uz   / Nurse123!")
    print("=" * 40)


if __name__ == "__main__":
    asyncio.run(seed())
