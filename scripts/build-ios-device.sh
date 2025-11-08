#!/bin/bash

# Build iOS App for Physical Device (Command Line)
# This script builds the iOS app for a physical device without opening Xcode
# Note: Requires Apple Developer account and code signing

set -e  # Exit on error

echo "🚀 Building Innovat Eats iOS App for Device (Command Line)..."
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

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode command line tools are not installed!${NC}"
    exit 1
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

# Step 4: Build for device
echo -e "${BLUE}🔨 Step 4: Building iOS app for device...${NC}"
cd ios/App

# Find the workspace file
WORKSPACE=$(find . -name "*.xcworkspace" -maxdepth 1 | head -1)
SCHEME="App"

if [ -z "$WORKSPACE" ]; then
    echo -e "${RED}❌ Xcode workspace not found!${NC}"
    cd ../..
    exit 1
fi

echo -e "${YELLOW}⚠️  Device builds require code signing!${NC}"
echo ""
echo "Please ensure you have:"
echo "  1. Apple Developer account (free or paid)"
echo "  2. Development team configured in Xcode"
echo "  3. Provisioning profile set up"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# List available teams
echo ""
echo -e "${BLUE}Available development teams:${NC}"
xcodebuild -showBuildSettings -workspace "$WORKSPACE" -scheme "$SCHEME" 2>/dev/null | grep "DEVELOPMENT_TEAM" | head -1 || echo "  No team configured"

echo ""
echo -e "${BLUE}Building for iOS Device...${NC}"
echo ""

# Build for device (generic iOS device)
xcodebuild -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Release \
    -sdk iphoneos \
    -destination 'generic/platform=iOS' \
    -derivedDataPath ./build \
    clean build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ iOS device build failed!${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. No development team selected"
    echo "  2. Missing provisioning profile"
    echo "  3. Code signing errors"
    echo ""
    echo "To fix:"
    echo "  1. Run: npm run ios:open"
    echo "  2. Select your team in Signing & Capabilities"
    echo "  3. Try building again"
    echo ""
    cd ../..
    exit 1
fi

cd ../..

# Find the built app
APP_PATH=$(find ios/App/build -name "*.app" -type d | head -1)
IPA_PATH="ios/App/build/App.ipa"

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
echo "To install on device:"
echo "  1. Connect your iOS device via USB"
echo "  2. Open Xcode: npm run ios:open"
echo "  3. Select your device and click Run"
echo ""
echo "Or use:"
echo "  xcrun devicectl device install app --device <device-id> '$APP_PATH'"
echo ""

