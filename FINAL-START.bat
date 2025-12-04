@echo off
REM FINAL STARTUP - Billing System for Windows

cd /d E:\VfpNextConverter

echo.
echo ========================================
echo Billing System - Starting
echo ========================================
echo.

REM Create .env if missing
if not exist .env (
    echo Creating .env file...
    (
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/billing_system
        echo NODE_ENV=development
    ) > .env
    echo .env created successfully!
)

echo Running with configuration from .env:
echo.
type .env
echo.

echo ========================================
echo Starting Application Server...
echo ========================================
echo.
echo Web Browser: http://localhost:5000
echo Database: PostgreSQL on localhost:5432
echo.
echo Press Ctrl+C to stop the server
echo.

npx tsx server/index-dev.ts

