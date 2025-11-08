#!/bin/bash

# Build APK Script for Innovat Eats
# This script builds the Next.js app and generates an Android APK

set -e  # Exit on error

echo "🚀 Building Innovat Eats Android APK..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build Next.js app
echo -e "${BLUE}📦 Step 1: Building Next.js app...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}❌ Next.js build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Next.js build completed${NC}"
echo ""

# Step 2: Sync with Capacitor
echo -e "${BLUE}🔄 Step 2: Syncing with Capacitor...${NC}"
npx cap sync android

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}❌ Capacitor sync failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Capacitor sync completed${NC}"
echo ""

# Step 3: Build APK using Gradle
echo -e "${BLUE}🔨 Step 3: Building Android APK...${NC}"
cd android

# Check if gradlew exists
if [ ! -f "./gradlew" ]; then
    echo -e "${YELLOW}❌ Gradle wrapper not found!${NC}"
    exit 1
fi

# Make gradlew executable
chmod +x ./gradlew

# Build debug APK
echo -e "${BLUE}Building debug APK...${NC}"
./gradlew assembleDebug

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}❌ APK build failed!${NC}"
    cd ..
    exit 1
fi

cd ..

# Step 4: Find and display APK location
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo -e "${GREEN}✅ APK built successfully!${NC}"
    echo ""
    echo -e "${GREEN}📱 APK Location:${NC}"
    echo -e "   ${BLUE}$(pwd)/$APK_PATH${NC}"
    echo ""
    echo -e "${GREEN}📊 APK Size:${NC} $APK_SIZE"
    echo ""
    echo -e "${GREEN}🎉 Build complete!${NC}"
    echo ""
    echo "To install on your device:"
    echo "  1. Connect your Android device via USB"
    echo "  2. Enable USB debugging"
    echo "  3. Run: adb install $APK_PATH"
    echo ""
else
    echo -e "${YELLOW}❌ APK file not found at expected location!${NC}"
    exit 1
fi

