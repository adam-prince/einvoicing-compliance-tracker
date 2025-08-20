@echo off
setlocal enableextensions enabledelayedexpansion
cd /d "%~dp0"

echo Installing dependencies (this may take a moment)...
call npm install --no-fund --no-audit
if errorlevel 1 (
  echo npm install failed. Press any key to exit.
  pause >nul
  exit /b 1
)

rem Skipping UN Member States sync per user request.

echo Building production bundle...
call npm run build
if errorlevel 1 (
  echo Build failed. Press any key to exit.
  pause >nul
  exit /b 1
)

echo Starting local API (for automated refresh)...
start "E-Invoicing API" cmd /c "npm run api"

echo Starting preview server on http://localhost:5173/ ...
start "E-Invoicing Tracker" cmd /c "npm run preview -- --open --port 5173"
rem Also attempt to open default browser in case --open fails
start "" "http://localhost:5173/"

echo Server starting in a new window. You can close this window.
exit /b 0


