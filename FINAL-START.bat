@echo off
setlocal enabledelayedexpansion

REM FINAL STARTUP - Billing System for Windows
REM Smart setup - skips database creation if already set up

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
    echo Rebuilding frontend assets...
    echo.
    call npm run build >nul 2>&1
    echo Starting server directly...
    echo.
    goto DEVELOPMENT_START_SERVER
)

echo Setup needed. Proceeding with full setup...
echo.

REM ALWAYS recreate .env with development settings
echo [1/5] Setting up environment (.env file)...
(
    echo DATABASE_URL=postgresql://postgres:ABC123@localhost:5432/billing_system
    echo NODE_ENV=development
) > .env
echo .env configured for Development Mode
echo.

REM Install dependencies
echo [2/5] Installing dependencies (npm install)...
call npm install >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo Dependencies installed.
echo.

REM Create database if missing
echo [3/5] Creating database...
call node create-db.js >nul 2>&1
echo Database check complete.
echo.

REM Setup database schema
echo [4/5] Setting up database schema...
call npm run db:push -- --force >nul 2>&1
if errorlevel 1 (
    echo ERROR: Database schema setup failed
    pause
    exit /b 1
)
echo Database schema ready.
echo.

REM Start server in development mode
:DEVELOPMENT_START_SERVER
echo ========================================
echo [5/5] STARTING SERVER ON PORT 5000...
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

REM ============================================================================
REM PRODUCTION MODE - Build + PM2
REM ============================================================================

:PRODUCTION_MODE
echo.
echo ========================================
echo PRODUCTION MODE WITH PM2 SELECTED
echo ========================================
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
    echo Starting PM2 directly...
    echo.
    goto PRODUCTION_START_PM2
)

echo Setup needed. Proceeding with full setup...
echo.
echo This will:
echo 1. Configure environment for production
echo 2. Install all dependencies
echo 3. Setup database
echo 4. Install PM2 globally
echo 5. Build for production
echo 6. Start with PM2 (24/7 running)
echo.
echo ========================================
echo.

REM ALWAYS recreate .env with production settings
echo [1/7] Setting up environment (.env file)...
(
    echo DATABASE_URL=postgresql://postgres:ABC123@localhost:5432/billing_system
    echo NODE_ENV=production
) > .env
echo .env configured for Production Mode
echo.

REM Install dependencies
echo [2/7] Installing dependencies (npm install)...
call npm install >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo Dependencies installed.
echo.

REM Clean and recreate database
echo [3/7] Preparing database...
call node drop-db.js >nul 2>&1
if errorlevel 1 (
    echo Warning: Database preparation had issues. Continuing...
)
echo Database ready.
echo.

REM Setup database schema
echo [4/7] Setting up database schema...
call npm run db:push -- --force >nul 2>&1
if errorlevel 1 (
    echo ERROR: Database schema setup failed
    pause
    exit /b 1
)
echo Database schema ready.
echo.

REM Install PM2 globally
echo [5/7] Installing PM2 globally...
echo Checking if PM2 is already installed...
call pm2 -v >nul 2>&1
if errorlevel 0 (
    echo PM2 is already installed
) else (
    echo Installing PM2...
    call npm install -g pm2 >nul 2>&1
    if errorlevel 1 (
        echo ERROR: PM2 installation failed
        echo Make sure you have administrator privileges
        pause
        exit /b 1
    )
    echo PM2 installed successfully.
)
echo.

REM Build for production
echo [6/7] Building for production...
echo This may take 1-2 minutes on first build...
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Build failed
    echo ========================================
    echo.
    echo Check the errors above and fix them, then run FINAL-START.bat again
    echo.
    pause
    exit /b 1
)
echo.
echo Build complete.
echo.

REM Start with PM2
:PRODUCTION_START_PM2
echo [7/7] Starting with PM2 (24/7 running)...
echo.

REM Check if dist folder exists
echo Verifying build files...
if not exist "dist\" (
    echo ERROR: dist folder not found! Build failed or incomplete.
    echo Please run: npm run build
    pause
    exit /b 1
)
echo ✓ dist folder found

REM Check if dist/index.js exists
if not exist "dist\index.js" (
    echo ERROR: dist/index.js not found! Build is incomplete.
    echo Running build again...
    call npm run build
    if not exist "dist\index.js" (
        echo ERROR: Build failed completely. Check errors above.
        pause
        exit /b 1
    )
)
echo ✓ dist/index.js found
echo.

call pm2 delete billing_system 2>nul
echo Starting billing_system with PM2...
echo.

REM Start using the npm start script which handles NODE_ENV=production
call pm2 start npm --name billing_system -- start
call pm2 save

if errorlevel 1 (
    echo ERROR: PM2 startup failed
    echo.
    echo Checking PM2 logs...
    call pm2 logs billing_system --lines 30
    pause
    exit /b 1
)

REM Wait a moment for app to start
timeout /t 2 /nobreak

REM Check PM2 status
echo.
echo ========================================
echo PM2 STATUS CHECK:
echo ========================================
echo.
call pm2 status
echo.
call pm2 list
echo.

echo ========================================
echo SERVICE STATUS: RUNNING 24/7 WITH PM2!
echo ========================================
echo.
echo Web Browser: http://localhost:5000
echo Database: PostgreSQL on localhost:5432
echo.
echo PM2 will keep the server running in background!
echo.
echo Useful PM2 Commands:
echo   pm2 status       - Check server status
echo   pm2 stop all     - Stop server
echo   pm2 restart all  - Restart server
echo   pm2 logs         - View server logs
echo.
echo You can close this window now!
echo.
timeout /t 3 /nobreak
exit /b 0
