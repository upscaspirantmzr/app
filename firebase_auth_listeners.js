// firebase_auth_listeners.js

import { auth, db, appId } from './firebase_config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc, collection, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js"; // Added getDocs

let currentUser = null; // Firebase User object
let currentUserId = null;
let currentUserRole = null;
let currentUserProfile = null; // Stores user profile from Firestore
let isAuthReady = false;
let allCourses = []; // Cache all courses for selection dropdowns

// --- Utility Functions (for modals) ---
const messageModal = document.getElementById('message-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalButtons = document.getElementById('modal-buttons'); // Get the buttons container

function showMessageModal(title, message, isConfirm = false, callback = null) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    if (modalButtons) { // Ensure modalButtons exists before manipulating
        modalButtons.innerHTML = ''; // Clear previous buttons
    }


    if (isConfirm) {
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.className = 'modal-confirm-btn mr-2'; // Use defined classes
        confirmBtn.onclick = () => {
            messageModal.classList.add('hidden');
            if (callback) callback(true);
        };
        if (modalButtons) modalButtons.appendChild(confirmBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'modal-cancel-btn'; // Use defined classes
        cancelBtn.onclick = () => {
            messageModal.classList.add('hidden');
            if (callback) callback(false);
        };
        if (modalButtons) modalButtons.appendChild(cancelBtn);
    } else {
        const closeBtn = document.createElement('button');
        closeBtn.id = 'modal-close-btn'; // Re-add ID if needed for other listeners
        closeBtn.className = 'px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300';
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => {
            messageModal.classList.add('hidden');
            if (callback) callback(); // No 'false' for simple close
        };
        if (modalButtons) modalButtons.appendChild(closeBtn);
    }
    messageModal.classList.remove('hidden');
}

// --- Firebase Authentication Listener ---
if (auth) {
    onAuthStateChanged(auth, async (user) => {
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden'); // Hide loading spinner once auth state is determined
        }

        if (user) {
            currentUser = user;
            currentUserId = user.uid;
            // Fetch user profile from Firestore
            await fetchUserProfile(currentUserId);
            console.log("User signed in:", currentUserId, "Role:", currentUserRole);
            updateUIBasedOnRole(); // Update UI after auth state and profile are ready
        } else {
            currentUser = null;
            currentUserId = null;
            currentUserRole = null;
            currentUserProfile = null;
            // Redirect to login page if not authenticated
            const currentPage = window.location.pathname.split('/').pop();
            if (currentPage !== 'student_portal.html' && currentPage !== 'admin_portal.html' && currentPage !== 'index.html') {
                 // Only redirect if not already on the login page to prevent infinite loops
                window.location.href = 'student_portal.html'; // Default to student login for simplicity
            } else if (currentPage === 'admin_portal.html') {
                 // If on admin page and not logged in, redirect to student login
                window.location.href = 'student_portal.html';
            }
            updateUIBasedOnRole(); // Update UI to reflect logged out state
        }
        isAuthReady = true;
    });
}

async function fetchUserProfile(uid) {
    if (!db) return;
    const profileDocRef = doc(db, `artifacts/${appId}/users/${uid}/profile`);
    try {
        const docSnap = await getDoc(profileDocRef);
        if (docSnap.exists()) {
            currentUserProfile = docSnap.data();
            currentUserRole = currentUserProfile.role || 'student'; // Default to student
        } else {
            // Create a new profile for the user if it doesn't exist
            // This happens on new registration. Role defaults to 'student'.
            currentUserProfile = {
                email: currentUser.email,
                role: 'student',
                enrolledCourses: [],
                isPaymentVerified: false,
                registrationDate: new Date().toISOString()
            };
            await setDoc(profileDocRef, currentUserProfile);
            currentUserRole = 'student';
        }
    } catch (error) {
        console.error("Error fetching or creating user profile:", error);
        showMessageModal("Profile Error", `Could not load user profile: ${error.message}`);
    }
}

