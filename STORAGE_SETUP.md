# Firebase Storage CORS Configuration Guide

## Problem
You're getting CORS errors when uploading files from localhost. This is because Firebase Storage needs CORS configuration on the bucket itself.

## Solution: Configure CORS on Firebase Storage Bucket

### Option 1: Using gsutil (Recommended)

1. **Install Google Cloud SDK** (if not already installed):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use: `choco install gcloudsdk` (Windows) / `brew install google-cloud-sdk` (Mac)

2. **Authenticate**:
   ```bash
   gcloud auth login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project patnam-clinic-hub
   ```

4. **Apply CORS configuration**:
   ```bash
   gsutil cors set cors-config.json gs://patnam-clinic-hub.firebasestorage.app
   ```

5. **Verify it worked**:
   ```bash
   gsutil cors get gs://patnam-clinic-hub.firebasestorage.app
   ```

### Option 2: Using Firebase Console (Easier but less control)

1. Go to Firebase Console → Storage
2. Click on the "Rules" tab
3. Make sure your rules allow uploads:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true; // For testing - restrict in production
       }
     }
   }
   ```

### Option 3: Using Firebase CLI

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Use Firebase Storage emulator for local testing (alternative approach)

## Important Notes

- The CORS configuration file (`cors-config.json`) is already created in your project root
- After configuring CORS, restart your dev server
- For production, replace `localhost:*` with your actual domain
- Storage rules and CORS are different - you need both configured correctly

## Quick Test

After configuring CORS, try uploading a file again. The CORS error should be gone.
