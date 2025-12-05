@echo off
REM Drop and recreate billing_system database - USE ONLY IF SETUP FAILS
REM This will DELETE all data and start fresh!

cd /d E:\VfpNextConverter

echo.
echo ========================================
echo WARNING: DATABASE CLEANUP
echo ========================================
echo.
echo This will DELETE the entire "billing_system" database
echo and create a fresh empty database.
echo.
echo ALL DATA WILL BE LOST!
echo.

set /p CONFIRM="Type 'YES' to continue (anything else cancels): "
if /i not "%CONFIRM%"=="YES" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Dropping and recreating database...
call node drop-db.js

if errorlevel 1 (
    echo.
    echo ERROR: Could not recreate database!
    echo Make sure PostgreSQL is running.
    echo.
) else (
    echo.
    echo ========================================
    echo SUCCESS: Database recreated!
    echo ========================================
    echo.
    echo Now run: FINAL-START.bat
    echo.
)

pause
