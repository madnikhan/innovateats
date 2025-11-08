#!/bin/bash

# Firebase Environment Variables Setup Script for Vercel
# This script helps you add Firebase environment variables to Vercel

echo "🔥 Firebase Environment Variables Setup for Vercel"
echo "=================================================="
echo ""
echo "This script will help you add Firebase environment variables to your Vercel project."
echo "Make sure you have Vercel CLI installed and are logged in."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "Install it with: npm i -g vercel"
    exit 1
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ You are not logged in to Vercel."
    echo "Login with: vercel login"
    exit 1
fi

echo "✅ Vercel CLI is installed and you are logged in."
echo ""

# Array of environment variables
declare -a env_vars=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

# Descriptions for each variable
declare -A descriptions=(
    ["NEXT_PUBLIC_FIREBASE_API_KEY"]="Firebase API Key (starts with AIza...)"
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"]="Firebase Auth Domain (e.g., project.firebaseapp.com)"
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID"]="Firebase Project ID"
    ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"]="Firebase Storage Bucket (e.g., project.appspot.com)"
    ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"]="Firebase Messaging Sender ID (numeric)"
    ["NEXT_PUBLIC_FIREBASE_APP_ID"]="Firebase App ID (e.g., 1:123456789:web:abc123)"
)

echo "You'll be prompted to enter each Firebase configuration value."
echo "You can find these values in Firebase Console → Project Settings → Your apps → Web app"
echo ""
read -p "Press Enter to continue..."

for var in "${env_vars[@]}"; do
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 ${var}"
    echo "   ${descriptions[$var]}"
    echo ""
    
    read -p "Enter value for ${var}: " value
    
    if [ -z "$value" ]; then
        echo "⚠️  Skipping ${var} (empty value)"
        continue
    fi
    
    echo ""
    echo "Adding ${var} to Vercel..."
    
    # Add to all environments (Production, Preview, Development)
    echo "$value" | vercel env add "$var" production
    echo "$value" | vercel env add "$var" preview
    echo "$value" | vercel env add "$var" development
    
    if [ $? -eq 0 ]; then
        echo "✅ ${var} added successfully"
    else
        echo "❌ Failed to add ${var}"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify all variables in Vercel Dashboard → Settings → Environment Variables"
echo "2. Redeploy your project to apply the changes"
echo "3. Check the deployment logs to ensure the build succeeds"
echo ""
echo "To redeploy, run: vercel --prod"
echo ""

