@echo off
REM Production Mode - PM2 Process Manager
REM This batch file sets up the app to run 24/7 with PM2

echo.
echo ===============================================
echo BILLING & INVENTORY MANAGEMENT SYSTEM
echo Production Mode (PM2 24/7)
echo ===============================================
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
echo Starting application with PM2...
call pm2 start "npm run start" --name "billing-system" --max-memory-restart 1G

echo.
echo ===============================================
echo Application started successfully!
echo ===============================================
echo.
echo App available at: http://localhost:5000
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
