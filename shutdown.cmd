@echo off
echo [SHUTDOWN] Shutting down E-Invoicing Compliance Tracker...

REM Kill Node.js processes running on our ports
echo [STOP] Stopping servers...
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3003 ^| findstr LISTENING') do (
    echo [KILL] Stopping process %%i on port 3003
    taskkill /f /pid %%i >nul 2>&1
)
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo [KILL] Stopping process %%i on port 3001
    taskkill /f /pid %%i >nul 2>&1
)

REM Kill Node processes that might be running our specific application
echo [CLEANUP] Cleaning up Node.js processes...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| find "node.exe"') do (
    powershell -Command "Get-Process -Id %%i | Where-Object {$_.MainWindowTitle -like '*einvoicing*' -or $_.CommandLine -like '*vite*' -or $_.CommandLine -like '*server-simple*'} | Stop-Process -Force" 2>nul
)

REM Kill any PowerShell processes that spawned this browser
echo [CHECK] Checking for parent PowerShell processes...
powershell -Command "Get-Process powershell | Where-Object {$_.MainWindowTitle -like '*compliance*' -or $_.CommandLine -like '*npm run*'} | Stop-Process -Force" 2>nul

REM Final attempt - kill current PowerShell session
echo [CLOSE] Closing PowerShell session...
timeout /t 1 >nul
taskkill /f /im powershell.exe /fi "windowtitle eq *compliance*" >nul 2>&1
taskkill /f /im pwsh.exe /fi "windowtitle eq *compliance*" >nul 2>&1

echo [OK] Shutdown complete!
echo [INFO] PowerShell should now close automatically.
timeout /t 2 >nul
exit