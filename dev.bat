@echo off
REM Development Mode - Hot Reload with Vite
REM Start this batch file to run the app in development mode
REM The app will be available at http://localhost:5000

echo.
echo ===============================================
echo BILLING & INVENTORY MANAGEMENT SYSTEM
echo Development Mode (Hot Reload)
echo ===============================================
echo.
echo Starting development server...
echo App will be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the development server
npm run dev

pause
