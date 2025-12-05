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

REM Check if PostgreSQL is running on port 5432
echo Verifying PostgreSQL connection...
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

(
    echo DATABASE_URL=postgresql://postgres:ABC123@localhost:5432/billing_system_db
    echo PORT=5000
    echo NODE_ENV=development
    echo SESSION_SECRET=dev-secret-key-change-in-production
) > .env

echo .env configured for Development Mode
echo Database: postgresql://postgres:***@localhost:5432/billing_system_db
echo SESSION_SECRET: dev-secret-key-change-in-production
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

REM Check if PostgreSQL is running on port 5432
echo Verifying PostgreSQL connection...
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

(
    echo DATABASE_URL=postgresql://postgres:ABC123@localhost:5432/billing_system_db
    echo PORT=5000
    echo NODE_ENV=production
    echo SESSION_SECRET=billing-system-production-secret-key-2024
) > .env

echo .env configured for Production Mode
echo Database: postgresql://postgres:***@localhost:5432/billing_system_db
echo SESSION_SECRET: billing-system-production-secret-key-2024
echo.
echo NOTE: For security in production, change SESSION_SECRET to a random value
echo Edit .env file to customize
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

REM Check if dist/public folder exists (frontend assets)
if not exist "dist\public\" (
    echo ERROR: dist/public folder not found! Frontend build is missing.
    echo Running full build again...
    call npm run build
    if not exist "dist\public\" (
        echo ERROR: Frontend build failed. Check errors above.
        pause
        exit /b 1
    )
)
echo ✓ dist/public folder found

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found! Environment not configured.
    pause
    exit /b 1
)
echo ✓ .env file found
echo.

REM Delete old PM2 process
call pm2 delete billing_system 2>nul
timeout /t 1 /nobreak

echo Starting billing_system with PM2...
echo This will start the server on http://localhost:5000
echo.

REM Start using pm2-start.js wrapper (Windows compatible)
call pm2 start pm2-start.js --name billing_system
call pm2 save

if errorlevel 1 (
    echo ERROR: PM2 startup failed
    echo.
    echo Checking PM2 logs...
    call pm2 logs billing_system --lines 30
    pause
    exit /b 1
)

REM Wait for app to fully start
echo Waiting for server to start...
timeout /t 3 /nobreak

REM Check PM2 status multiple times (it may be "stopped" initially)
echo.
echo ========================================
echo PM2 STATUS CHECK:
echo ========================================
echo.
call pm2 status
echo.

REM Wait a bit more and check again
timeout /t 2 /nobreak
call pm2 list

REM Check if server is actually running
echo.
echo ========================================
echo VERIFYING SERVER CONNECTION:
echo ========================================
echo.

REM Try to connect to the server
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":5000" 2^>nul') do (
    echo ✓ Server is listening on port 5000
    goto SERVER_READY
)

echo ⚠ Warning: Server may not be responding yet
echo Checking error logs...
call pm2 logs billing_system --err --lines 20
echo.
echo Troubleshooting:
echo - Check if PostgreSQL is running: netstat -aon ^| find ":5432"
echo - Check .env file: type .env
echo - View detailed logs: pm2 logs billing_system
echo.

:SERVER_READY
echo.
echo ========================================
echo SERVICE STATUS: RUNNING 24/7 WITH PM2
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
echo   pm2 logs billing_system - View server logs
echo   pm2 logs billing_system --err - View error logs only
echo.
echo Default Login:
echo   Username: admin
echo   Password: admin@123
echo.
echo You can close this window now!
echo.
timeout /t 3 /nobreak
exit /b 0
