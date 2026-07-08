# Firebase Setup Guide for TradeJournal AI

This guide walks you through setting up Firebase Authentication and Firestore for your project. Follow each step carefully.

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or "Add project" if you have existing projects)
3. Enter a project name, e.g., `tradejournal-ai`
4. Choose whether to enable Google Analytics (optional, not required for auth)
5. Click **"Create project"**
6. Wait for the project to be created, then click **"Continue"**

---

## Step 2: Register a Web App

1. On your Firebase project dashboard, click the **"</>"** (Web) icon to add a web app
2. Give your app a nickname, e.g., `tradejournal-web`
3. Check the box for **"Also set up Firebase Hosting"** (optional)
4. Click **"Register app"**
5. You will see your Firebase configuration object. **Copy these values** - you'll need them for your `.env` file:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
6. Click **"Continue to console"**

---

## Step 3: Enable Email/Password Authentication

1. In the left sidebar, click **"Authentication"** (under "Build")
2. Click **"Get started"**
3. On the "Sign-in method" tab, find **"Email/Password"** in the list
4. Click on it to expand
5. Toggle the first switch to **"Enable"**
6. Leave "Email link (passwordless sign-in)" disabled unless you want it
7. Click **"Save"**

---

## Step 4: Enable Google Sign-In

1. Still in Authentication > Sign-in method
2. Find **"Google"** in the "Additional providers" section
3. Click on it to expand
4. Toggle to **"Enable"**
5. Select a **Support email** from the dropdown
6. Click **"Save"**

---

## Step 5: Create Firestore Database

1. In the left sidebar, click **"Firestore Database"** (under "Build")
2. Click **"Create database"**
3. Choose **"Start in production mode"** (recommended for security)
4. Click **"Next"**
5. Select a Firestore location closest to your users (e.g., `nam5 (us-central)` for US users)
6. Click **"Enable"**
7. Wait for the database to be created

---

## Step 6: Set Up Firestore Security Rules

1. In Firestore Database, click the **"Rules"** tab
2. Replace the default rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own user document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }

    // Default deny - no other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

---

## Step 7: Generate Service Account Key (For Backend)

1. Click the **gear icon** next to "Project Overview" in the left sidebar
2. Click **"Project settings"**
3. Go to the **"Service accounts"** tab
4. Click **"Generate new private key"** button
5. Click **"Generate key"** in the popup
6. A JSON file will download to your computer
7. **Open this JSON file** and extract the following values:
   - `project_id`
   - `client_email`
   - `private_key`

---

## Step 8: Copy Firebase Web Config (For Frontend)

1. In Project Settings, go to the **"General"** tab
2. Under "Your apps", find your web app
3. Click the **"Config"** radio button (not the NPM one)
4. Copy the values for your `.env` file

---

## Step 9: Configure Your .env File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in all the Firebase values:

**Frontend variables** (from Step 2 / Step 8):
```
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Backend variables** (from Step 7):
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

**For the private key**, copy the entire `private_key` value from the JSON file:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

> **IMPORTANT**: The private key MUST be wrapped in double quotes and all actual newlines must be replaced with `\n`.

---

## Step 10: Install Dependencies and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

---

## Step 11: Verify Authentication Works

1. Open `http://localhost:3000` in your browser
2. Click **"Get Started"** to go to the Register page
3. Create an account with email and password
4. Check your email for a verification link
5. Try logging in with email/password
6. Try the **"Continue with Google"** button
7. Try the **"Forgot password"** flow
8. Verify the Dashboard shows your user info
9. Click **Logout** and verify it redirects to login

---

## Production Deployment

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Variables for Production

Make sure all environment variables are set in your production environment:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
DATABASE_URL=          # Only if using MySQL for other features
```

### Firebase Authorized Domains

If deploying to a custom domain, add it to Firebase:

1. Go to Firebase Console > Authentication > Settings
2. Under "Authorized domains", click **"Add domain"**
3. Enter your production domain (e.g., `yourdomain.com`)
4. Click **"Add"**

---

## Troubleshooting

### "auth/invalid-api-key" Error
- Double-check your `VITE_FIREBASE_API_KEY` value
- Ensure there are no extra spaces or quotes

### "auth/popup-closed-by-user" Error
- The user closed the Google popup before completing sign-in
- This is normal behavior, not an error

### Backend "Unauthorized" Errors
- Check that `FIREBASE_PRIVATE_KEY` is properly formatted with `\n` for newlines
- Verify the service account email is correct
- Ensure the service account has proper permissions

### Email Not Received
- Check spam/junk folders
- Verify the email address was entered correctly
- Firebase has daily email sending limits on the free tier

---

## Security Notes

1. **Never commit your `.env` file** to version control
2. **Never expose the service account private key** on the frontend
3. **The `FIREBASE_PRIVATE_KEY` is server-side only** - it never leaves your backend
4. **Firestore security rules** prevent users from accessing other users' data
5. **Firebase Authentication** handles all password security (hashing, salting, etc.)

---

## Files Modified in This Project

1. `.env` - Firebase configuration environment variables
2. `.env.example` - Template for environment variables
3. `src/main.tsx` - Wrapped app with AuthProvider
4. `src/App.tsx` - Routes with route guards
5. `src/lib/firebase.ts` - Firebase client SDK initialization
6. `src/contexts/AuthContext.tsx` - Firebase auth state management
7. `src/providers/trpc.tsx` - tRPC client with Firebase token headers
8. `src/pages/Home.tsx` - Landing page with auth-aware navigation
9. `src/pages/Login.tsx` - Email/password + Google login
10. `src/pages/Register.tsx` - Email/password registration with verification
11. `src/pages/ForgotPassword.tsx` - Password reset flow
12. `src/pages/Dashboard.tsx` - Protected dashboard page
13. `src/components/RouteGuard.tsx` - Route protection component
14. `api/lib/env.ts` - Backend environment variables
15. `api/lib/firebase-admin.ts` - Firebase Admin SDK initialization
16. `api/context.ts` - tRPC context with Firebase token verification
17. `api/middleware.ts` - Authed middleware for protected routes
18. `api/router.ts` - Updated with user router
19. `api/routers/user.ts` - User data endpoints (protected)
20. `api/services/user-service.ts` - Firestore user CRUD operations
