# Dermatologik Tashxis Axborot Tizimi

**Mavzu:** Dermatologik tashxis jarayonlari uchun ma'lumotlarni saqlash va qayta ishlash axborot tizimini ishlab chiqish

---

## Texnologiyalar

| Qism | Texnologiya |
|------|-------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| UI | Ant Design 5 + Tailwind CSS |
| Backend | FastAPI (Python) |
| AI | PyTorch + EfficientNet-B4 (HAM10000) |
| DB | PostgreSQL 16 |
| PDF | ReportLab |
| Auth | JWT |

---

## Ishga Tushirish

### 1. Talablar
- Python 3.10+ (`python --version`)
- Node.js 18+ (`node --version`)
- PostgreSQL 16 (Windows xizmati sifatida)

### 2. Ma'lumotlar bazasini yaratish
PostgreSQL da `dermatology_db` bazasi mavjud bo'lishi kerak:
```sql
CREATE DATABASE dermatology_db;
```

### 3. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000
```
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```
- Sayt: http://localhost:3000

### Yoki tayyor skriptlar
- `setup-database.bat` — DB migratsiya + seed
- `start-backend.bat` — Backend
- `start-frontend.bat` — Frontend

---

## Login Ma'lumotlari

| Rol | Email | Parol |
|-----|-------|-------|
| Admin | admin@derm.uz | Admin1234! |
| Shifokor 1 | doctor1@derm.uz | Doctor123! |
| Shifokor 2 | doctor2@derm.uz | Doctor123! |
| Hamshira | nurse1@derm.uz | Nurse123! |

---

## Funksiyalar

- **Bemor boshqaruvi** — 50 ta real o'zbek ismlari bilan test bemorlar
- **Tashxis moduli** — ICD-10 kodlar, og'irlik darajasi, davolash rejasi
- **AI Tahlil** — HAM10000 dataseti, 7 sinf (Melanoma, BCC, Aktinik keratoz va b.)
- **PDF Hisobotlar** — Bemor xulosasi PDF formatda
- **Dashboard** — Statistika grafiklar, bugungi qabullar
- **Ko'p tilli** — O'zbek / Rus / Ingliz
- **Rol asosida kirish** — Admin, Shifokor, Hamshira

---

## AI Model — HAM10000 (7 sinf)

| Kod | Nomi | Xavf |
|-----|------|------|
| mel | Melanoma | KRITIK |
| bcc | Bazal hujayra karsinomasi | YUQORI |
| akiec | Aktinik keratoz | YUQORI |
| vasc | Qon-tomir shikastlanishi | O'RTACHA |
| bkl | Xavfsiz keratoz | PAST |
| df | Dermatofibroma | PAST |
| nv | Melanositar nevus (xollar) | PAST |

> Model fayli (`ai_models/efficientnet_ham10000.pth`) mavjud bo'lmasa,
> tizim avtomatik **demo rejim**da ishlaydi.

---

## Loyha Tuzilmasi

```
MR/
├── backend/          FastAPI backend
│   ├── app/
│   │   ├── models/   8 ta DB model
│   │   ├── routers/  9 ta API router
│   │   ├── ai/       HAM10000 AI moduli
│   │   └── services/ PDF generatsiya
│   ├── alembic/      DB migratsiyalar
│   └── seed.py       Test ma'lumotlar
├── frontend/         Next.js 14 frontend
│   └── src/app/      Sahifalar (App Router)
├── docs/             Diplom ishi hujjatlari
└── README.md
```
