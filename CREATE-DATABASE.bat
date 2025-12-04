@echo off
REM Simple script to create the billing_system database
REM Run this BEFORE running FINAL-START.bat if you get database errors

echo.
echo ========================================
echo Billing System - Database Creator
echo ========================================
echo.
echo This will create the "billing_system" database in PostgreSQL
echo Make sure PostgreSQL is running on your computer!
echo.

REM Create the database
echo Creating database "billing_system"...
(
    echo CREATE DATABASE billing_system;
) | psql -U postgres -h localhost -p 5432 postgres

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Could not create database!
    echo ========================================
    echo.
    echo Possible causes:
    echo 1. PostgreSQL is not running
    echo    - Open Services.msc (services app)
    echo    - Find "PostgreSQL" service
    echo    - Right-click and select "Start"
    echo.
    echo 2. Database already exists (this is OK - continue)
    echo.
    echo 3. Default user "postgres" doesn't exist
    echo    - When installing PostgreSQL, use password: postgres
    echo.
) else (
    echo.
    echo ========================================
    echo SUCCESS: Database created!
    echo ========================================
    echo.
)

echo Database should now be ready.
echo You can now run FINAL-START.bat
echo.
pause
