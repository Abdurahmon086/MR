@echo off
echo =====================================
echo  Dermatologik Tashxis - Backend
echo =====================================
cd /d "%~dp0backend"

if not exist "venv\Scripts\activate.bat" (
    echo [1/3] Virtual environment yaratilmoqda...
    python -m venv venv
    if errorlevel 1 (
        echo XATO: Python topilmadi! python.org dan yuklab oling.
        pause
        exit /b 1
    )
)

echo [2/3] Kutubxonalar o'rnatilmoqda...
venv\Scripts\pip install -q --upgrade pip
venv\Scripts\pip install -q -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

if not exist "uploads" mkdir uploads
if not exist "ai_models" mkdir ai_models

echo [3/3] Backend serveri ishga tushirilmoqda...
echo.
echo  API:     http://localhost:8000
echo  Swagger: http://localhost:8000/docs
echo.

:: Port 8000 band bo'lsa eski process o'ldiriladi
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING" 2^>nul') do (
    echo Eski process o'ldirilmoqda: %%a
    taskkill /F /PID %%a >nul 2>&1
)

venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
