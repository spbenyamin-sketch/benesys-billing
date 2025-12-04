@echo off
REM Kill any process using port 5000
REM This helps when FINAL-START.bat shows "address already in use" error

echo.
echo ========================================
echo Stopping any server on port 5000...
echo ========================================
echo.

REM Find and kill process on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000"') do (
    taskkill /PID %%a /F 2>nul
)

echo.
echo ========================================
echo Port 5000 is now free!
echo ========================================
echo.
echo You can now run: FINAL-START.bat
echo.

pause
