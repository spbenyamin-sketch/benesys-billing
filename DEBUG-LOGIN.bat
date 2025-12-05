@echo off
REM This script helps debug login issues on Windows
REM Run this BEFORE running PRODUCTION-START.bat

setlocal enabledelayedexpansion

cd /d E:\VfpNextConverter

echo.
echo ========================================
echo LOGIN DEBUG CHECKER
echo ========================================
echo.

echo Checking critical files...
echo.

REM Check .env file
if exist ".env" (
    echo ✓ .env file exists
    echo.
    echo Contents:
    type .env
    echo.
) else (
    echo ✗ ERROR: .env file NOT FOUND!
    echo.
)

echo.
echo ========================================
echo BROWSER DEVELOPER TOOLS
echo ========================================
echo.
echo To debug the login issue:
echo.
echo 1. Open http://localhost:5000 in browser
echo 2. Press F12 to open Developer Tools
echo 3. Go to Console tab
echo 4. Type login: admin / admin@123
echo 5. Look for [LOGIN] messages in the console
echo.
echo Expected console output should show:
echo   [LOGIN] Sending fetch with payload...
echo   [LOGIN] Current URL...
echo   [LOGIN] ✅ Fetch returned!
echo.
echo If you DON'T see these messages:
echo   - The frontend code might be old
echo   - Try: npm run build
echo   - Then restart PM2
echo.
echo 6. Also check Network tab:
echo   - Look for POST /api/login request
echo   - Check Response tab to see server response
echo.
echo ========================================
echo.

echo To get the latest code from Replit:
echo.
echo Option A: Rebuild locally (RECOMMENDED)
echo   1. npm install
echo   2. npm run build
echo   3. pm2 restart billing_system
echo.
echo Option B: Manual copy (if rebuild fails)
echo   1. Get the dist\ folder from Replit
echo   2. Replace your local dist\ folder
echo   3. pm2 restart billing_system
echo.

pause
