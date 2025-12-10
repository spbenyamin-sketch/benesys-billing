@echo off
REM Install dependencies for BeneSys Print Service
echo Installing required Python packages...
echo.

python -m pip install --upgrade pip
python -m pip install websocket-client
python -m pip install pywin32

echo.
echo ===================================
echo Installation Complete!
echo ===================================
echo.
echo Next steps:
echo 1. Go back to BeneSys app > Settings > Bill Settings > Quick Print tab
echo 2. Click "Generate New Token" and copy the token
echo 3. Open benesys_print_service.py in Notepad
echo 4. Find the line: PRINT_TOKEN = "YOUR-TOKEN-HERE"
echo 5. Replace with your token and save
echo 6. Run: python benesys_print_service.py
echo.
pause
