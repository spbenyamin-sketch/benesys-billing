@echo off
setlocal enabledelayedexpansion

cd /d E:\VfpNextConverter

echo ========================================
echo PM2 DIAGNOSTIC CHECK
echo ========================================
echo.

echo [1] Checking PM2 installation...
pm2 -v
if errorlevel 1 (
    echo ERROR: PM2 not installed or not in PATH
    echo Run: npm install -g pm2
    pause
    exit /b 1
)
echo.

echo [2] Listing PM2 processes...
pm2 list
echo.

echo [3] Checking PM2 status...
pm2 status
echo.

echo [4] Checking Node.js and npm...
echo Node version:
node --version
echo npm version:
npm --version
echo.

echo [5] Checking if dist folder and files exist...
if exist "dist\" (
    echo ✓ dist folder FOUND
    if exist "dist\index.js" (
        echo ✓ dist\index.js FOUND (BUILD OK)
    ) else (
        echo ✗ dist\index.js NOT FOUND
        echo Please run: npm run build
        echo.
        pause
        exit /b 1
    )
) else (
    echo ✗ dist folder NOT FOUND
    echo Please run: npm run build
    echo.
    pause
    exit /b 1
)
echo.

echo [6] Checking if port 5000 is in use...
netstat -aon 2^>nul | find ":5000" | find /c "LISTENING" >nul
if errorlevel 1 (
    echo - Port 5000 is not currently in use
) else (
    echo ✓ Port 5000 is in use
)
echo.

echo [7] Viewing recent PM2 logs (last 20 lines)...
echo ========================================
pm2 logs billing_system --lines 20
echo ========================================
echo.

echo ========================================
echo QUICK FIX OPTIONS:
echo ========================================
echo Option A - Stop and restart PM2:
echo   pm2 delete all
echo   pm2 start npm --name billing_system -- start
echo   pm2 status
echo.
echo Option B - View live logs:
echo   pm2 logs billing_system
echo.
echo Option C - Rebuild and restart:
echo   npm run build
echo   pm2 restart all
echo.
pause