function updateUIBasedOnRole() {
    const userIdDisplay = document.getElementById('user-id-display');
    const currentUserIdElement = document.getElementById('current-user-id');
    const currentUserRoleElement = document.getElementById('current-user-role');
    const navLogoutBtn = document.getElementById('nav-logout');
    const navLoginBtn = document.getElementById('nav-login');

    // Update common UI elements
    if (currentUserId) {
        currentUserIdElement.textContent = currentUserId;
        currentUserRoleElement.textContent = currentUserRole;
        userIdDisplay.classList.remove('hidden');
        navLogoutBtn.classList.remove('hidden');
        navLoginBtn.classList.add('hidden');
    } else {
        currentUserIdElement.textContent = '';
        currentUserRoleElement.textContent = '';
        userIdDisplay.classList.add('hidden');
        navLogoutBtn.classList.add('hidden');
        navLoginBtn.classList.remove('hidden');
    }

    // Hide/show navigation buttons based on role for the current page
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.add('hidden'));
    if (currentUserId) {
        if (currentUserRole === 'student') {
            document.getElementById('nav-student-dashboard').classList.remove('hidden');
            document.getElementById('nav-student-targets').classList.remove('hidden');
            document.getElementById('nav-student-documents').classList.remove('hidden');
            document.getElementById('nav-student-test-series').classList.remove('hidden'); // New
            document.getElementById('nav-student-payment').classList.remove('hidden');
        } else if (currentUserRole === 'teacher') {
            document.getElementById('nav-admin-dashboard').classList.remove('hidden');
            // Admin sub-nav will be managed within admin_logic.js
        }
        navLogoutBtn.classList.remove('hidden');
    } else {
        navLoginBtn.classList.remove('hidden');
    }

    // Update current page active state
    const currentNavButton = document.getElementById(`nav-${getCurrentPageId()}`);
    if (currentNavButton) {
        document.querySelectorAll('.nav-button').forEach(button => button.classList.remove('active'));
        currentNavButton.classList.add('active');
    }

    // Initial page load for student/admin portal
    const currentPage = window.location.pathname.split('/').pop();
    if (isAuthReady && currentUserId) {
        if (currentUserRole === 'student' && currentPage === 'student_portal.html') {
            window.showPage('student-dashboard');
        } else if (currentUserRole === 'teacher' && currentPage === 'admin_portal.html') {
            window.showPage('admin-dashboard');
        }
    } else if (isAuthReady && !currentUserId && currentPage === 'student_portal.html') {
        window.showPage('login'); // Show login on student portal if not authenticated
    } else if (isAuthReady && !currentUserId && currentPage === 'admin_portal.html') {
        window.showPage('login'); // Show login on admin portal if not authenticated
    }
}

function getCurrentPageId() {
    const path = window.location.pathname.split('/').pop();
    if (path === 'student_portal.html') return 'student-dashboard'; // Default student page
    if (path === 'admin_portal.html') return 'admin-dashboard'; // Default admin page
    return 'login'; // Default for login/register page
}

// --- Common Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const navLogoutBtn = document.getElementById('nav-logout');
    if (navLogoutBtn) {
        navLogoutBtn.addEventListener('click', async () => {
            if (auth) {
                try {
                    await signOut(auth);
                    showMessageModal("Logged Out", "You have been successfully logged out.");
                    window.location.href = 'student_portal.html'; // Redirect to student login after logout
                } catch (error) {
                    console.error("Error logging out:", error);
                    showMessageModal("Logout Error", error.message);
                }
            }
        });
    }
});

// Listener for allCourses update (used by both student and admin)
if (db) {
    const coursesRef = collection(db, `artifacts/${appId}/public/data/courses`);
    onSnapshot(coursesRef, (snapshot) => {
        allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("All courses updated:", allCourses);
        // Trigger re-render/update for components that depend on allCourses
        // This will be handled by specific page logic (e.g., populateCourseSelects)
    }, (error) => {
        console.error("Error loading courses for initial setup:", error);
    });
}


export { currentUser, currentUserId, currentUserRole, currentUserProfile, isAuthReady, allCourses, showMessageModal, updateUIBasedOnRole };
