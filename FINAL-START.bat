@echo off
setlocal enabledelayedexpansion

REM DEVELOPMENT MODE - Billing System for Windows
REM Hot reload enabled, press Ctrl+C to stop

cd /d E:\VfpNextConverter

REM Kill any process already using port 5000 from previous runs
echo.
echo ========================================
echo Cleaning up old processes on port 5000...
echo ========================================
echo.
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":5000" 2^>nul') do (
    taskkill /PID %%a /F 2>nul
)
echo Port 5000 cleanup complete.
echo.

echo ========================================
echo Billing System - DEVELOPMENT MODE
echo ========================================
echo.
echo Hot reload enabled - changes apply automatically
echo Press Ctrl+C to stop the server
echo.

REM Check if setup is already complete
echo Checking if system is already set up...
for /f "delims=" %%i in ('node check-setup.js 2^>nul') do set SETUP_STATUS=%%i

if "%SETUP_STATUS%"=="SETUP_COMPLETE" (
    echo.
    echo ========================================
    echo SETUP ALREADY COMPLETE!
    echo ========================================
    echo.
    echo Skipping database and schema setup...
    echo.
    
    REM Ensure .env has correct development settings
    echo Updating .env for Development Mode...
    (
        echo DATABASE_URL=postgresql://postgres:ABC123@localhost:5432/billing_system
        echo PORT=5000
        echo NODE_ENV=development
        echo SESSION_SECRET=billing-system-production-secret-key-2024
    ) > .env
    echo .env updated for Development Mode
    echo.
    
    echo Starting server directly...
    echo.
    goto START_SERVER
)

echo Setup needed. Proceeding with full setup...
echo.

REM Check if PostgreSQL is running on port 5432
echo [1/4] Verifying PostgreSQL connection...
netstat -aon 2>nul | find ":5432" >nul
if errorlevel 1 (
    echo.
    echo WARNING: PostgreSQL does not appear to be running on port 5432
    echo Make sure PostgreSQL is started before continuing
    echo.
    set /p CONTINUE="Continue anyway? (y/n): "
    if /i not "!CONTINUE!"=="y" (
        pause
        exit /b 1
    )
)
echo PostgreSQL check complete.
echo.

REM Create .env file
echo Setting up environment (.env file)...
(
    echo DATABASE_URL=postgresql://postgres:ABC123@localhost:5432/billing_system
    echo PORT=5000
    echo NODE_ENV=development
    echo SESSION_SECRET=billing-system-production-secret-key-2024
) > .env

echo .env configured for Development Mode
echo Database: postgresql://postgres:***@localhost:5432/billing_system
echo.

REM Verify .env was created
if not exist ".env" (
    echo ERROR: Failed to create .env file
    pause
    exit /b 1
)
echo .env file verified
echo.

REM Install dependencies
echo [2/4] Installing dependencies (npm install)...
call npm install >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo Dependencies installed.
echo.

REM Create database if missing
echo [3/4] Creating database...
call node create-db.js >nul 2>&1
echo Database check complete.
echo.

REM Setup database schema
echo [4/4] Setting up database schema...
call npm run db:push -- --force >nul 2>&1
if errorlevel 1 (
    echo ERROR: Database schema setup failed
    pause
    exit /b 1
)
echo Database schema ready.
echo.

REM Start server in development mode
:START_SERVER
echo ========================================
echo STARTING SERVER ON PORT 5000...
echo ========================================
echo.
echo SERVICE STATUS: RUNNING...
echo Web Browser: http://localhost:5000
echo Database: PostgreSQL on localhost:5432
echo.
echo Press Ctrl+C to stop the server
echo.

timeout /t 2 /nobreak

set NODE_ENV=development
npx tsx server/index-dev.ts

echo.
echo ========================================
echo SERVER STOPPED
echo ========================================
echo.
pause
exit /b 0
