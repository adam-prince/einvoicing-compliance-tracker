@echo off
setlocal enableextensions enabledelayedexpansion
cd /d "%~dp0"

echo [START] E-Invoicing Compliance Tracker Startup
echo =========================================

REM Check if backend is already running
echo [CHECK] Checking if backend server is already running...
curl -s http://localhost:3003/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend server is already running on port 3003
) else (
    echo [START] Starting backend API server...
    start "E-Invoicing Backend" cmd /k "node backend/server-simple.js"
    echo [WAIT] Waiting for backend to start...
    timeout /t 5 /nobreak >nul
)

REM Check if frontend dev server is already running  
echo [CHECK] Checking if frontend server is already running...
curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Frontend server is already running on port 3001
    echo [BROWSER] Opening browser...
    start "" "http://localhost:3001"
) else (
    echo [START] Starting development server...
    start "E-Invoicing Tracker" cmd /k "npm run dev"
    echo [WAIT] Waiting for frontend to start...
    timeout /t 8 /nobreak >nul
    echo [BROWSER] Opening browser...
    start "" "http://localhost:3001"
)

echo [OK] E-Invoicing Compliance Tracker is starting up!
echo [INFO] Instructions:
echo    - Frontend: http://localhost:3001
echo    - Backend API: http://localhost:3003  
echo    - Use the Exit button in the app to properly shut down
echo.
echo [INFO] You can close this window now.
pause
exit /b 0


