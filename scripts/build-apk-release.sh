#!/bin/bash

# Build Release APK Script for Innovat Eats
# This script builds a signed release APK for distribution

set -e  # Exit on error

echo "🚀 Building Innovat Eats Release APK..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if keystore exists
KEYSTORE_FILE="innovateats-release-key.jks"
KEYSTORE_PROPERTIES="android/key.properties"

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo -e "${YELLOW}⚠️  Keystore not found!${NC}"
    echo ""
    echo "To create a keystore, run:"
    echo "  keytool -genkey -v -keystore $KEYSTORE_FILE -keyalg RSA -keysize 2048 -validity 10000 -alias innovateats"
    echo ""
    echo "Or use the provided script:"
    echo "  ./scripts/create-keystore.sh"
    echo ""
    exit 1
fi

if [ ! -f "$KEYSTORE_PROPERTIES" ]; then
    echo -e "${YELLOW}⚠️  key.properties not found!${NC}"
    echo ""
    echo "Please create android/key.properties with:"
    echo "  storePassword=YOUR_STORE_PASSWORD"
    echo "  keyPassword=YOUR_KEY_PASSWORD"
    echo "  keyAlias=innovateats"
    echo "  storeFile=../$KEYSTORE_FILE"
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
npx cap sync android

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Capacitor sync failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Capacitor sync completed${NC}"
echo ""

# Step 3: Build Release APK using Gradle
echo -e "${BLUE}🔨 Step 3: Building Release APK...${NC}"
cd android

# Check if gradlew exists
if [ ! -f "./gradlew" ]; then
    echo -e "${RED}❌ Gradle wrapper not found!${NC}"
    exit 1
fi

# Make gradlew executable
chmod +x ./gradlew

# Build release APK
echo -e "${BLUE}Building release APK...${NC}"
./gradlew assembleRelease

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Release APK build failed!${NC}"
    cd ..
    exit 1
fi

cd ..

# Step 4: Find and display APK location
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo -e "${GREEN}✅ Release APK built successfully!${NC}"
    echo ""
    echo -e "${GREEN}📱 APK Location:${NC}"
    echo -e "   ${BLUE}$(pwd)/$APK_PATH${NC}"
    echo ""
    echo -e "${GREEN}📊 APK Size:${NC} $APK_SIZE"
    echo ""
    echo -e "${GREEN}🎉 Build complete!${NC}"
    echo ""
    echo "This APK is signed and ready for distribution."
    echo ""
else
    echo -e "${RED}❌ APK file not found at expected location!${NC}"
    exit 1
fi

