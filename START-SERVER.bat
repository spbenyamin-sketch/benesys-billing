@echo off
REM Simple Server Starter - Billing System

cd /d E:\VfpNextConverter

echo.
echo ========================================
echo Starting Billing System Server
echo ========================================
echo.

REM Check if .env exists and create if needed
if not exist .env (
    echo Creating .env file...
    (
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/billing_system
        echo NODE_ENV=development
    ) > .env
    echo .env created!
)

REM Show what we're using
echo Configuration:
type .env
echo.

REM Start server with explicit env vars
set NODE_ENV=development
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/billing_system

echo Starting server...
echo Browser: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

npx tsx server/index-dev.ts

