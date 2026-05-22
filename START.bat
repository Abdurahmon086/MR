@echo off
echo ==========================================
echo  Dermatologik Tashxis Tizimi v1.0
echo ==========================================
echo.

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

:: ---- 1. PYTHON ----
echo [1/6] Python tekshirilmoqda...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  XATO: Python topilmadi!
    echo  python.org/downloads dan Python 3.10+ yuklab oling
    echo  O'rnatishda "Add Python to PATH" ni belgilang!
    echo.
    pause
    exit /b 1
)
for /f "tokens=2" %%v in ('python --version 2^>^&1') do echo  OK - Python %%v

:: ---- 2. NODE.JS ----
echo [2/6] Node.js tekshirilmoqda...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  XATO: Node.js topilmadi!
    echo  nodejs.org dan LTS versiyasini yuklab oling
    echo.
    pause
    exit /b 1
)
for /f %%v in ('node --version 2^>^&1') do echo  OK - Node.js %%v

:: ---- 3. POSTGRESQL ----
echo [3/6] PostgreSQL tekshirilmoqda...
set PG_FOUND=0
for %%s in (postgresql-x64-16 postgresql-x64-15 postgresql-x64-14 postgresql) do (
    sc query %%s >nul 2>&1
    if not errorlevel 1 set PG_FOUND=1
)
if %PG_FOUND%==0 (
    echo.
    echo  XATO: PostgreSQL topilmadi!
    echo  postgresql.org/download/windows dan yuklab oling
    echo.
    pause
    exit /b 1
)
echo  OK - PostgreSQL topildi

:: ---- 4. .ENV ----
echo [4/6] Konfiguratsiya tekshirilmoqda...
if not exist "%BACKEND%\.env" (
    echo.
    echo  .env fayli yo'q. PostgreSQL parolini kiriting:
    echo  (PostgreSQL o'rnatishda yozgan parol)
    echo.
    set /p "PGPASS=  Parol: "
    (
        echo DATABASE_URL=postgresql+asyncpg://postgres:!PGPASS!@localhost:5432/dermatology_db
        echo DATABASE_SYNC_URL=postgresql://postgres:!PGPASS!@localhost:5432/dermatology_db
        echo JWT_SECRET_KEY=dermatology-jwt-secret-2024-secure-key
        echo JWT_ALGORITHM=HS256
        echo ACCESS_TOKEN_EXPIRE_MINUTES=60
        echo REFRESH_TOKEN_EXPIRE_DAYS=30
        echo UPLOAD_DIR=uploads
        echo AI_MODEL_PATH=ai_models/efficientnet_ham10000.pth
        echo MAX_UPLOAD_SIZE_MB=20
        echo ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/bmp,image/tiff
        echo ENVIRONMENT=development
        echo CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
    ) > "%BACKEND%\.env"
    echo  OK - .env yaratildi
) else (
    echo  OK - .env mavjud
)

:: ---- 5. BACKEND ----
echo [5/6] Backend tayyorlanmoqda...
cd /d "%BACKEND%"

if not exist "venv\Scripts\activate.bat" (
    echo  Virtual environment yaratilmoqda...
    python -m venv venv
)

echo  Kutubxonalar o'rnatilmoqda (birinchi marta 5-10 daqiqa)...
venv\Scripts\pip install -q --upgrade pip
venv\Scripts\pip install -q -r requirements.txt
venv\Scripts\pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cpu

if not exist "uploads" mkdir uploads
if not exist "ai_models" mkdir ai_models

echo  Migratsiya ishga tushirilmoqda...
venv\Scripts\alembic upgrade head
if errorlevel 1 (
    echo.
    echo  XATO: Database ulanmadi!
    echo  1. PostgreSQL ishlamoqdami? (Services.msc dan tekshiring)
    echo  2. backend\.env dagi parol to'g'rimi?
    echo.
    pause
    exit /b 1
)
venv\Scripts\python seed.py >nul 2>&1
echo  OK - Backend tayyor

:: ---- 6. FRONTEND ----
echo [6/6] Frontend tayyorlanmoqda...
cd /d "%FRONTEND%"
if not exist "node_modules" (
    echo  npm install (2-3 daqiqa)...
    npm install --silent
)
echo  OK - Frontend tayyor

:: ---- SERVERLARNI ISHGA TUSHIRISH ----
echo.
echo  ==========================================
echo   Hammasi tayyor! Serverlar ishga tushmoqda
echo  ==========================================
echo.
echo   Backend:  http://localhost:8001/docs
echo   Frontend: http://localhost:3000
echo   Login:    admin@derm.uz / Admin1234!
echo.
echo  Ikkita konsol oynasi ochiladi...
echo.
timeout /t 2 /nobreak >nul

:: Port 8000 ni tozalash
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
:: Port 3000 ni tozalash
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

start "Backend - FastAPI" cmd /k "cd /d "%BACKEND%" && venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 3 /nobreak >nul
start "Frontend - Next.js" cmd /k "cd /d "%FRONTEND%" && npm run dev"

echo.
echo  Serverlar ishga tushdi!
echo  Brauzerda http://localhost:3000 ni oching
echo.
pause
