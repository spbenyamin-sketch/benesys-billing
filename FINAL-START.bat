@echo off
REM FINAL STARTUP - Billing System for Windows
REM This script does EVERYTHING - just click and wait!

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
echo Billing System - Complete Setup & Start
echo ========================================
echo.
echo Select startup mode:
echo.
echo   1 = Development Mode (npm run dev)
echo       - Hot reload enabled
echo       - Press Ctrl+C to stop
echo.
echo   2 = Production Mode with PM2 (24/7 running)
echo       - Auto-restart on crash
echo       - Auto-startup on computer restart
echo       - Keep running in background
echo.
set /p MODE="Enter choice (1 or 2): "

if "%MODE%"=="2" goto PRODUCTION_MODE
if "%MODE%"=="1" goto DEVELOPMENT_MODE

echo.
echo Invalid choice. Please run again and enter 1 or 2.
echo.
pause
exit /b 1

REM ============================================================================
REM DEVELOPMENT MODE - npm run dev
REM ============================================================================

:DEVELOPMENT_MODE
echo.
echo ========================================
echo DEVELOPMENT MODE SELECTED
echo ========================================
echo.

REM Create .env if missing
if not exist .env (
    echo [1/5] Creating .env file...
    (
        echo DATABASE_URL=postgresql://postgres:ABC123@localhost:5432/billing_system
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

REM Create database if missing
echo [4/5] Creating database...

REM Use Node.js to create database (most reliable)
call node create-db.js
if errorlevel 1 (
    echo Warning: Database creation may have failed. Continuing anyway...
)

echo Database check complete.
echo.

REM Setup database schema
echo [4b/5] Setting up database schema...
call npm run db:push
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Database schema setup failed!
    echo ========================================
    echo.
    echo Troubleshooting:
    echo 1. Make sure PostgreSQL is running (Services.msc)
    echo 2. Run DROP-DATABASE.bat to clean up
    echo 3. Then try FINAL-START.bat again
    echo.
    pause
    exit /b 1
)
echo.
echo ========================================
echo NO ERRORS - Database ready!
echo ========================================
echo.

REM Start server in development mode
echo ========================================
echo [5/5] Starting Application Server (Development Mode)...
echo ========================================
echo.
echo Web Browser: http://localhost:5000
echo Database: PostgreSQL on localhost:5432
echo.
echo Tip: Press Ctrl+C to stop the server
echo.
echo Starting in 3 seconds...
timeout /t 3 /nobreak

set NODE_ENV=development
npx tsx server/index-dev.ts

echo.
echo ========================================
echo SERVER STOPPED
echo ========================================
echo.
pause
exit /b 0

REM ============================================================================
REM PRODUCTION MODE - Build + PM2
REM ============================================================================

:PRODUCTION_MODE
echo.
echo ========================================
echo PRODUCTION MODE WITH PM2 SELECTED
echo ========================================
echo.
echo This will:
echo 1. Install all dependencies
echo 2. Create .env file if needed
echo 3. Setup database
echo 4. Install PM2 globally
echo 5. Build for production
echo 6. Start with PM2 (24/7 running)
echo.
echo ========================================
echo.

REM Create .env if missing
if not exist .env (
    echo [1/6] Creating .env file...
    (
        echo DATABASE_URL=postgresql://postgres:ABC123@localhost:5432/billing_system
        echo NODE_ENV=production
    ) > .env
    echo .env created successfully!
    echo.
) else (
    echo [1/6] .env file already exists
    echo.
)

REM Show configuration
echo Current configuration:
type .env
echo.

REM Install dependencies
echo [2/6] Installing dependencies (npm install)...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo.

REM Create database if missing
echo [3/6] Creating database...

REM Use Node.js to create database (most reliable)
call node create-db.js
if errorlevel 1 (
    echo Warning: Database creation may have failed. Continuing anyway...
)

echo Database check complete.
echo.

REM Setup database schema
echo [3b/6] Setting up database schema...
call npm run db:push
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Database schema setup failed!
    echo ========================================
    echo.
    echo Troubleshooting:
    echo 1. Make sure PostgreSQL is running (Services.msc)
    echo 2. Run DROP-DATABASE.bat to clean up
    echo 3. Then try FINAL-START.bat again
    echo.
    pause
    exit /b 1
)
echo.
echo ========================================
echo NO ERRORS - Database ready!
echo ========================================
echo.

REM Install PM2 globally
echo [4/6] Installing PM2 globally...
call npm install -g pm2
if errorlevel 1 (
    echo ERROR: PM2 installation failed
    echo Make sure you have administrator privileges
    pause
    exit /b 1
)
echo.
echo ========================================
echo NO ERRORS - PM2 installed
echo ========================================
echo.

REM Build for production
echo [5/6] Building for production...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo.
echo ========================================
echo NO ERRORS - Build successful
echo ========================================
echo.

REM Start with PM2
echo [6/6] Starting with PM2 (24/7 running)...
call pm2 delete billing_system 2>nul
call pm2 start "npm run start" --name billing_system
call pm2 save

if errorlevel 1 (
    echo ERROR: PM2 startup failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS - SYSTEM RUNNING 24/7 WITH PM2!
echo ========================================
echo.
echo Web Browser: http://localhost:5000
echo Database: PostgreSQL on localhost:5432
echo.
echo PM2 will keep the server running even after you close this window!
echo.
echo Useful PM2 Commands:
echo   pm2 status       - Check server status
echo   pm2 stop all     - Stop server
echo   pm2 restart all  - Restart server
echo   pm2 logs         - View server logs
echo.
pause
exit /b 0
