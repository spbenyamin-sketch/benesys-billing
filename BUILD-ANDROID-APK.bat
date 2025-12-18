@echo off
setlocal enabledelayedexpansion

REM ========================================
REM BUILD ANDROID APK - Benesys Billing System
REM ========================================
echo.
echo ========================================
echo ANDROID APK BUILD SCRIPT
echo ========================================
echo.

cd /d E:\VfpNextConverter

REM Check if Android SDK is installed
echo Checking Android SDK...
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
        echo Found Android SDK at: !ANDROID_HOME!
    ) else (
        echo.
        echo ERROR: Android SDK not found!
        echo.
        echo Please install Android Studio from:
        echo https://developer.android.com/studio
        echo.
        echo After installation, set ANDROID_HOME environment variable
        echo Default location: %LOCALAPPDATA%\Android\Sdk
        echo.
        pause
        exit /b 1
    )
) else (
    echo Android SDK found at: %ANDROID_HOME%
)
echo.

REM Step 1: Build the web app
echo [1/4] Building web application...
call npm run build
if errorlevel 1 (
    echo ERROR: Web build failed
    pause
    exit /b 1
)
echo Web build complete.
echo.

REM Step 2: Copy web assets to Android
echo [2/4] Copying web assets to Android...
call npx cap copy android
if errorlevel 1 (
    echo ERROR: Failed to copy assets
    pause
    exit /b 1
)
echo Assets copied.
echo.

REM Step 3: Sync Capacitor
echo [3/4] Syncing Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Capacitor sync failed
    pause
    exit /b 1
)
echo Sync complete.
echo.

REM Step 4: Build APK using Gradle
echo [4/4] Building APK...
echo This may take several minutes on first build...
echo.

cd android

REM Build debug APK
call gradlew.bat assembleDebug
if errorlevel 1 (
    echo.
    echo ERROR: Gradle build failed
    echo.
    echo Troubleshooting:
    echo 1. Make sure Java JDK 17+ is installed
    echo 2. Set JAVA_HOME environment variable
    echo 3. Install Android Studio Build Tools
    echo.
    cd ..
    pause
    exit /b 1
)

cd ..

REM Copy APK to root folder
echo.
echo Copying APK to project folder...
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy "android\app\build\outputs\apk\debug\app-debug.apk" "BenesysBilling.apk" /Y
    echo.
    echo ========================================
    echo SUCCESS! APK CREATED
    echo ========================================
    echo.
    echo APK Location: BenesysBilling.apk
    echo.
    echo To install on your Android phone:
    echo 1. Copy BenesysBilling.apk to your phone
    echo 2. Enable "Install from Unknown Sources" in settings
    echo 3. Open the APK file to install
    echo.
) else (
    echo.
    echo APK file not found at expected location.
    echo Check android\app\build\outputs\apk\debug\ folder
    echo.
)

pause
exit /b 0
