@echo off
REM Quick fix for "errorMissingColumn" database errors
REM Run this if PRODUCTION-START.bat fails with "Server may not be responding"

echo.
echo ========================================
echo DATABASE RECOVERY - SCHEMA FIX
echo ========================================
echo.
echo This script will add any missing columns to your database
echo that may have been added in recent updates.
echo.

REM Verify PostgreSQL is running
echo Checking PostgreSQL connection...
netstat -aon 2>nul | find ":5432" >nul
if errorlevel 1 (
    echo.
    echo ERROR: PostgreSQL does not appear to be running on port 5432
    echo Make sure PostgreSQL is started before running this script
    echo.
    pause
    exit /b 1
)
echo PostgreSQL is running.
echo.

REM Run recovery script
echo Running schema recovery script...
echo.
psql -U postgres -d billing_system -f RECOVERY-DATABASE.sql
if errorlevel 1 (
    echo.
    echo ERROR: Recovery script failed
    echo Make sure:
    echo  1. PostgreSQL is running
    echo  2. Database "billing_system" exists
    echo  3. You have proper database credentials set
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS: Database schema has been fixed!
echo ========================================
echo.
echo You can now run PRODUCTION-START.bat again
echo.
pause
exit /b 0
