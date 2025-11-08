# iOS App Build Guide

This guide explains how to build your Next.js PWA as an iOS app using Capacitor.

## Prerequisites

1. **macOS** - iOS builds can only be done on macOS
2. **Xcode** (latest version)
   - Download from [App Store](https://apps.apple.com/us/app/xcode/id497799835)
   - Install Command Line Tools: `xcode-select --install`
3. **CocoaPods**
   - Install: `sudo gem install cocoapods`
   - Verify: `pod --version`
4. **Apple Developer Account** (for device testing and App Store distribution)
   - Free account works for simulator and device testing
   - Paid account ($99/year) required for App Store distribution

## Setup Steps

### 1. Install Xcode

1. Open App Store on your Mac
2. Search for "Xcode"
3. Install Xcode (this may take a while)
4. Open Xcode and accept the license agreement
5. Install additional components when prompted

### 2. Install Command Line Tools

```bash
xcode-select --install
```

### 3. Install CocoaPods

```bash
sudo gem install cocoapods
```

Verify installation:
```bash
pod --version
```

### 4. Build Next.js App

```bash
npm run build
```

This creates the `out/` directory with static files.

### 5. Sync with Capacitor

```bash
npx cap sync ios
```

This copies your web assets to the iOS project.

### 6. Install CocoaPods Dependencies

```bash
cd ios/App
pod install
cd ../..
```

## Building the iOS App

### Option 1: Command Line Build (No Xcode GUI Required) ⚡

**Build for iOS Simulator (no Xcode GUI needed):**
```bash
npm run ios:build:cli
```

This will:
1. Build your Next.js app
2. Sync with Capacitor
3. Install CocoaPods dependencies
4. Build using `xcodebuild` command line (Xcode must be installed but doesn't need to be open)

**Build for Physical Device:**
```bash
npm run ios:build:device
```

**Note:** Device builds require code signing (Apple Developer account)

### Option 2: Using Build Script (Opens Xcode)

**Open Xcode and build:**
```bash
npm run ios:build
```

This will:
1. Build your Next.js app
2. Sync with Capacitor
3. Install CocoaPods dependencies
4. Open Xcode (you can then build from Xcode GUI)

### Option 2: Manual Build

1. **Build Next.js app:**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor:**
   ```bash
   npx cap sync ios
   ```

3. **Install CocoaPods:**
   ```bash
   cd ios/App
   pod install
   cd ../..
   ```

4. **Open Xcode:**
   ```bash
   npm run ios:open
   ```
   Or manually:
   ```bash
   npx cap open ios
   ```

5. **In Xcode:**
   - Select your development team in **Signing & Capabilities**
   - Choose a simulator or connect your iOS device
   - Click the **Play** button to build and run

## Running on iOS Simulator

1. Open Xcode: `npm run ios:open`
2. Select a simulator from the device dropdown (e.g., iPhone 15)
3. Click the **Play** button
4. The app will launch in the simulator

## Running on Physical Device

1. **Connect your iOS device** via USB
2. **Trust your computer** on the device when prompted
3. **Open Xcode**: `npm run ios:open`
4. **Select your device** from the device dropdown
5. **Select your development team** in Signing & Capabilities
   - If you don't have a team, create a free Apple ID account
6. **Click Play** to build and install on your device
7. **Trust the developer** on your device:
   - Go to Settings → General → VPN & Device Management
   - Tap your developer account
   - Tap "Trust"

## Building for Distribution

### Archive for App Store

1. **Open Xcode**: `npm run ios:open`
2. **Select "Any iOS Device"** from device dropdown
3. **Product → Archive**
4. **Wait for archive to complete**
5. **Distribute App**:
   - Choose distribution method (App Store, Ad Hoc, Enterprise)
   - Follow the prompts to sign and upload

### Export IPA File

1. After archiving, click **Distribute App**
2. Choose **Ad Hoc** or **Development**
3. Select your provisioning profile
4. Export the `.ipa` file

## Updating the App

After making changes to your Next.js app:

1. **Rebuild:**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor:**
   ```bash
   npx cap sync ios
   ```

3. **Rebuild in Xcode** or run the build script again

## Troubleshooting

### CocoaPods Installation Fails

```bash
# Update Ruby gems
sudo gem update --system

# Install CocoaPods
sudo gem install cocoapods

# If permission errors, use Homebrew
brew install cocoapods
```

### Pod Install Fails

```bash
cd ios/App
pod deintegrate
pod install
cd ../..
```

### Xcode Build Errors

1. **Clean build folder**: Product → Clean Build Folder (Shift+Cmd+K)
2. **Delete derived data**: Xcode → Preferences → Locations → Derived Data → Delete
3. **Reinstall pods:**
   ```bash
   cd ios/App
   rm -rf Pods Podfile.lock
   pod install
   cd ../..
   ```

### Camera Not Working

1. **Check Info.plist** - Ensure `NSCameraUsageDescription` is present
2. **Check permissions** - Settings → Privacy → Camera → Enable for your app
3. **Rebuild** the app after adding permissions

### Signing Errors

1. **Select your team** in Xcode → Signing & Capabilities
2. **Create a free Apple ID** if you don't have one
3. **Enable automatic signing** in Xcode

### Simulator Not Launching

1. **Check Xcode installation**: `xcodebuild -version`
2. **Install simulators**: Xcode → Preferences → Components
3. **Reset simulator**: Device → Erase All Content and Settings

## App Store Submission

1. **Create App Store Connect record**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create a new app
   - Fill in app information

2. **Archive and upload**
   - Archive in Xcode
   - Upload to App Store Connect
   - Submit for review

3. **Required information:**
   - App name, description, keywords
   - Screenshots (various device sizes)
   - App icon (1024x1024)
   - Privacy policy URL
   - Support URL

## Additional Resources

- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Apple Developer Portal](https://developer.apple.com)

## Quick Commands

```bash
# Build and open Xcode
npm run ios:open

# Build with script
npm run ios:build

# Build from command line
npm run ios:build:cli

# Sync only
npx cap sync ios

# Open Xcode only
npx cap open ios
```

