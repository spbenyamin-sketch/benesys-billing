@echo off
REM Start Cloudflare Tunnel for internet access
cd /d "%~dp0"

echo.
echo ========================================
echo Starting Cloudflare Tunnel
echo ========================================
echo.
echo This will expose your local app to the internet.
echo Keep this window open while you need internet access.
echo.
echo Press Ctrl+C to stop the tunnel.
echo.
echo ========================================
echo.

cloudflared tunnel run billing-system

echo.
echo Tunnel stopped.
pause
