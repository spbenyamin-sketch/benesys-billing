@echo off
REM Complete Setup & Run Script for Windows

echo.
echo ========================================
echo Billing System - Complete Setup
echo ========================================
echo.

REM Check if .env exists
if exist .env (
    echo .env file found, skipping creation...
) else (
    echo Creating .env file...
    (
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/billing_system
        echo NODE_ENV=development
    ) > .env
    echo .env file created successfully!
)

echo.
echo Creating database if it doesn't exist...
setlocal enabledelayedexpansion
set PGPASSWORD=postgres
psql -U postgres -c "CREATE DATABASE billing_system;" 2>nul
if errorlevel 1 (
    echo Database may already exist (this is OK^)
) else (
    echo Database created successfully!
)

echo.
echo Setting up database schema...
call npm run db:push

echo.
echo ========================================
echo Starting Application Server...
echo ========================================
echo.
echo Open browser: http://localhost:5000
echo.

cmd /c "set NODE_ENV=development && npx tsx server/index-dev.ts"

pause
