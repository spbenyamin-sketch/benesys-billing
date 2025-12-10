@echo off
REM Install dependencies for BeneSys Print Service
setlocal enabledelayedexpansion
echo ===================================
echo BeneSys Print Service Setup
echo ===================================
echo.
echo Installing required Python packages...
echo.

REM Upgrade pip first
echo [1/4] Upgrading pip...
python -m pip install --upgrade pip
if errorlevel 1 goto error

REM Install websocket-client
echo [2/4] Installing websocket-client...
python -m pip install websocket-client
if errorlevel 1 goto error

REM Install pywin32 with post-install script
echo [3/4] Installing pywin32 (this may take a moment)...
python -m pip install pywin32
if errorlevel 1 goto error

REM Run pywin32 post-install
echo [4/4] Completing pywin32 setup...
python -m pywin32_postinstall -install
if errorlevel 1 (
    echo.
    echo Note: pywin32 post-install skipped (not critical)
)

echo.
echo ===================================
echo Installation Complete!
echo ===================================
echo.
echo NEXT STEPS:
echo 1. Go to BeneSys app: Settings ^> Bill Settings ^> Quick Print tab
echo 2. Click "Generate New Token" and copy the token
echo 3. Open benesys_print_service.py in Notepad
echo 4. Find: SERVER_URL = "wss://YOUR-REPLIT-URL..."
echo 5. Replace with your app URL ^(look at browser address bar^)
echo    Example: wss://myapp-12345.replit.dev/ws/print
echo 6. Find: PRINT_TOKEN = "YOUR-TOKEN-HERE"
echo 7. Paste your token between the quotes
echo 8. Save the file
echo 9. Run in Command Prompt: python benesys_print_service.py
echo.
pause
goto :eof

:error
echo.
echo ERROR: Installation failed!
echo Please check your internet connection and try again.
echo If problems persist, try:
echo   python -m pip install --upgrade pip
echo   python -m pip install websocket-client pywin32
echo.
pause
exit /b 1
