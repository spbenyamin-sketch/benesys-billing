@echo off
setlocal enabledelayedexpansion

REM =====================================================
REM BILLING SYSTEM - ONE CLICK START
REM Database: Supabase Cloud PostgreSQL
REM Project: D:\Benesys
REM =====================================================

REM Fix PATH so pm2 is always found
set "PATH=%PATH%;%APPDATA%\npm;%ProgramFiles%\nodejs;%ProgramFiles(x86)%\nodejs"

REM Go to project folder
cd /d D:\Benesys

echo.
echo =====================================================
echo  BILLING SYSTEM - ONE CLICK START
echo =====================================================
echo.

REM =====================================================
REM STEP 1 - WRITE .ENV FILE USING NODE
REM =====================================================
echo [1/7] Writing .env file...

node -e "require('fs').writeFileSync('D:\\Benesys\\.env', 'DATABASE_URL=postgresql://postgres:Benny%40deepa24@db.odojhjpnrenilgheqbtr.supabase.co:5432/postgres?sslmode=require\nPORT=5000\nNODE_ENV=production\nSESSION_SECRET=billing-system-production-secret-key-2024\n')"

if errorlevel 1 (
    echo ERROR: Failed to write .env file!
    pause
    exit /b 1
)
echo .env written.
echo.

REM =====================================================
REM STEP 2 - VERIFY .ENV FILE
REM =====================================================
echo [2/7] Verifying .env file...
echo.
echo -----------------------------------------------
echo  CURRENT .ENV CONTENTS:
echo -----------------------------------------------

REM Check .env exists
if not exist "D:\Benesys\.env" (
    echo ERROR: .env file NOT FOUND at D:\Benesys\.env
    echo Something went wrong writing the file.
    pause
    exit /b 1
)
echo  FILE EXISTS: YES
echo.

REM Show contents
type D:\Benesys\.env
echo.

REM Check DATABASE_URL line exists
findstr /i "DATABASE_URL" D:\Benesys\.env >nul
if errorlevel 1 (
    echo ERROR: DATABASE_URL is missing from .env!
    pause
    exit /b 1
)
echo  DATABASE_URL: FOUND

REM Check PORT line exists
findstr /i "PORT" D:\Benesys\.env >nul
if errorlevel 1 (
    echo ERROR: PORT is missing from .env!
    pause
    exit /b 1
)
echo  PORT:         FOUND

REM Check NODE_ENV line exists
findstr /i "NODE_ENV" D:\Benesys\.env >nul
if errorlevel 1 (
    echo ERROR: NODE_ENV is missing from .env!
    pause
    exit /b 1
)
echo  NODE_ENV:     FOUND

REM Check SESSION_SECRET line exists
findstr /i "SESSION_SECRET" D:\Benesys\.env >nul
if errorlevel 1 (
    echo ERROR: SESSION_SECRET is missing from .env!
    pause
    exit /b 1
)
echo  SESSION_SECRET: FOUND

REM Check Supabase URL is in the DATABASE_URL
findstr /i "supabase.co" D:\Benesys\.env >nul
if errorlevel 1 (
    echo ERROR: Supabase URL not found in DATABASE_URL!
    echo Make sure DATABASE_URL contains supabase.co
    pause
    exit /b 1
)
echo  SUPABASE URL: FOUND

REM Check sslmode is present
findstr /i "sslmode" D:\Benesys\.env >nul
if errorlevel 1 (
    echo ERROR: sslmode=require is missing from DATABASE_URL!
    pause
    exit /b 1
)
echo  SSL MODE:     FOUND

echo.
echo  ALL .ENV CHECKS PASSED!
echo -----------------------------------------------
echo.

REM =====================================================
REM STEP 3 - KILL OLD PROCESSES
REM =====================================================
echo [3/7] Cleaning up old processes on port 5000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| find ":5000" 2^>nul') do (
    taskkill /PID %%a /F 2>nul
)
echo Cleanup done.
echo.

