@echo off
REM FINAL STARTUP - Billing System for Windows
REM This script does EVERYTHING - just click and wait!
REM Includes PM2 setup for production 24/7 running

cd /d E:\VfpNextConverter

echo.
echo ========================================
echo Billing System - Complete Setup & Start
echo ========================================
echo.
echo Select startup mode:
echo 1 = Development Mode (npm run dev)
echo     - Hot reload enabled
echo     - Press Ctrl+C to stop
echo.
echo 2 = Production Mode with PM2 (24/7 running)
echo     - Auto-restart on crash
echo     - Auto-startup on computer restart
echo     - Keep running in background
echo.
set /p MODE="Enter choice (1 or 2): "

if "%MODE%"=="1" (
    goto DEVELOPMENT_MODE
) else if "%MODE%"=="2" (
    goto PRODUCTION_MODE
) else (
    echo Invalid choice. Please run again and enter 1 or 2.
    pause
    exit /b 1
)

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
npm run dev

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Server failed to start!
    echo ========================================
    echo.
) else (
    echo.
    echo ========================================
    echo NO ERRORS - SERVER STOPPED
    echo ========================================
    echo.
)
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
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/billing_system
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

REM Setup database
echo [3/6] Setting up database...
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
echo NO ERRORS - Build complete
echo ========================================
echo.

REM Start with PM2
echo [6/6] Starting with PM2 (Production Mode)...
echo.

REM Check if already running
call pm2 list | findstr "billing-system" >nul
if not errorlevel 1 (
    echo Previous instance found, restarting...
    call pm2 restart billing-system
) else (
    echo Starting new PM2 instance...
    call pm2 start "npm run start" --name "billing-system"
)

if errorlevel 1 (
    echo ERROR: PM2 start failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo NO ERRORS - APP STARTED WITH PM2
echo ========================================
echo.
echo Web Browser: http://localhost:5000
echo Database: PostgreSQL on localhost:5432
echo.
echo PM2 Commands:
echo   pm2 list                    - Show all running apps
echo   pm2 logs billing-system     - View app logs
echo   pm2 stop billing-system     - Stop app
echo   pm2 restart billing-system  - Restart app
echo   pm2 delete billing-system   - Delete from PM2
echo.

REM Ask if user wants to setup auto-startup on boot
echo.
echo ========================================
echo SETUP AUTO-STARTUP ON BOOT (Optional)
echo ========================================
echo.
set /p AUTOSTART="Setup auto-startup on boot? (Y/N): "
if /i "%AUTOSTART%"=="Y" (
    echo Installing PM2 Windows startup...
    call pm2 install pm2-windows-startup
    call pm2 save
    echo.
    echo ========================================
    echo NO ERRORS - Auto-startup configured
    echo ========================================
    echo.
    echo Your app will auto-start when you restart Windows!
    echo.
) else (
    echo Skipped auto-startup setup.
    echo.
)

echo ========================================
echo PRODUCTION MODE READY!
echo ========================================
echo.
echo Your app is running in background with PM2!
echo.
echo Next steps:
echo 1. Open http://localhost:5000 in your browser
echo 2. App will auto-restart if it crashes
echo 3. View logs: pm2 logs billing-system
echo 4. To stop: pm2 stop billing-system
echo.

pause
exit /b 0
