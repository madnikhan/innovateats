#!/bin/bash

# Build iOS App using xcodebuild (Command Line)
# This script builds the iOS app without opening Xcode

set -e  # Exit on error

echo "🚀 Building Innovat Eats iOS App (Command Line)..."
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
    echo -e "${RED}❌ Xcode is not installed!${NC}"
    echo ""
    echo "Please install Xcode from the App Store:"
    echo "  https://apps.apple.com/us/app/xcode/id497799835"
    echo ""
    exit 1
fi

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo -e "${RED}❌ CocoaPods is not installed!${NC}"
    echo ""
    echo "Please install CocoaPods:"
    echo "  sudo gem install cocoapods"
    echo ""
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

# Step 4: Build using xcodebuild
echo -e "${BLUE}🔨 Step 4: Building iOS app...${NC}"
cd ios/App

# Find the workspace file
WORKSPACE=$(find . -name "*.xcworkspace" -maxdepth 1 | head -1)
SCHEME="App"

if [ -z "$WORKSPACE" ]; then
    echo -e "${RED}❌ Xcode workspace not found!${NC}"
    cd ../..
    exit 1
fi

echo -e "${BLUE}Building for iOS Simulator...${NC}"
xcodebuild -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Debug \
    -sdk iphonesimulator \
    -destination 'platform=iOS Simulator,name=iPhone 15' \
    clean build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ iOS build failed!${NC}"
    cd ../..
    exit 1
fi

cd ../..

echo ""
echo -e "${GREEN}✅ iOS app built successfully!${NC}"
echo ""
echo -e "${GREEN}📱 Build Location:${NC}"
echo -e "   ${BLUE}$(pwd)/ios/App/build${NC}"
echo ""
echo -e "${GREEN}🎉 Build complete!${NC}"
echo ""
echo "To run on a device:"
echo "  1. Open Xcode: npm run ios:open"
echo "  2. Select your device"
echo "  3. Click Run"
echo ""

