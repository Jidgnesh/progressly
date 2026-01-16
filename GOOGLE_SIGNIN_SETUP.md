# Google Sign In Setup Guide

## Overview
This app now supports Google Sign In using Google Identity Services. Users can sign in with their Google account instead of creating a new account.

## Setup Instructions

### Step 1: Create Google OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" or "Google Identity Services"
   - Click **Enable**

### Step 2: Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for public use)
   - App name: **Progressly**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Add scopes: `email`, `profile`, `openid`
   - Click **Save and Continue**
   - Add test users (optional for development)
   - Click **Save and Continue**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Progressly Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:8000` (for local testing)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:8000` (for local testing)
     - `https://yourdomain.com` (for production)
   - Click **Create**

5. Copy the **Client ID** (it looks like: `123456789-abcdefg.apps.googleusercontent.com`)

### Step 3: Configure in App

1. Open `js/constants.js`
2. Find the line: `const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';`
3. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID:
   ```javascript
   const GOOGLE_CLIENT_ID = '123456789-abcdefg.apps.googleusercontent.com';
   ```

### Step 4: Test

1. Open the app in your browser
2. Go to the Sign In page
3. You should see a "Sign in with Google" button
4. Click it and authenticate with your Google account
5. You should be signed in automatically

## Features

- ✅ One-click Google authentication
- ✅ Automatic user account creation
- ✅ Stores user profile (name, email, picture)
- ✅ Works alongside email/password authentication
- ✅ Secure OAuth 2.0 flow

## Security Notes

- The Client ID is safe to expose in client-side code
- Never expose the Client Secret (not needed for this implementation)
- Make sure to add all your domains to Authorized JavaScript origins
- For production, use HTTPS

## Troubleshooting

**Button doesn't appear:**
- Check browser console for errors
- Verify Google script is loaded
- Ensure Client ID is correctly set

**"Error 400: redirect_uri_mismatch":**
- Add your domain to Authorized redirect URIs in Google Cloud Console
- Make sure the URL matches exactly (including http/https)

**"Error 403: access_denied":**
- Check OAuth consent screen is configured
- Verify the app is published (for production) or add test users
