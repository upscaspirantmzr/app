// firebase_config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase Configuration ---
// IMPORTANT: Replace the following with your actual Firebase project configuration.
// Go to your Firebase project -> Project settings (gear icon) -> Your apps -> Web app -> Firebase SDK snippet -> Config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// This will be used as the 'appId' part in your Firestore paths (e.g., artifacts/YOUR_PROJECT_ID/...)
// It's recommended to use your Firebase Project ID here for consistency.
const appId = firebaseConfig.projectId;

let app, db, auth;

// Initialize Firebase only if configuration is valid
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} else {
    console.error("Firebase configuration is missing or incomplete. Please update the 'firebaseConfig' object in firebase_config.js.");
    // Display an error message on the page if possible
    document.addEventListener('DOMContentLoaded', () => {
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.textContent = "Error: Firebase configuration missing. Check console for details.";
        }
    });
}

export { app, db, auth, appId };
