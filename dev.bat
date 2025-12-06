@echo off
REM Development Mode - Hot Reload with Vite
REM Start this batch file to run the app in development mode
REM You can specify a custom port as a parameter: dev.bat 8080
REM Or set PORT environment variable: set PORT=8080 && dev.bat

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
echo Development Mode (Hot Reload)
echo ===============================================
echo.
echo Starting development server on port %PORT%...
echo App will be available at: http://localhost:%PORT%
echo.
echo To use a different port next time:
echo   - Run as: dev.bat 8080
echo   - Or set: set PORT=8080 ^&^& dev.bat
echo.
echo Press Ctrl+C to stop the server
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the development server with custom port
set PORT=%PORT%
npm run dev

pause
