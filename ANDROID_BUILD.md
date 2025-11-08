# Android APK Build Guide

This guide explains how to convert your Next.js PWA into an Android APK using Capacitor.

## Prerequisites

1. **Node.js** (18+)
2. **Java JDK** (11 or 17)
   - Download from [Oracle](https://www.oracle.com/java/technologies/downloads/) or [OpenJDK](https://adoptium.net/)
   - Verify: `java -version`
3. **Android Studio**
   - Download from [Android Studio](https://developer.android.com/studio)
   - Install Android SDK (API 33+)
   - Set up Android SDK path in environment variables

4. **Android SDK Environment Variables**
   - Add to your `~/.zshrc` or `~/.bashrc`:
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk
     export PATH=$PATH:$ANDROID_HOME/emulator
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/tools/bin
     ```

## Setup Steps

### 1. Build Next.js App

First, build your Next.js app for static export:

```bash
npm run build
```

This will create an `out/` directory with static files.

### 2. Initialize Capacitor (if not already done)

```bash
npx cap init
```

When prompted:
- **App name**: Innovat Eats
- **App ID**: com.innovateats.app
- **Web directory**: out

### 3. Add Android Platform

```bash
npm run cap:add:android
```

Or manually:
```bash
npx cap add android
```

### 4. Sync Web Assets

After building, sync your web assets to the Android project:

```bash
npm run cap:sync
```

Or manually:
```bash
npx cap sync
```

## Building the APK

### Option 1: Using Android Studio (Recommended)

1. **Open Android Studio**:
   ```bash
   npm run cap:open:android
   ```
   Or manually:
   ```bash
   npx cap open android
   ```

2. **Wait for Gradle Sync**:
   - Android Studio will automatically sync Gradle
   - Wait for "Gradle sync finished" message

3. **Build APK**:
   - Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Wait for build to complete
   - Click **locate** to find your APK
   - APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Install on Device**:
   - Connect your Android device via USB
   - Enable **USB Debugging** in Developer Options
   - Click **Run** (green play button) in Android Studio
   - Or drag and drop APK to your device

### Option 2: Using Command Line

1. **Navigate to Android directory**:
   ```bash
   cd android
   ```

2. **Build Debug APK**:
   ```bash
   ./gradlew assembleDebug
   ```

3. **Find APK**:
   - Location: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Install on Device**:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

## Building Release APK (For Distribution)

### 1. Generate Keystore

```bash
keytool -genkey -v -keystore innovateats-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias innovateats
```

**Important**: Save the keystore file and passwords securely!

### 2. Configure Signing

1. Create `android/key.properties`:
   ```properties
   storePassword=YOUR_STORE_PASSWORD
   keyPassword=YOUR_KEY_PASSWORD
   keyAlias=innovateats
   storeFile=../innovateats-release-key.jks
   ```

2. Update `android/app/build.gradle`:
   ```gradle
   def keystorePropertiesFile = rootProject.file("key.properties")
   def keystoreProperties = new Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }

   android {
       ...
       signingConfigs {
           release {
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
               storeFile file(keystoreProperties['storeFile'])
               storePassword keystoreProperties['storePassword']
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

### 3. Build Release APK

```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

## Updating the App

After making changes to your Next.js app:

1. **Rebuild**:
   ```bash
   npm run build
   ```

2. **Sync with Capacitor**:
   ```bash
   npm run cap:sync
   ```

3. **Rebuild APK** in Android Studio or command line

## Troubleshooting

### Build Fails

1. **Check Java Version**:
   ```bash
   java -version
   ```
   Should be Java 11 or 17

2. **Check Android SDK**:
   - Open Android Studio
   - Go to **Tools** → **SDK Manager**
   - Ensure Android SDK Platform 33+ is installed

3. **Clean Build**:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

### Camera Not Working

1. **Check Permissions**:
   - Ensure `AndroidManifest.xml` has camera permission:
     ```xml
     <uses-permission android:name="android.permission.CAMERA" />
     ```

2. **Check Capacitor Config**:
   - Verify `capacitor.config.ts` has Camera plugin configured

### App Crashes on Launch

1. **Check Logs**:
   ```bash
   adb logcat
   ```

2. **Verify Build**:
   - Ensure `npm run build` completed successfully
   - Check `out/` directory exists and has files

### Firebase Not Working

1. **Check Environment Variables**:
   - Ensure Firebase config is set in `capacitor.config.ts` or build-time
   - For production, use environment variables during build

2. **Check Network**:
   - Ensure app has internet permission in `AndroidManifest.xml`

## Quick Build Script

Add this to `package.json` for quick builds:

```json
{
  "scripts": {
    "android:build": "npm run build && npx cap sync && cd android && ./gradlew assembleDebug",
    "android:release": "npm run build && npx cap sync && cd android && ./gradlew assembleRelease"
  }
}
```

Then run:
```bash
npm run android:build
```

## Distribution

### Internal Testing

1. Upload APK to Google Drive or similar
2. Share link with testers
3. They can download and install directly

### Google Play Store

1. Build release APK or AAB (Android App Bundle)
2. Create Google Play Console account
3. Upload APK/AAB
4. Fill in store listing
5. Submit for review

### Direct Distribution

- Share APK file directly
- Users need to enable "Install from Unknown Sources"
- Not recommended for production

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

