#!/bin/bash

# Build iOS App using xcodebuild (Command Line)
# This script builds the iOS app without opening Xcode GUI
# Note: Xcode must be installed (but doesn't need to be open)

set -e  # Exit on error

echo "🚀 Building Innovat Eats iOS App (Command Line - No Xcode GUI Required)..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ iOS builds can only be done on macOS!${NC}"
    exit 1
fi

# Check if Xcode is installed (xcodebuild command)
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode command line tools are not installed!${NC}"
    echo ""
    echo "Installing Xcode command line tools..."
    echo "You may be prompted for your password."
    echo ""
    xcode-select --install 2>/dev/null || true
    echo ""
    echo "Please wait for the installation to complete, then run this script again."
    echo ""
    exit 1
fi

# Check if Xcode is properly configured
XCODE_PATH=$(xcode-select -p 2>/dev/null || echo "")
if [[ -z "$XCODE_PATH" ]] || [[ ! "$XCODE_PATH" == *"Xcode.app"* ]]; then
    echo -e "${YELLOW}⚠️  Xcode path not set correctly!${NC}"
    echo ""
    echo "Setting Xcode path..."
    XCODE_APP=$(mdfind "kMDItemCFBundleIdentifier == 'com.apple.dt.Xcode'" | head -1)
    if [ -n "$XCODE_APP" ]; then
        sudo xcode-select --switch "$XCODE_APP/Contents/Developer"
        echo -e "${GREEN}✅ Xcode path set${NC}"
    else
        echo -e "${RED}❌ Xcode.app not found!${NC}"
        echo ""
        echo "Please install Xcode from the App Store:"
        echo "  https://apps.apple.com/us/app/xcode/id497799835"
        echo ""
        exit 1
    fi
fi

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}⚠️  CocoaPods is not installed!${NC}"
    echo ""
    echo "Installing CocoaPods..."
    echo "You may be prompted for your password."
    echo ""
    sudo gem install cocoapods
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install CocoaPods!${NC}"
        echo ""
        echo "Please install CocoaPods manually:"
        echo "  sudo gem install cocoapods"
        echo ""
        exit 1
    fi
fi

# Step 1: Build Next.js app
echo -e "${BLUE}📦 Step 1: Building Next.js app...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Next.js build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Next.js build completed${NC}"
echo ""

# Step 2: Sync with Capacitor
echo -e "${BLUE}🔄 Step 2: Syncing with Capacitor...${NC}"
npx cap sync ios

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Capacitor sync completed with warnings${NC}"
    echo ""
fi

echo -e "${GREEN}✅ Capacitor sync completed${NC}"
echo ""

# Step 3: Install CocoaPods dependencies
echo -e "${BLUE}📦 Step 3: Installing CocoaPods dependencies...${NC}"
cd ios/App

if [ ! -f "Podfile" ]; then
    echo -e "${RED}❌ Podfile not found!${NC}"
    cd ../..
    exit 1
fi

pod install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Pod install failed!${NC}"
    cd ../..
    exit 1
fi

cd ../..

echo -e "${GREEN}✅ CocoaPods dependencies installed${NC}"
echo ""

# Step 4: Build using xcodebuild (no Xcode GUI needed)
echo -e "${BLUE}🔨 Step 4: Building iOS app (using xcodebuild)...${NC}"
cd ios/App

# Find the workspace file
WORKSPACE=$(find . -name "*.xcworkspace" -maxdepth 1 | head -1)
SCHEME="App"

if [ -z "$WORKSPACE" ]; then
    echo -e "${RED}❌ Xcode workspace not found!${NC}"
    cd ../..
    exit 1
fi

# Get workspace name
WORKSPACE_NAME=$(basename "$WORKSPACE" .xcworkspace)

echo -e "${BLUE}Building for iOS Simulator (no Xcode GUI required)...${NC}"
echo ""

# Build for simulator
xcodebuild -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Debug \
    -sdk iphonesimulator \
    -destination 'platform=iOS Simulator,name=iPhone 15' \
    -derivedDataPath ./build \
    clean build CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ iOS build failed!${NC}"
    cd ../..
    exit 1
fi

cd ../..

# Find the built app
APP_PATH=$(find ios/App/build -name "*.app" -type d | head -1)

echo ""
echo -e "${GREEN}✅ iOS app built successfully!${NC}"
echo ""
if [ -n "$APP_PATH" ]; then
    APP_SIZE=$(du -sh "$APP_PATH" | cut -f1)
    echo -e "${GREEN}📱 App Location:${NC}"
    echo -e "   ${BLUE}$APP_PATH${NC}"
    echo ""
    echo -e "${GREEN}📊 App Size:${NC} $APP_SIZE"
    echo ""
fi
echo -e "${GREEN}📱 Build Location:${NC}"
echo -e "   ${BLUE}$(pwd)/ios/App/build${NC}"
echo ""
echo -e "${GREEN}🎉 Build complete!${NC}"
echo ""
echo "To run on simulator:"
echo "  xcrun simctl boot 'iPhone 15' 2>/dev/null || true"
echo "  xcrun simctl install booted '$APP_PATH'"
echo "  xcrun simctl launch booted com.innovateats.app"
echo ""
echo "To build for device (requires signing):"
echo "  npm run ios:build:device"
echo ""

