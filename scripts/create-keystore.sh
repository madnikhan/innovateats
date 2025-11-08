#!/bin/bash

# Create Keystore Script for Innovat Eats
# This script helps create a keystore for signing release APKs

echo "🔐 Creating Keystore for Innovat Eats Release APK..."
echo ""

KEYSTORE_FILE="innovateats-release-key.jks"

if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  Keystore already exists: $KEYSTORE_FILE"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    rm "$KEYSTORE_FILE"
fi

echo "Please provide the following information:"
echo ""

# Prompt for keystore password
read -sp "Enter keystore password: " STORE_PASSWORD
echo ""
read -sp "Re-enter keystore password: " STORE_PASSWORD_CONFIRM
echo ""

if [ "$STORE_PASSWORD" != "$STORE_PASSWORD_CONFIRM" ]; then
    echo "❌ Passwords do not match!"
    exit 1
fi

# Prompt for key password
read -sp "Enter key password (can be same as keystore): " KEY_PASSWORD
echo ""
read -sp "Re-enter key password: " KEY_PASSWORD_CONFIRM
echo ""

if [ "$KEY_PASSWORD" != "$KEY_PASSWORD_CONFIRM" ]; then
    echo "❌ Passwords do not match!"
    exit 1
fi

# Prompt for other details
read -p "Enter your name (or organization): " NAME
read -p "Enter organizational unit: " ORG_UNIT
read -p "Enter organization: " ORGANIZATION
read -p "Enter city: " CITY
read -p "Enter state/province: " STATE
read -p "Enter country code (2 letters, e.g., US, GB): " COUNTRY

echo ""
echo "Creating keystore..."

keytool -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -alias innovateats \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$STORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=$NAME, OU=$ORG_UNIT, O=$ORGANIZATION, L=$CITY, ST=$STATE, C=$COUNTRY"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore created successfully: $KEYSTORE_FILE"
    echo ""
    echo "Now create android/key.properties with:"
    echo ""
    echo "storePassword=$STORE_PASSWORD"
    echo "keyPassword=$KEY_PASSWORD"
    echo "keyAlias=innovateats"
    echo "storeFile=../$KEYSTORE_FILE"
    echo ""
    echo "⚠️  IMPORTANT: Keep your keystore and passwords secure!"
    echo "   - Never commit the keystore file to git"
    echo "   - Store passwords securely"
    echo "   - Keep a backup of your keystore"
else
    echo ""
    echo "❌ Failed to create keystore!"
    exit 1
fi

