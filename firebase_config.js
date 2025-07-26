// firebase_config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase Configuration ---
// IMPORTANT: Replace the following with your actual Firebase project configuration.
// Go to your Firebase project -> Project settings (gear icon) -> Your apps -> Web app -> Firebase SDK snippet -> Config
const firebaseConfig = {
  apiKey: "AIzaSyB47PN51DxVExryra_tYeW2kuGNK9wmyFo",
  authDomain: "upscbuddymzr.firebaseapp.com",
  projectId: "upscbuddymzr",
  storageBucket: "upscbuddymzr.firebasestorage.app",
  messagingSenderId: "478927698160",
  appId: "1:478927698160:web:53fb75ad368005bd0b6a35",
  measurementId: "G-P9P6K4VVEQ"
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