REM =====================================================
REM STEP 4 - INSTALL PM2
REM =====================================================
echo [4/7] Installing PM2 globally...
call npm install -g pm2 2>nul
call npm install -g pm2-windows-startup 2>nul
set "PATH=%PATH%;%APPDATA%\npm"

REM Verify PM2 available
call pm2 --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: PM2 still not found after install!
    echo Please run manually: npm install -g pm2
    pause
    exit /b 1
)
echo PM2 ready.
echo.

REM =====================================================
REM STEP 5 - INSTALL DEPENDENCIES
REM =====================================================
echo [5/7] Installing app dependencies...
call npm install >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo Dependencies ready.
echo.

REM =====================================================
REM STEP 6 - BUILD FOR PRODUCTION
REM =====================================================
echo [6/7] Building for production...
echo (This takes 1-2 minutes, please wait...)
echo.
call npm run build
if errorlevel 1 (
    echo.
    echo ERROR: Build failed! Check errors above.
    pause
    exit /b 1
)
echo Build complete.
echo.

REM =====================================================
REM STEP 7 - START WITH PM2
REM =====================================================
echo [7/7] Starting app with PM2...

REM Verify build files exist before starting
if not exist "D:\Benesys\dist\" (
    echo ERROR: dist folder not found! Build may have failed.
    pause
    exit /b 1
)
echo  dist folder:     OK

if not exist "D:\Benesys\dist\index.js" (
    echo ERROR: dist\index.js not found!
    pause
    exit /b 1
)
echo  dist\index.js:   OK

if not exist "D:\Benesys\dist\public\" (
    echo ERROR: dist\public folder not found!
    pause
    exit /b 1
)
echo  dist\public:     OK

if not exist "D:\Benesys\pm2-start.js" (
    echo ERROR: pm2-start.js not found!
    pause
    exit /b 1
)
echo  pm2-start.js:    OK
echo.

REM Kill old PM2 process cleanly
call pm2 delete billing_system 2>nul
call pm2 kill 2>nul
timeout /t 2 /nobreak >nul

REM Start with PM2
call pm2 start pm2-start.js --name billing_system

REM Save and configure Windows auto-start
call pm2 save --force
call pm2-startup install >nul 2>&1
call pm2 save --force

REM Wait for server to fully start
echo.
echo Waiting for server to start (8 seconds)...
timeout /t 8 /nobreak >nul

REM =====================================================
REM FINAL STATUS CHECK
REM =====================================================
echo.
echo =====================================================
echo  PM2 STATUS:
echo =====================================================
call pm2 status
echo.

REM Check port 5000
netstat -aon 2>nul | find ":5000" >nul
if errorlevel 1 (
    echo.
    echo =====================================================
    echo  WARNING: Port 5000 not responding yet!
    echo =====================================================
    echo.
    echo  Last 30 error lines:
    echo.
    call pm2 logs billing_system --err --lines 30
    echo.
    echo =====================================================
    echo  TO FIX:
    echo  1. Check .env:   type D:\Benesys\.env
    echo  2. Full logs:    pm2 logs billing_system
    echo  3. Restart:      pm2 restart billing_system --update-env
    echo =====================================================
    pause
    exit /b 1
)

echo.
echo =====================================================
echo  SUCCESS! BILLING SYSTEM IS RUNNING!
echo =====================================================
echo.
echo  Browser:   http://localhost:5000
echo  Database:  Supabase Cloud PostgreSQL
echo.
echo  Login:
echo    Username: admin
echo    Password: admin@123
echo.
echo  Useful Commands:
echo    pm2 status                     - Check status
echo    pm2 logs billing_system        - View logs
echo    pm2 logs billing_system --err  - View errors only
echo    pm2 restart billing_system     - Restart server
echo    pm2 stop billing_system        - Stop server
echo.
echo  Close this window - server keeps running 24/7!
echo =====================================================
echo.
timeout /t 5 /nobreak >nul
exit /b 0
