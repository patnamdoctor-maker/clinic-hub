# Quick Fix for CORS Error

## The Problem
CORS (Cross-Origin Resource Sharing) error is blocking file uploads from localhost to Firebase Storage.

## Solution Steps

### Step 1: Check Storage Rules (Do this first!)

1. Go to: https://console.firebase.google.com/project/patnam-clinic-hub/storage/rules
2. Make sure your rules allow uploads. Use this for testing:
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

### Step 2: Configure CORS (Required for localhost)

You need to configure CORS on the Storage bucket itself. Choose one method:

#### Method A: Using gsutil (Command Line)

1. **Install Google Cloud SDK**:
   - Windows: Download from https://cloud.google.com/sdk/docs/install
   - Or use: `choco install gcloudsdk`
   - Mac: `brew install google-cloud-sdk`

2. **Run these commands**:
   ```bash
   gcloud auth login
   gcloud config set project patnam-clinic-hub
   gsutil cors set cors-config.json gs://patnam-clinic-hub.firebasestorage.app
   ```

3. **Verify**:
   ```bash
   gsutil cors get gs://patnam-clinic-hub.firebasestorage.app
   ```

#### Method B: Using Firebase Console (Alternative)

Unfortunately, Firebase Console doesn't directly support CORS configuration. You'll need to use gsutil or the Cloud Console.

#### Method C: Use Production URL (Temporary Workaround)

If you deploy to Vercel, the CORS issue won't occur because the production domain is already allowed. But for local testing, you need CORS configured.

### Step 3: Restart Dev Server

After configuring CORS, restart your dev server:
```bash
npm run dev
```

### Step 4: Test Upload

Try uploading a file again. The CORS error should be gone.

## If You Don't Have gsutil Access

If you can't install/use gsutil, you can:
1. Deploy to Vercel (production won't have CORS issues)
2. Or ask someone with Firebase admin access to configure CORS for you

## Need Help?

The `cors-config.json` file is already created in your project. Just run the gsutil command to apply it.
