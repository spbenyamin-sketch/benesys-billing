@echo off
setlocal enabledelayedexpansion

cd /d E:\VfpNextConverter

echo ========================================
echo PM2 DIAGNOSTIC CHECK
echo ========================================
echo.

echo [1] Checking PM2 installation...
pm2 -v
echo.

echo [2] Listing PM2 processes...
pm2 list
echo.

echo [3] Checking recent PM2 logs...
pm2 logs --lines 30
echo.

echo [4] Checking if dist folder exists...
if exist "dist\" (
    echo ✓ dist folder FOUND
    if exist "dist\index.js" (
        echo ✓ dist\index.js FOUND
    ) else (
        echo ✗ dist\index.js NOT FOUND - Need to rebuild
    )
) else (
    echo ✗ dist folder NOT FOUND - Need to run: npm run build
)
echo.

echo [5] Checking Node.js...
node --version
npm --version
echo.

echo [6] Checking port 5000...
netstat -aon | find ":5000"
echo.

echo ========================================
echo NEXT STEPS:
echo ========================================
echo If dist folder is missing, run:
echo   npm run build
echo.
echo If dist\index.js exists, try restart:
echo   pm2 delete all
echo   pm2 start "cmd /c set NODE_ENV=production && node dist/index.js" --name billing_system
echo   pm2 status
echo.
echo To view logs in real-time:
echo   pm2 logs billing_system
echo.
pause
