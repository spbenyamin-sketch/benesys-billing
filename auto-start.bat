@echo off
cd /d "%~dp0"
pm2 restart benesys
if errorlevel 1 (
    pm2 start "npm run dev" --name "benesys"
)
pause
