@echo off
REM BeneSys Print Service - One-Click Installation
REM This script installs all required Python dependencies

echo.
echo ================================================
echo   BeneSys Print Service - Dependency Installer
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python 3.8+ from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo [1/4] Upgrading pip...
python -m pip install --upgrade pip
if errorlevel 1 goto error

echo.
echo [2/4] Installing websocket-client...
python -m pip install websocket-client
if errorlevel 1 goto error

echo.
echo [3/4] Installing pywin32 and Pillow...
python -m pip install pywin32 Pillow
if errorlevel 1 goto error

echo.
echo [4/4] Registering pywin32 COM objects...
python -m pywin32_postinstall -install
if errorlevel 1 (
    echo WARNING: pywin32_postinstall had issues, but libraries may still work
)

echo.
echo ================================================
echo   Installation Complete!
echo ================================================
echo.
echo NEXT STEPS:
echo 1. Download benesys_print_service.py from Bill Settings
echo 2. Edit these lines in the file:
echo    - SERVER_URL = "your-replit-url"
echo    - PRINT_TOKEN = "your-token-from-bill-settings"
echo.
echo 3. Run: python benesys_print_service.py
echo.
echo 4. To run automatically at startup:
echo    - Run: setup_autostart.bat
echo.
pause
exit /b 0

:error
echo.
echo ================================================
echo   ERROR: Installation Failed
echo ================================================
echo.
echo Please try these steps:
echo 1. Open Command Prompt as Administrator
echo 2. Run this batch file again
echo 3. If still failing, run manually:
echo    python -m pip install websocket-client pywin32 Pillow
echo    python -m pywin32_postinstall -install
echo.
pause
exit /b 1
