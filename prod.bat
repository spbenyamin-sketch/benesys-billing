@echo off
REM Production Mode - PM2 Process Manager
REM This batch file sets up the app to run 24/7 with PM2
REM You can specify a custom port as a parameter: prod.bat 8080
REM Or set PORT environment variable: set PORT=8080 && prod.bat

setlocal enabledelayedexpansion

REM Get port from command line argument or environment variable
if not "%~1"=="" (
    set PORT=%~1
) else if "%PORT%"=="" (
    set PORT=5000
)

echo.
echo ===============================================
echo BILLING & INVENTORY MANAGEMENT SYSTEM
echo Production Mode (PM2 24/7)
echo ===============================================
echo.
echo Using port: %PORT%
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if PM2 is installed globally
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo PM2 not found. Installing PM2 globally...
    call npm install -g pm2
    echo.
)

REM Build the project
echo Building project...
call npm run build
if errorlevel 1 (
    echo Build failed. Please check the error messages above.
    pause
    exit /b 1
)
echo.

REM Start with PM2
echo Starting application with PM2 on port %PORT%...
set PORT=%PORT%
call pm2 start "npm run start" --name "billing-system" --max-memory-restart 1G

echo.
echo ===============================================
echo Application started successfully!
echo ===============================================
echo.
echo App available at: http://localhost:%PORT%
echo.
echo To use a different port next time:
echo   - Run as: prod.bat 8080
echo   - Or set: set PORT=8080 ^&^& prod.bat
echo.
echo Useful Commands:
echo   - View logs:     pm2 logs billing-system
echo   - Stop app:      pm2 stop billing-system
echo   - Restart app:   pm2 restart billing-system
echo   - Remove app:    pm2 delete billing-system
echo   - Status:        pm2 status
echo.
echo Press any key to continue...
pause

REM Show PM2 status
pm2 status
