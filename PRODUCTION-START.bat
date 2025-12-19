@echo off
setlocal enabledelayedexpansion

REM PRODUCTION MODE - Billing System for Windows with PM2
REM 24/7 running, auto-restart on crash

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
echo Billing System - PRODUCTION MODE (PM2)
echo ========================================
echo.
echo 24/7 running with auto-restart on crash
echo Server runs in background after starting
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
    echo Skipping full database setup...
    echo.
    
    REM Ensure .env has production settings
    echo Updating .env for Production Mode...
    (
        echo DATABASE_URL=postgresql://postgres:ABC123@localhost:5432/billing_system
        echo PORT=5000
        echo NODE_ENV=production
        echo SESSION_SECRET=billing-system-production-secret-key-2024
    ) > .env
    echo .env updated for Production Mode
    echo.
    
    REM Apply schema migrations for existing database
    echo Applying schema migrations for any updates...
    call npm run db:push -- --force >nul 2>&1
    psql -U postgres -d billing_system -f database-schema.sql >nul 2>&1
    echo Schema updates applied.
    echo.
    
    REM ALWAYS rebuild for production to ensure latest code
    echo Rebuilding for production...
    call npm run build
    if errorlevel 1 (
        echo ERROR: Build failed
        pause
        exit /b 1
    )
    echo Build complete.
    echo.
    goto START_PM2
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

REM Check if PostgreSQL is running on port 5432
echo [1/7] Verifying PostgreSQL connection...
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
    echo NODE_ENV=production
    echo SESSION_SECRET=billing-system-production-secret-key-2024
) > .env

echo .env configured for Production Mode
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
echo.

REM Check if user choice was already saved
set CHOICE_FILE=.db-clear-choice.txt
set CLEAR_DB=

if exist "!CHOICE_FILE!" (
    REM Read the saved choice
    for /f "delims=" %%a in ('type "!CHOICE_FILE!"') do set CLEAR_DB=%%a
    echo Using saved choice: !CLEAR_DB! (from previous run)
    echo If you want to change this, delete the !CHOICE_FILE! file and run again.
    echo.
) else (
    REM Ask user for the first time
    echo ========================================
    echo WARNING: DATABASE CLEAR OPTION
    echo ========================================
    echo.
    echo This will DELETE ALL existing data in the database!
    echo (Sales, Purchases, Parties, Items, Stock, etc.)
    echo.
    echo YOUR CHOICE WILL BE REMEMBERED FOR FUTURE RUNS.
    echo To change it later, delete the .db-clear-choice.txt file.
    echo.
    set /p CLEAR_DB="Clear database records? (YES/NO): "
    
    REM Save the choice
    echo !CLEAR_DB! > "!CHOICE_FILE!"
    echo Choice saved to !CHOICE_FILE!
    echo.
)

if /i "!CLEAR_DB!"=="YES" (
    echo.
    echo Clearing database...
    call node drop-db.js >nul 2>&1
    if errorlevel 1 (
        echo Warning: Database preparation had issues. Continuing...
    )
    echo Database cleared and ready.
) else (
    echo.
    echo Skipping database clear. Keeping existing data.
    echo Database will be updated with any new schema changes only.
)
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

REM Apply migrations for existing databases
echo [4.5/7] Applying schema migrations...
echo Running migration scripts for any missing columns...
psql -U postgres -d billing_system -f database-schema.sql >nul 2>&1
if errorlevel 0 (
    echo Schema migrations applied successfully.
) else (
    echo Warning: Some migrations may have skipped (columns already exist)
)
echo.

REM Apply recovery script to ensure all new columns exist (for existing databases)
echo Verifying all required columns exist...
psql -U postgres -d billing_system -f RECOVERY-DATABASE.sql >nul 2>&1
echo Database verification complete.
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
    echo Check the errors above and fix them, then run PRODUCTION-START.bat again
    echo.
    pause
    exit /b 1
)
echo.
echo Build complete.
echo.

REM Start with PM2
:START_PM2
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

REM Save PM2 process list for auto-restart
echo Saving PM2 configuration...
call pm2 save --force

REM Install PM2 Windows startup service (ensures PM2 starts on system restart)
echo Configuring PM2 to start on Windows boot...
call pm2-startup install >nul 2>&1
if errorlevel 1 (
    echo Installing pm2-windows-startup module...
    call npm install -g pm2-windows-startup >nul 2>&1
    call pm2-startup install >nul 2>&1
)
call pm2 save --force
echo PM2 Windows startup configured!
echo.

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

REM Check PM2 status
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
