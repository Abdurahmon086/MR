@echo off
chcp 65001 >nul 2>&1
echo =====================================
echo  Database Sozlash
echo =====================================
cd /d "%~dp0backend"

if not exist "venv\Scripts\alembic.exe" (
    echo [XATO] Avval start-backend.bat ni ishga tushiring!
    pause
    exit /b 1
)

echo [1/3] Migratsiyalar ishga tushirilmoqda...
venv\Scripts\alembic upgrade head
if errorlevel 1 (
    echo.
    echo [XATO] Database ulanmadi!
    echo.
    echo Tekshiring:
    echo   1. PostgreSQL Windows Services da ishlamoqdami?
    echo   2. backend\.env dagi parol to'g'rimi?
    echo      DATABASE_URL=postgresql+asyncpg://postgres:PAROL@localhost:5432/dermatology_db
    echo.
    pause
    exit /b 1
)

echo [2/3] Test ma'lumotlar yuklanmoqda...
venv\Scripts\python seed.py

echo [3/3] Tayyor!
echo.
echo  Login ma'lumotlari:
echo    Admin:    admin@derm.uz    / Admin1234!
echo    Doktor1:  doctor1@derm.uz  / Doctor123!
echo    Doktor2:  doctor2@derm.uz  / Doctor123!
echo    Hamshira: nurse1@derm.uz   / Nurse123!
echo.
pause
