@echo off
echo.
echo ========================================
echo Checking .env file...
echo ========================================
echo.

if exist .env (
    echo .env file EXISTS. Contents:
    echo.
    type .env
    echo.
) else (
    echo ERROR: .env file NOT FOUND!
    echo.
    echo Creating .env now...
    (
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/billing_system
        echo NODE_ENV=development
    ) > .env
    echo .env created successfully!
    echo.
    echo Contents:
    type .env
)

echo.
echo ========================================
pause
