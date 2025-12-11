@echo off
REM BeneSys Print Service - Automatic Startup Setup
REM This script configures Windows Task Scheduler to run the print service at startup

echo.
echo ================================================
echo   BeneSys Print Service - Auto-Start Setup
echo ================================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set PYTHON_SCRIPT=%SCRIPT_DIR%benesys_print_service.py
set VBS_RUNNER=%SCRIPT_DIR%run_benesys_print_service.vbs

echo Checking if benesys_print_service.py exists...
if not exist "%PYTHON_SCRIPT%" (
    echo ERROR: benesys_print_service.py not found in:
    echo %PYTHON_SCRIPT%
    echo.
    echo Please make sure benesys_print_service.py is in the same folder as this batch file.
    pause
    exit /b 1
)

echo Creating silent runner script...
(
echo Set objShell = CreateObject("WScript.Shell"^)
echo objShell.Run "python.exe """ & "%PYTHON_SCRIPT%" & """", 0, False
) > "%VBS_RUNNER%"

echo Creating Windows Task Scheduler task...
echo.

REM Create the task to run at startup
tasksched.msc /s >nul 2>&1

REM Delete old task if it exists
taskkill /f /im python.exe 2>nul

schtasks /delete "BeneSys Print Service" /f >nul 2>&1

REM Create new task
schtasks /create /tn "BeneSys Print Service" /tr "wscript.exe \"%VBS_RUNNER%\"" /sc onstart /ru SYSTEM /f

if errorlevel 1 (
    echo.
    echo ERROR: Failed to create scheduled task
    echo Please try running this batch file as Administrator
    pause
    exit /b 1
)

echo.
echo ================================================
echo   Setup Complete!
echo ================================================
echo.
echo VERIFICATION:
echo The following files were created:
echo - run_benesys_print_service.vbs (silent runner)
echo.
echo Your print service is now configured to:
echo 1. Start automatically when Windows boots
echo 2. Run silently in the background
echo 3. No console window will appear
echo.
echo To verify it's working:
echo 1. Restart your computer
echo 2. Open BeneSys app and try to print
echo 3. Invoice should print to your BRETHINK TP600
echo.
echo To stop the service:
echo - Open Task Scheduler
echo - Find "BeneSys Print Service"
echo - Right-click and disable/delete
echo.
echo TROUBLESHOOTING:
echo If it doesn't work after restart:
echo 1. Open Command Prompt as Administrator
echo 2. Run: schtasks /query /tn "BeneSys Print Service"
echo 3. If not listed, run this batch file again as Administrator
echo.
pause
exit /b 0
