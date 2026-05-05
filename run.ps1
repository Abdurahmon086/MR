# Dermatologik Tashxis - Terminal orqali ishga tushirish
# Ishlatish: .\run.ps1
#   yoki:    .\run.ps1 backend    (faqat backend)
#   yoki:    .\run.ps1 frontend   (faqat frontend)
#   yoki:    .\run.ps1 db         (database setup)

param([string]$Mode = "all")

$Root = $PSScriptRoot
$Backend = "$Root\backend"
$Frontend = "$Root\frontend"

function Kill-Port($port) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($proc) { Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue }
}

function Start-Backend {
    Write-Host "`n[Backend] Ishga tushirilmoqda..." -ForegroundColor Cyan
    Set-Location $Backend

    if (-not (Test-Path "venv\Scripts\activate.ps1")) {
        Write-Host "  Virtual environment yaratilmoqda..." -ForegroundColor Yellow
        python -m venv venv
    }

    Write-Host "  Kutubxonalar tekshirilmoqda..."
    & venv\Scripts\pip install -q --upgrade pip
    & venv\Scripts\pip install -q -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

    if (-not (Test-Path "uploads")) { New-Item -ItemType Directory -Path "uploads" | Out-Null }
    if (-not (Test-Path "ai_models")) { New-Item -ItemType Directory -Path "ai_models" | Out-Null }

    Kill-Port 8000
    Write-Host "  http://localhost:8000 da ishlamoqda" -ForegroundColor Green
    & venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
}

function Start-Frontend {
    Write-Host "`n[Frontend] Ishga tushirilmoqda..." -ForegroundColor Cyan
    Set-Location $Frontend

    if (-not (Test-Path "node_modules")) {
        Write-Host "  npm install..."
        npm install
    }

    Kill-Port 3000
    Write-Host "  http://localhost:3000 da ishlamoqda" -ForegroundColor Green
    npm run dev
}

function Setup-Database {
    Write-Host "`n[Database] Sozlanmoqda..." -ForegroundColor Cyan
    Set-Location $Backend
    & venv\Scripts\alembic upgrade head
    & venv\Scripts\python seed.py
    Write-Host "`nLogin: admin@derm.uz / Admin1234!" -ForegroundColor Green
}

switch ($Mode) {
    "backend"  { Start-Backend }
    "frontend" { Start-Frontend }
    "db"       { Setup-Database }
    default {
        # Ikkisini ham alohida oynalarda ishga tushirish
        Write-Host "===========================================" -ForegroundColor Blue
        Write-Host "  Dermatologik Tashxis Tizimi" -ForegroundColor Blue
        Write-Host "===========================================" -ForegroundColor Blue

        Kill-Port 8000
        Kill-Port 3000

        # Backend alohida oynada
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Backend'; if(!(Test-Path 'venv\Scripts\activate.ps1')){python -m venv venv}; venv\Scripts\pip install -q -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu; venv\Scripts\alembic upgrade head; venv\Scripts\uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

        Start-Sleep 3

        # Frontend alohida oynada
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Frontend'; if(!(Test-Path 'node_modules')){npm install}; npm run dev"

        Write-Host "`nServerlar ishga tushdi!" -ForegroundColor Green
        Write-Host "  Backend:  http://localhost:8000/docs" -ForegroundColor Cyan
        Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "  Login:    admin@derm.uz / Admin1234!" -ForegroundColor Yellow
    }
}
