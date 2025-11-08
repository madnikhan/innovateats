#!/bin/bash

# Build iOS App Script for Innovat Eats
# This script builds the Next.js app and prepares iOS app for Xcode

set -e  # Exit on error

echo "🚀 Building Innovat Eats iOS App..."
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
    echo -e "${YELLOW}⚠️  Pod install completed with warnings${NC}"
    echo ""
fi

cd ../..

echo -e "${GREEN}✅ CocoaPods dependencies installed${NC}"
echo ""

# Step 4: Open Xcode
echo -e "${BLUE}📱 Step 4: Opening Xcode...${NC}"
echo ""
echo -e "${GREEN}✅ iOS project ready!${NC}"
echo ""
echo -e "${GREEN}📱 Next steps:${NC}"
echo ""
echo "1. Xcode will open automatically"
echo "2. Select your development team in Signing & Capabilities"
echo "3. Connect your iOS device or select a simulator"
echo "4. Click the Play button to build and run"
echo ""
echo "Or build from command line:"
echo "  npm run ios:build"
echo ""

# Open Xcode
npx cap open ios

