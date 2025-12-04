@echo off
REM Complete startup for Windows - Billing System

cd /d E:\VfpNextConverter

echo.
echo ========================================
echo Billing System - Startup
echo ========================================
echo.

REM Create .env if missing
if not exist .env (
    echo Creating .env file...
    (
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/billing_system
        echo NODE_ENV=development
    ) > .env
    echo .env created!
    echo.
)

REM Display .env for verification
echo Current .env configuration:
type .env
echo.

REM Set environment variables for this process
set NODE_ENV=development
for /f "tokens=1,2 delims==" %%A in (.env) do (
    if "%%A"=="DATABASE_URL" set "DATABASE_URL=%%B"
    if "%%A"=="NODE_ENV" set "NODE_ENV=%%B"
)

echo ========================================
echo Starting Server...
echo ========================================
echo Database: %DATABASE_URL%
echo Node Env: %NODE_ENV%
echo.
echo Open browser: http://localhost:5000
echo.

npx tsx server/index-dev.ts

pause
