# How to Delete a User from Firebase Authentication

If you want to delete an existing user account to sign up again with the same email, here's how:

## Method 1: Delete from Firebase Console (Easiest)

1. **Go to Firebase Console**:
   - https://console.firebase.google.com/project/progrey-515c9/authentication

2. **Click "Users" tab** (should be selected by default)

3. **Find the user**:
   - Look for the email address you want to delete
   - You can use the search bar to filter

4. **Delete the user**:
   - Click on the three dots (⋮) next to the user
   - Select **"Delete user"**
   - Confirm the deletion

5. **Also delete Firestore data** (optional):
   - Go to **Firestore Database**
   - Find the user's document in the `users` collection
   - Delete the document (this will also delete their tasks and trash)

## Method 2: Use Browser Console (Quick Test)

1. **Open your app**: `http://localhost:8000`
2. **Open DevTools** (F12) > Console
3. **Sign in first** (if not already):
   ```javascript
   firebase.auth().signInWithEmailAndPassword('your@email.com', 'yourpassword')
     .then(() => console.log('Signed in'))
     .catch(err => console.error(err));
   ```

4. **Delete the user**:
   ```javascript
   firebase.auth().currentUser.delete()
     .then(() => console.log('User deleted'))
     .catch(err => console.error('Error:', err.message));
   ```

## Method 3: Delete Firestore Data Only

If you just want to delete the user's data but keep the authentication:

1. Go to **Firestore Database**
2. Click on **"users"** collection
3. Find the user document (by email or UID)
4. Click on the document
5. Click the **delete icon** (trash can)
6. Also delete subcollections:
   - Click on **"tasks"** subcollection
   - Delete all task documents
   - Click on **"trash"** subcollection
   - Delete all trash documents

## After Deleting

Once you delete the user:
1. You can sign up again with the same email
2. Or use a different email address
3. The old data will be gone (unless you have backups)

## Important Notes

⚠️ **Deleting a user is permanent** - you cannot recover:
- Authentication account
- User data in Firestore
- Tasks and trash

✅ **Before deleting**, make sure you:
- Don't need the data anymore
- Have backups if needed
- Want to start fresh

## Alternative: Just Sign In

Instead of deleting, you can simply **sign in** with the existing account:
- Use the same email and password
- Your existing data will be there
- No need to delete anything

## Quick Links

- **Authentication Users**: https://console.firebase.google.com/project/progrey-515c9/authentication/users
- **Firestore Database**: https://console.firebase.google.com/project/progrey-515c9/firestore
