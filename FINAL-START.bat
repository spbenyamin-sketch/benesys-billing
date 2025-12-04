@echo off
REM FINAL STARTUP - Billing System for Windows
REM This script does EVERYTHING - just click and wait!

cd /d E:\VfpNextConverter

echo.
echo ========================================
echo Billing System - Complete Setup & Start
echo ========================================
echo.
echo This will:
echo 1. Install all dependencies
echo 2. Install dotenv package
echo 3. Create .env file if needed
echo 4. Setup database
echo 5. Start the server
echo.
echo ========================================
echo.

REM Create .env if missing
if not exist .env (
    echo [1/5] Creating .env file...
    (
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/billing_system
        echo NODE_ENV=development
    ) > .env
    echo .env created successfully!
    echo.
) else (
    echo [1/5] .env file already exists
    echo.
)

REM Show configuration
echo Current configuration:
type .env
echo.

REM Install dependencies
echo [2/5] Installing dependencies (npm install)...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo.

REM Install dotenv
echo [3/5] Installing dotenv package...
call npm install dotenv
if errorlevel 1 (
    echo ERROR: dotenv installation failed
    pause
    exit /b 1
)
echo.

REM Setup database
echo [4/5] Setting up database...
call npm run db:push
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Database setup failed!
    echo ========================================
    echo.
    echo Make sure PostgreSQL is running:
    echo - Start PostgreSQL service on Windows
    echo - Check that database "billing_system" exists
    echo.
    pause
    exit /b 1
)
echo.
echo ========================================
echo NO ERRORS - Database setup complete
echo ========================================
echo.

REM Start server
echo ========================================
echo [5/5] Starting Application Server...
echo ========================================
echo.
echo Web Browser: http://127.0.0.1:5000
echo Database: PostgreSQL on localhost:5432
echo.
echo Press Ctrl+C to stop the server
echo.
echo Starting in 3 seconds...
timeout /t 3 /nobreak

set NODE_ENV=development
npx tsx server/index-dev.ts

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Server failed to start!
    echo ========================================
    echo.
) else (
    echo.
    echo ========================================
    echo NO ERRORS - SERVER STARTED SUCCESSFULLY
    echo ========================================
    echo.
)
pause

