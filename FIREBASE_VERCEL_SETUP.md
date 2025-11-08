# Firebase Configuration for Vercel

This guide will help you configure Firebase environment variables in Vercel.

## Required Environment Variables

You need to add the following environment variables to your Vercel project:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## How to Add Environment Variables in Vercel Dashboard

### Method 1: Using Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add each variable one by one:
   - Click **Add New**
   - Enter the variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - Enter the variable value
   - Select the environments (Production, Preview, Development)
   - Click **Save**
4. Repeat for all 6 variables
5. **Redeploy** your project after adding all variables

### Method 2: Using Vercel CLI

If you have Vercel CLI installed, you can use the provided script:

```bash
# Make the script executable
chmod +x scripts/setup-vercel-env.sh

# Run the script (it will prompt you for each value)
./scripts/setup-vercel-env.sh
```

Or manually add them one by one:

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
```

## Where to Find Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the **Settings (gear icon)** → **Project settings**
4. Scroll down to **Your apps** section
5. Click on the **Web app** (or create one if you haven't)
6. You'll see your Firebase configuration object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                    // → NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "project.firebaseapp.com", // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "your-project-id",         // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "project.appspot.com", // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",       // → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc123"       // → NEXT_PUBLIC_FIREBASE_APP_ID
};
```

## Important Notes

- **All variables must start with `NEXT_PUBLIC_`** - This is required for Next.js to expose them to the browser
- **Select all environments** (Production, Preview, Development) when adding variables
- **Redeploy after adding variables** - Changes won't take effect until you redeploy
- **Never commit `.env.local`** - This file is already in `.gitignore`

## Verification

After adding the environment variables and redeploying:

1. Go to your Vercel deployment
2. Check the build logs - it should complete successfully
3. Visit your deployed site - Firebase should work correctly

## Troubleshooting

### Build still failing?

1. Verify all 6 variables are added in Vercel
2. Check that variable names are exactly as shown (case-sensitive)
3. Ensure all variables have values (not empty)
4. Try redeploying after adding variables

### Firebase not working in production?

1. Check browser console for Firebase errors
2. Verify environment variables are set for Production environment
3. Make sure you redeployed after adding variables

## Quick Setup Script

See `scripts/setup-vercel-env.sh` for an automated setup script.

