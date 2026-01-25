# Firebase Storage Setup Guide - Increase File Size Limit to 50MB

## Current Status
- **Small files (≤700KB)**: Stored in Firestore (works immediately, no setup needed)
- **Large files (>700KB up to 50MB)**: Requires Firebase Storage with CORS configuration

## Why CORS Configuration is Needed

Firebase Storage requires CORS (Cross-Origin Resource Sharing) configuration to allow uploads from:
- Your production domain: `https://clinic-hub-nine.vercel.app`
- Local development: `http://localhost:*`

Without CORS, you'll get errors like:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'https://clinic-hub-nine.vercel.app' has been blocked by CORS policy
```

## Solution: Configure CORS on Firebase Storage Bucket

### Step 1: Install Google Cloud SDK (if not already installed)

**Windows:**
- Download from: https://cloud.google.com/sdk/docs/install
- Or use Chocolatey: `choco install gcloudsdk`

**Mac:**
```bash
brew install google-cloud-sdk
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 2: Authenticate with Google Cloud

```bash
gcloud auth login
```

This will open a browser window for you to sign in with your Google account (the same account used for Firebase).

### Step 3: Set Your Firebase Project

```bash
gcloud config set project patnam-clinic-hub
```

### Step 4: Apply CORS Configuration

The `cors-config.json` file is already updated with your Vercel domain. Apply it:

```bash
gsutil cors set cors-config.json gs://patnam-clinic-hub.firebasestorage.app
```

### Step 5: Verify CORS Configuration

```bash
gsutil cors get gs://patnam-clinic-hub.firebasestorage.app
```

You should see output like:
```json
[
  {
    "origin": [
      "http://localhost:*",
      "http://127.0.0.1:*",
      "https://clinic-hub-nine.vercel.app",
      "https://*.vercel.app"
    ],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```

### Step 6: Verify Storage Rules

1. Go to: https://console.firebase.google.com/project/patnam-clinic-hub/storage/rules
2. Make sure your rules allow uploads. For testing, use:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true;
       }
     }
   }
   ```
3. Click "Publish"

**⚠️ Important:** For production, restrict these rules to authenticated users only.

### Step 7: Test Upload

1. Deploy your changes to Vercel (or restart local dev server)
2. Try uploading a file larger than 700KB (e.g., a 2MB PDF)
3. The upload should work without CORS errors

## How It Works

The code automatically:
- **Files ≤700KB**: Uploads directly to Firestore (base64) - no CORS needed
- **Files >700KB**: Attempts Firebase Storage upload
  - If Storage works: File stored in Storage, URL saved in Firestore
  - If Storage fails (CORS error): Falls back to Firestore if file ≤700KB, otherwise shows error

## Troubleshooting

### Error: "gsutil: command not found"
- Make sure Google Cloud SDK is installed and in your PATH
- Restart your terminal after installation

### Error: "Access Denied"
- Make sure you're logged in with the correct Google account
- Verify you have Firebase Admin/Storage Admin permissions

### Still Getting CORS Errors After Configuration
1. Wait 1-2 minutes for CORS changes to propagate
2. Clear browser cache
3. Verify CORS config: `gsutil cors get gs://patnam-clinic-hub.firebasestorage.app`
4. Check that your domain matches exactly (including `https://`)

### Alternative: Use Firebase Console (Limited)
Unfortunately, Firebase Console doesn't support CORS configuration directly. You must use `gsutil` or Google Cloud Console.

## Need Help?

If you can't configure CORS yourself:
1. Ask someone with Firebase admin access to run the `gsutil` commands
2. Or use the current setup (700KB limit) which works without CORS

## Current Limits

- **Without CORS configured**: 700KB per file (Firestore only)
- **With CORS configured**: 50MB per file (Firebase Storage)
