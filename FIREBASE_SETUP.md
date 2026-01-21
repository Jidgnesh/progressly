# Firebase Cloud Sync Setup Guide

## Overview
This guide will help you set up Firebase to enable cloud storage for authentication and tasks, allowing you to access your account and tasks from any device.

## Benefits
- ✅ Cloud-based authentication (no local storage)
- ✅ Access from multiple devices
- ✅ Real-time task synchronization
- ✅ Secure password storage
- ✅ Google Sign In support
- ✅ Automatic backups

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: **Progressly** (or your preferred name)
4. Click **Continue**
5. Disable Google Analytics (optional) or enable if you want analytics
6. Click **Create project**
7. Wait for project creation, then click **Continue**

## Step 2: Enable Authentication

1. In Firebase Console, click **Authentication** in the left menu
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**:
   - Click on **Email/Password**
   - Toggle **Enable** to ON
   - Click **Save**
5. Enable **Google** (optional, for Google Sign In):
   - Click on **Google**
   - Toggle **Enable** to ON
   - Enter your project support email
   - Click **Save**

## Step 3: Create Firestore Database

1. In Firebase Console, click **Firestore Database** in the left menu
2. Click **Create database**
3. Choose your mode:
   - **For Development/Testing:** Select **Start in test mode** (allows read/write for 30 days)
   - **For Production:** Select **Start in production mode** (requires security rules immediately)
4. Choose a location (select closest to your users)
5. Click **Enable**

### Production Security Rules

If you selected production mode or want to secure your database, use these security rules:

1. In Firebase Console, go to **Firestore Database** > **Rules** tab
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection - users can only access their own profile
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      
      // User's tasks subcollection
      match /tasks/{taskId} {
        allow read, write: if isOwner(userId);
      }
      
      // User's trash subcollection
      match /trash/{trashId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

3. Click **Publish** to save the rules

### What These Rules Do:

- ✅ **Only authenticated users** can access the database
- ✅ **Users can only access their own data** (their user document, tasks, and trash)
- ✅ **Prevents unauthorized access** to other users' data
- ✅ **Secure by default** - denies all access unless explicitly allowed

### Testing Your Rules

After setting up rules, test them:
1. Sign in to your app
2. Create some tasks
3. Try accessing the database from another account - it should be denied
4. Check Firebase Console > Firestore > Rules > Rules Playground to test rules

## Step 4: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Click **Project settings**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Register app:
   - App nickname: **Progressly Web**
   - Firebase Hosting: Not needed (uncheck if checked)
   - Click **Register app**
6. Copy the `firebaseConfig` object that appears

## Step 5: Configure the App

1. Open `js/firebase-config.js` in your project
2. Replace the placeholder values with your Firebase config:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSy...", // Your API key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## Step 6: Set Up Firestore Security Rules (Important!)

**Note:** If you selected "Start in production mode" in Step 3, you must set up security rules immediately. If you selected "test mode", you have 30 days before you need to set rules.

1. In Firebase Console, go to **Firestore Database** > **Rules** tab
2. Replace the default rules with the production-ready rules shown in Step 3 above
3. Click **Publish** to save the rules

### Alternative: Simpler Rules (Same Security)

If you prefer a more concise version:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /trash/{trashId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Both rule sets provide the same level of security. The first version uses helper functions for better readability.

## Step 7: Test the Integration

1. Open your app in a browser
2. Try signing up with a new account
3. Create some tasks
4. Sign out and sign in again - tasks should persist
5. Open the app on another device/browser and sign in - tasks should sync!

## Migration from LocalStorage

If you have existing data in localStorage:
1. The app will automatically migrate your tasks to Firebase when you sign in
2. Your old localStorage data will remain as backup
3. Once synced, all new changes will be saved to Firebase

## Troubleshooting

**"Firebase is not defined" error:**
- Make sure Firebase scripts are loaded before your app scripts
- Check browser console for any script loading errors

**"Permission denied" error:**
- Check Firestore security rules are set correctly
- Make sure user is authenticated

**Tasks not syncing:**
- Check browser console for errors
- Verify Firebase config is correct
- Ensure Firestore database is created

**Authentication not working:**
- Verify Email/Password is enabled in Firebase Console
- Check that Firebase config is correct
- Look for errors in browser console

## Production Considerations

1. **Security Rules:** Update Firestore rules for production
2. **Domain Restrictions:** Add your domain to authorized domains in Firebase
3. **Error Handling:** Add proper error handling for network issues
4. **Offline Support:** Firebase has built-in offline support, but you may want to add a sync indicator

## Support

For more help:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
