# Android APK Build Guide - Benesys Billing System

## Prerequisites

Before building the Android APK, you need to install the following on your Windows PC:

### 1. Java Development Kit (JDK 17+)
- Download from: https://adoptium.net/
- Install and set `JAVA_HOME` environment variable
- Add `%JAVA_HOME%\bin` to your PATH

### 2. Android Studio
- Download from: https://developer.android.com/studio
- During installation, make sure to install:
  - Android SDK
  - Android SDK Platform-Tools
  - Android SDK Build-Tools
- Set `ANDROID_HOME` environment variable to: `C:\Users\YourName\AppData\Local\Android\Sdk`

### 3. Verify Installation
Open Command Prompt and run:
```cmd
java -version
echo %JAVA_HOME%
echo %ANDROID_HOME%
```

## Building the APK

### Option 1: Using the Build Script (Recommended)
1. Double-click `BUILD-ANDROID-APK.bat`
2. Wait for the build to complete (5-10 minutes first time)
3. Find `BenesysBilling.apk` in the project folder

### Option 2: Manual Build
```cmd
REM Build web app
npm run build

REM Copy to Android
npx cap copy android
npx cap sync android

REM Build APK
cd android
gradlew.bat assembleDebug
cd ..

REM APK will be at: android\app\build\outputs\apk\debug\app-debug.apk
```

## Installing on Android Phone

1. **Copy APK to phone** - Use USB cable or cloud storage
2. **Enable Unknown Sources**:
   - Go to Settings > Security
   - Enable "Install from Unknown Sources" or "Install unknown apps"
3. **Open the APK file** and tap Install
4. **Open the app** - Look for "Benesys Billing" icon

## Important Notes

### Server Connection
The mobile app needs to connect to your billing server:
- The app is configured to work with `http://localhost:5000`
- For mobile access, your phone must be on the same network as the server
- Update the server URL if needed in the app settings

### Offline Mode
- The app includes PWA capabilities for basic offline viewing
- Full functionality requires server connection for database operations

## Troubleshooting

### Build Errors

**"JAVA_HOME not set"**
```cmd
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot
```

**"Android SDK not found"**
```cmd
set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
```

**"Gradle build failed"**
- Open Android Studio
- Go to File > Sync Project with Gradle Files
- Or run: `cd android && gradlew.bat clean`

### App Won't Connect to Server
1. Make sure the billing server is running (`pm2 status`)
2. Ensure phone is on same WiFi network as server
3. Use server's local IP address instead of localhost
   - Find IP: `ipconfig` and look for IPv4 Address
   - Example: `http://192.168.1.100:5000`

## Updating the App

When you update the billing system:
1. Run `BUILD-ANDROID-APK.bat` again
2. Copy new APK to phone
3. Install over existing app (data is on server, not phone)

## Release Build (For Production)

For a signed release APK (required for Play Store):
1. Generate a keystore file
2. Configure signing in `android/app/build.gradle`
3. Run: `gradlew.bat assembleRelease`

Contact your developer for release signing setup.
