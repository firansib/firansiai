# Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** → Enter project name (e.g., `ai-media-assistant`)
3. Disable Google Analytics (optional) → Click **"Create project"**

## 2. Enable Authentication

1. In the Firebase Console, go to **Build → Authentication**
2. Click **"Get started"**
3. Enable the following sign-in providers:
   - **Email/Password** → Toggle on → Save
   - **Google** → Toggle on → Add your support email → Save

## 3. Create Firestore Database

1. Go to **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** → Select your region → Done

## 4. Set Firestore Security Rules

Go to **Firestore → Rules** and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chats/{chatId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Click **Publish**.

## 5. Get Your Firebase Config

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to **"Your apps"** → Click **"</> Web"**
3. Register app with a nickname → Copy the `firebaseConfig` object

## 6. Add Config to .env.local

Fill in your `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 7. Create Firestore Index (Required)

The app queries chats by `userId` ordered by `updatedAt`. Create a composite index:

1. Go to **Firestore → Indexes → Composite**
2. Click **"Add index"**
3. Collection: `chats`
4. Fields: `userId` (Ascending), `updatedAt` (Descending)
5. Click **Create**

> Alternatively, run the app and click the auto-generated index link in the browser console error.
