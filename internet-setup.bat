@echo off
setlocal enabledelayedexpansion

REM INTERNET ACCESS SETUP - Access your app from anywhere via Cloudflare Tunnel
REM This script helps you set up secure internet access to your billing system

cd /d "%~dp0"

echo.
echo ========================================
echo INTERNET ACCESS SETUP
echo ========================================
echo.
echo This will allow you to access your billing system
echo from anywhere in the world via the internet.
echo.
echo Requirements:
echo 1. Cloudflare account (free at cloudflare.com)
echo 2. A domain name (optional but recommended)
echo 3. cloudflared installed on Windows
echo.
echo ========================================
echo.

REM Check if cloudflared is installed
where cloudflared >nul 2>&1
if errorlevel 1 (
    echo cloudflared is NOT installed!
    echo.
    echo Please install cloudflared first:
    echo.
    echo Option 1 - Download installer:
    echo   https://github.com/cloudflare/cloudflared/releases/latest
    echo   Download: cloudflared-windows-amd64.msi
    echo.
    echo Option 2 - Using winget:
    echo   winget install cloudflare.cloudflared
    echo.
    echo After installing, run this script again.
    echo.
    pause
    exit /b 1
)

echo cloudflared is installed!
echo.

REM Check if already logged in
echo Checking Cloudflare login status...
cloudflared tunnel list >nul 2>&1
if errorlevel 1 (
    echo.
    echo You need to login to Cloudflare first.
    echo A browser window will open - login with your Cloudflare account.
    echo.
    pause
    cloudflared tunnel login
    if errorlevel 1 (
        echo Login failed. Please try again.
        pause
        exit /b 1
    )
)

echo Cloudflare login verified!
echo.

REM Check if tunnel already exists
echo Checking for existing tunnel...
cloudflared tunnel list 2>nul | find "billing-system" >nul
if not errorlevel 1 (
    echo.
    echo Tunnel "billing-system" already exists!
    echo.
    set /p RECREATE="Delete and recreate tunnel? (y/n): "
    if /i "!RECREATE!"=="y" (
        cloudflared tunnel delete billing-system
    ) else (
        goto CONFIGURE_TUNNEL
    )
)

REM Create new tunnel
echo.
echo Creating new Cloudflare Tunnel...
cloudflared tunnel create billing-system
if errorlevel 1 (
    echo Failed to create tunnel. Please check your Cloudflare account.
    pause
    exit /b 1
)

:CONFIGURE_TUNNEL
echo.
echo Tunnel created/verified successfully!
echo.

REM Get tunnel ID
for /f "tokens=1" %%a in ('cloudflared tunnel list 2^>nul ^| find "billing-system"') do set TUNNEL_ID=%%a
echo Tunnel ID: %TUNNEL_ID%
echo.

REM Ask for domain
echo.
echo ========================================
echo DOMAIN CONFIGURATION
echo ========================================
echo.
echo You need to add your domain to Cloudflare first.
echo (Go to cloudflare.com and add your domain as a website)
echo.
echo Example: If you own "mycompany.com", you can use:
echo   billing.mycompany.com
echo.
set /p DOMAIN="Enter your subdomain (e.g., billing.mycompany.com): "

if "%DOMAIN%"=="" (
    echo No domain entered. Using default tunnel URL.
    echo You'll need to configure DNS manually later.
    set DOMAIN=billing-system
)

REM Create config file
echo.
echo Creating tunnel configuration...
(
    echo tunnel: %TUNNEL_ID%
    echo credentials-file: %USERPROFILE%\.cloudflared\%TUNNEL_ID%.json
    echo.
    echo ingress:
    echo   - hostname: %DOMAIN%
    echo     service: http://localhost:5000
    echo   - service: http_status:404
) > "%USERPROFILE%\.cloudflared\config.yml"

echo Configuration saved to: %USERPROFILE%\.cloudflared\config.yml
echo.

REM Route DNS
echo.
echo Configuring DNS routing...
cloudflared tunnel route dns billing-system %DOMAIN%
if errorlevel 1 (
    echo.
    echo DNS routing failed. You may need to:
    echo 1. Add your domain to Cloudflare first
    echo 2. Configure DNS manually in Cloudflare dashboard
    echo.
)

REM Update .env for internet access
echo.
echo Updating environment for internet access...
echo ENABLE_INTERNET_ACCESS=true >> .env
echo.

REM Create tunnel start script
echo.
echo Creating tunnel startup script...
(
    echo @echo off
    echo cd /d "%%~dp0"
    echo echo Starting Cloudflare Tunnel...
    echo cloudflared tunnel run billing-system
) > start-tunnel.bat

echo.
echo ========================================
echo SETUP COMPLETE!
echo ========================================
echo.
echo Your internet access is configured!
echo.
echo To start internet access:
echo 1. First start the app: PRODUCTION-START.bat
echo 2. Then start tunnel: start-tunnel.bat
echo.
echo Your app will be available at:
echo   https://%DOMAIN%
echo.
echo For automatic tunnel startup, run as Administrator:
echo   cloudflared service install
echo.
echo ========================================
echo.
pause
