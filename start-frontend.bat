@echo off
echo =====================================
echo  Dermatologik Tashxis - Frontend
echo =====================================
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [1/2] Kutubxonalar o'rnatilmoqda...
    npm install
    if errorlevel 1 (
        echo XATO: npm topilmadi! nodejs.org dan yuklab oling.
        pause
        exit /b 1
    )
)

echo [2/2] Frontend serveri ishga tushirilmoqda...
echo.
echo  Sayt: http://localhost:3000
echo.

:: Port 3000 band bo'lsa eski process o'ldiriladi
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)

npm run dev
pause
