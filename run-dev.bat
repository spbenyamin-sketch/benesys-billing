@echo off
REM Billing System - Development Server for Windows
cd /d E:\VfpNextConverter

echo.
echo ========================================
echo Starting Billing System
echo ========================================
echo.
echo Opening on: http://localhost:5000
echo.

cmd /c "set NODE_ENV=development && npx tsx server/index-dev.ts"

pause
