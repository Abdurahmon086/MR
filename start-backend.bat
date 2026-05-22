@echo off
echo =====================================
echo  Dermatologik Tashxis - Backend
echo =====================================
cd /d "%~dp0backend"

if not exist "venv\Scripts\activate.bat" (
    echo [1/4] Virtual environment yaratilmoqda...
    python -m venv venv
    if errorlevel 1 (
        echo XATO: Python topilmadi! python.org dan yuklab oling.
        pause
        exit /b 1
    )
)

echo [2/4] Asosiy kutubxonalar o'rnatilmoqda...
venv\Scripts\pip install -q --upgrade pip
venv\Scripts\pip install -q -r requirements.txt

echo [3/4] PyTorch (CPU) o'rnatilmoqda...
venv\Scripts\pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cpu

if not exist "uploads" mkdir uploads
if not exist "ai_models" mkdir ai_models

echo [4/4] Backend serveri ishga tushirilmoqda...
echo.
echo  API:     http://localhost:8001
echo  Swagger: http://localhost:8001/docs
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
pause
