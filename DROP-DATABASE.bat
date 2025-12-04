@echo off
REM Drop and recreate billing_system database - USE ONLY IF SETUP FAILS
REM This will DELETE all data and start fresh!

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
echo Dropping old database...
(
    echo DROP DATABASE IF EXISTS billing_system;
    echo CREATE DATABASE billing_system;
) | psql -U postgres -h localhost -p 5432 postgres

if errorlevel 1 (
    echo.
    echo ERROR: Could not recreate database!
    echo Make sure PostgreSQL is running and user "postgres" exists.
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
