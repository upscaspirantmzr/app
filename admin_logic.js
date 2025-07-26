// admin_logic.js

import { auth, db, appId } from './firebase_config.js';
import { currentUser, currentUserId, currentUserRole, currentUserProfile, isAuthReady, allCourses, showMessageModal, updateUIBasedOnRole } from './firebase_auth_listeners.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc, collection, onSnapshot, getDoc, updateDoc, query, where, addDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- DOM Elements ---
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');

// Admin Pages
const adminUsersList = document.getElementById('admin-users-list');
const addCourseForm = document.getElementById('add-course-form');
const courseNameInput = document.getElementById('course-name');
const courseDescriptionInput = document.getElementById('course-description');
const coursePaymentLinkInput = document.getElementById('course-payment-link');
const adminCoursesList = document.getElementById('admin-courses-list');
const addTargetForm = document.getElementById('add-target-form');
const targetCourseSelect = document.getElementById('target-course-select');
const targetDateInput = document.getElementById('target-date');
const targetTitleInput = document.getElementById('target-title');
const targetDescriptionInput = document.getElementById('target-description');
const adminTargetsList = document.getElementById('admin-targets-list');
const addDocumentForm = document.getElementById('add-document-form');
const documentCourseSelect = document.getElementById('document-course-select');
const documentTitleInput = document.getElementById('document-title');
const documentDescriptionInput = document.getElementById('document-description');
const documentFileUrlInput = document.getElementById('document-file-url');
const adminDocumentsList = document.getElementById('admin-documents-list');

// Test Series Admin Elements
const addEditTestSeriesFormContainer = document.getElementById('add-edit-test-series-form-container');
const testSeriesFormTitle = document.getElementById('test-series-form-title');
const addEditTestSeriesForm = document.getElementById('add-edit-test-series-form');
const editTestSeriesIdInput = document.getElementById('edit-test-series-id');
const testSeriesNameInput = document.getElementById('test-series-name');
const testSeriesDescriptionInput = document.getElementById('test-series-description');
const testSeriesCourseSelect = document.getElementById('test-series-course-select');
const testSeriesDurationInput = document.getElementById('test-series-duration');
const testSeriesTotalMarksInput = document.getElementById('test-series-total-marks');
const testSeriesPassMarksInput = document.getElementById('test-series-pass-marks');
const testSeriesStatusSelect = document.getElementById('test-series-status');
const cancelEditTestSeriesBtn = document.getElementById('cancel-edit-test-series-btn');
const adminTestSeriesList = document.getElementById('admin-test-series-list');

const manageQuestionsSection = document.getElementById('manage-questions-section');
const currentTestSeriesNameSpan = document.getElementById('current-test-series-name');
const backToTestSeriesListBtn = document.getElementById('back-to-test-series-list-btn');
const addQuestionForm = document.getElementById('add-question-form');
const editQuestionIdInput = document.getElementById('edit-question-id');
const questionTextInput = document.getElementById('question-text-input');
const option1Input = document.getElementById('option1');
const option2Input = document.getElementById('option2');
const option3Input = document.getElementById('option3');
const option4Input = document.getElementById('option4');
const correctOptionInput = document.getElementById('correct-option');
const questionMarksInput = document.getElementById('question-marks');
const questionExplanationInput = document.getElementById('question-explanation');
const saveQuestionBtn = document.getElementById('save-question-btn');
const cancelEditQuestionBtn = document.getElementById('cancel-edit-question-btn');
const questionsList = document.getElementById('questions-list');

let currentManagingTestSeriesId = null; // ID of the test series whose questions are being managed

// --- Page Navigation Function ---
window.showPage = (pageId) => {
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(`page-${pageId}`).style.display = 'block';

    // Update active navigation button style
    document.querySelectorAll('.nav-button').forEach(button => {
        button.classList.remove('active');
    });
    const activeButton = document.getElementById(`nav-${pageId}`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Trigger data loading for specific pages when navigated to
    if (pageId === 'admin-users') {
        loadAdminUsers();
    } else if (pageId === 'admin-courses') {
        loadAdminCourses();
    } else if (pageId === 'admin-targets') {
        loadAdminTargets();
    } else if (pageId === 'admin-documents') {
        loadAdminDocuments();
    } else if (pageId === 'admin-test-series') {
        loadAdminTestSeries();
        // Reset to test series list view when navigating to main test series page
        addEditTestSeriesFormContainer.classList.remove('hidden');
        adminTestSeriesList.classList.remove('hidden');
        manageQuestionsSection.classList.add('hidden');
        resetTestSeriesForm();
    }
};

// --- Authentication Event Listeners ---
if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMessageModal("Success", "Logged in successfully!");
            // Redirection handled by firebase_auth_listeners.js
        } catch (error) {
            console.error("Login error:", error);
            showMessageModal("Login Failed", error.message);
        }
    });
}

// --- Admin Portal Functions ---

async function loadAdminUsers() {
    if (!db || currentUserRole !== 'teacher') {
        adminUsersList.innerHTML = '<p class="text-red-600">Access Denied: You must be an admin to view this page.</p>';
        return;
    }

    const usersCollectionRef = collection(db, `artifacts/${appId}/users`);
    onSnapshot(usersCollectionRef, async (snapshot) => {
        adminUsersList.innerHTML = ''; // Clear existing list
        if (snapshot.empty) {
            adminUsersList.innerHTML = '<p class="text-gray-600">No users found.</p>';
            return;
        }

        for (const userDoc of snapshot.docs) {
            const userId = userDoc.id;
            const profileDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`);
            const profileSnap = await getDoc(profileDocRef);

            if (profileSnap.exists()) {
                const profile = profileSnap.data();
                // Fetch pending payment request for this user
                const paymentRequestsRef = collection(db, `artifacts/${appId}/public/data/paymentRequests`);
                const q = query(paymentRequestsRef, where('userId', '==', userId), where('status', '==', 'pending'));
                const paymentSnap = await getDocs(q);
                const hasPendingPayment = !paymentSnap.empty;
                const pendingPaymentCourseId = hasPendingPayment ? paymentSnap.docs[0].data().courseId : null;
                const pendingPaymentDocId = hasPendingPayment ? paymentSnap.docs[0].id : null;

                const userCard = `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">${profile.email}</h3>
                        <p class="text-sm text-gray-600">User ID: <span class="break-all">${userId}</span></p>
                        <p class="text-sm text-gray-600">Role: <span class="font-bold capitalize">${profile.role}</span></p>
                        <p class="text-sm text-gray-600">Payment Verified: <span class="font-bold ${profile.isPaymentVerified ? 'text-green-600' : 'text-red-600'}">${profile.isPaymentVerified ? 'Yes' : 'No'}</span></p>
                        <p class="text-sm text-gray-600 mb-4">Enrolled Courses: ${profile.enrolledCourses && profile.enrolledCourses.length > 0 ? profile.enrolledCourses.map(cid => allCourses.find(c => c.id === cid)?.name || cid).join(', ') : 'None'}</p>

                        ${hasPendingPayment ? `
                            <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 rounded-md mb-3">
                                <p class="font-bold">Pending Payment Request for: ${allCourses.find(c => c.id === pendingPaymentCourseId)?.name || 'Unknown Course'}</p>
                                <button data-user-id="${userId}" data-course-id="${pendingPaymentCourseId}" data-payment-doc-id="${pendingPaymentDocId}" class="verify-payment-btn mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-300">
                                    Verify Payment & Enroll
                                </button>
                            </div>
                        ` : ''}

                        <div class="flex flex-wrap gap-2 mt-4">
                            <button data-user-id="${userId}" data-current-role="${profile.role}" class="toggle-role-btn px-4 py-2 rounded-md ${profile.role === 'teacher' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'} text-white transition-colors duration-300">
                                ${profile.role === 'teacher' ? 'Demote to Student' : 'Promote to Teacher'}
                            </button>
                            <button data-user-id="${userId}" class="delete-user-btn px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300">
                                Delete User
                            </button>
                        </div>
                    </div>
                `;
                adminUsersList.insertAdjacentHTML('beforeend', userCard);
            }
        }
        attachAdminUserEventListeners();
    }, (error) => {
        console.error("Error fetching admin users:", error);
        adminUsersList.innerHTML = `<p class="text-red-600">Error loading users: ${error.message}</p>`;
    });
}

function attachAdminUserEventListeners() {
    document.querySelectorAll('.verify-payment-btn').forEach(button => {
        button.onclick = async (e) => {
            const userId = e.target.dataset.userId;
            const courseId = e.target.dataset.courseId;
            const paymentDocId = e.target.dataset.paymentDocId;
            showMessageModal("Confirm Verification", `Are you sure you want to verify payment for ${userId} and enroll in ${allCourses.find(c => c.id === courseId)?.name}?`, true, async (confirmed) => {
                if (confirmed) {
                    try {
                        // 1. Update user's profile: set isPaymentVerified to true and add courseId to enrolledCourses
                        const profileDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`);
                        const profileSnap = await getDoc(profileDocRef);
                        if (profileSnap.exists()) {
                            const currentEnrolledCourses = profileSnap.data().enrolledCourses || [];
                            const updatedEnrolledCourses = [...new Set([...currentEnrolledCourses, courseId])]; // Add unique courseId
                            await updateDoc(profileDocRef, {
                                isPaymentVerified: true,
                                enrolledCourses: updatedEnrolledCourses
                            });
                        }

                        // 2. Update payment request status to 'verified'
                        const paymentRequestDocRef = doc(db, `artifacts/${appId}/public/data/paymentRequests`, paymentDocId);
                        await updateDoc(paymentRequestDocRef, { status: 'verified' });

                        showMessageModal("Success", "Payment verified and student enrolled!");
                    } catch (error) {
                        console.error("Error verifying payment:", error);
                        showMessageModal("Error", `Failed to verify payment: ${error.message}`);
                    }
                }
            });
        };
    });

    document.querySelectorAll('.toggle-role-btn').forEach(button => {
        button.onclick = async (e) => {
            const userId = e.target.dataset.userId;
            const currentRole = e.target.dataset.currentRole;
            const newRole = currentRole === 'teacher' ? 'student' : 'teacher';
            showMessageModal("Confirm Role Change", `Are you sure you want to change ${userId}'s role to ${newRole}?`, true, async (confirmed) => {
                if (confirmed) {
                    try {
                        const profileDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`);
                        await updateDoc(profileDocRef, { role: newRole });
                        showMessageModal("Success", `User role updated to ${newRole}.`);
                    } catch (error) {
                        console.error("Error toggling role:", error);
                        showMessageModal("Error", `Failed to update role: ${error.message}`);
                    }
                }
            });
        };
    });

    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.onclick = async (e) => {
            const userIdToDelete = e.target.dataset.userId;
            showMessageModal("Confirm Deletion", `Are you sure you want to delete user ${userIdToDelete} and all their data? This action is irreversible.`, true, async (confirmed) => {
                if (confirmed) {
                    try {
                        // Delete user's profile document
                        await deleteDoc(doc(db, `artifacts/${appId}/users/${userIdToDelete}/profile`));
                        // You might also want to delete related payment requests, etc.
                        // For simplicity, we'll just delete the profile for now.
                        showMessageModal("Success", `User ${userIdToDelete} deleted.`);
                    } catch (error) {
                        console.error("Error deleting user:", error);
                        showMessageModal("Error", `Failed to delete user: ${error.message}`);
                    }
                }
            });
        };
    });
}


async function loadAdminCourses() {
    if (!db || currentUserRole !== 'teacher') {
        adminCoursesList.innerHTML = '<p class="text-red-600">Access Denied: You must be an admin to view this page.</p>';
        return;
    }

    const coursesRef = collection(db, `artifacts/${appId}/public/data/courses`);
    onSnapshot(coursesRef, (snapshot) => {
        allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        adminCoursesList.innerHTML = ''; // Clear existing list
        if (allCourses.length === 0) {
            adminCoursesList.innerHTML = '<p class="text-gray-600">No courses added yet.</p>';
        } else {
            allCourses.forEach(course => {
                const courseCard = `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">${course.name}</h3>
                        <p class="text-gray-700 mb-2">${course.description}</p>
                        <p class="text-sm text-gray-500 break-all">Payment Link: <a href="${course.paymentLink}" target="_blank" class="text-blue-600 hover:underline">${course.paymentLink}</a></p>
                        <div class="flex flex-wrap gap-2 mt-4">
                            <button data-course-id="${course.id}" class="edit-course-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300">
                                Edit
                            </button>
                            <button data-course-id="${course.id}" class="delete-course-btn px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
                adminCoursesList.insertAdjacentHTML('beforeend', courseCard);
            });
        }
        populateCourseSelects(); // Update course dropdowns across admin pages
    }, (error) => {
        console.error("Error fetching admin courses:", error);
        adminCoursesList.innerHTML = `<p class="text-red-600">Error loading courses: ${error.message}</p>`;
    });
}

if (addCourseForm) {
    addCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!db || currentUserRole !== 'teacher') {
            showMessageModal("Access Denied", "You must be an admin to add courses.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/courses`), {
                name: courseNameInput.value,
                description: courseDescriptionInput.value,
                paymentLink: coursePaymentLinkInput.value,
                createdAt: new Date().toISOString()
            });
            showMessageModal("Success", "Course added successfully!");
            addCourseForm.reset();
        } catch (error) {
            console.error("Error adding course:", error);
            showMessageModal("Error", `Failed to add course: ${error.message}`);
        }
    });
}

function populateCourseSelects() {
    // Clear and populate target-course-select
    if (targetCourseSelect) {
        targetCourseSelect.innerHTML = '<option value="">-- Select a Course --</option>';
        allCourses.forEach(course => {
            const optionTarget = document.createElement('option');
            optionTarget.value = course.id;
            optionTarget.textContent = course.name;
            targetCourseSelect.appendChild(optionTarget);
        });
    }

    // Clear and populate document-course-select
    if (documentCourseSelect) {
        documentCourseSelect.innerHTML = '<option value="">-- General Document --</option>'; // For documents, general is an option
        allCourses.forEach(course => {
            const optionDocument = document.createElement('option');
            optionDocument.value = course.id;
            optionDocument.textContent = course.name;
            documentCourseSelect.appendChild(optionDocument);
        });
    }

    // Clear and populate test-series-course-select
    if (testSeriesCourseSelect) {
        testSeriesCourseSelect.innerHTML = '<option value="">-- General Test Series --</option>';
        allCourses.forEach(course => {
            const optionTestSeries = document.createElement('option');
            optionTestSeries.value = course.id;
            optionTestSeries.textContent = course.name;
            testSeriesCourseSelect.appendChild(optionTestSeries);
        });
    }
}

async function loadAdminTargets() {
    if (!db || currentUserRole !== 'teacher') {
        adminTargetsList.innerHTML = '<p class="text-red-600">Access Denied: You must be an admin to view this page.</p>';
        return;
    }

    const targetsRef = collection(db, `artifacts/${appId}/public/data/targets`);
    onSnapshot(targetsRef, (snapshot) => {
        const targets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        targets.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

        adminTargetsList.innerHTML = ''; // Clear existing list
        if (targets.length === 0) {
            adminTargetsList.innerHTML = '<p class="text-gray-600">No targets added yet.</p>';
        } else {
            targets.forEach(target => {
                const targetCard = `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">${target.title}</h3>
                        <p class="text-sm text-gray-500 mb-2">Date: ${target.date} | Course: ${allCourses.find(c => c.id === target.courseId)?.name || 'N/A'}</p>
                        <p class="text-gray-700 mb-3">${target.description}</p>
                        <div class="flex flex-wrap gap-2 mt-4">
                            <button data-target-id="${target.id}" class="edit-target-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300">
                                Edit
                            </button>
                            <button data-target-id="${target.id}" class="delete-target-btn px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
                adminTargetsList.insertAdjacentHTML('beforeend', targetCard);
            });
        }
    }, (error) => {
        console.error("Error fetching admin targets:", error);
        adminTargetsList.innerHTML = `<p class="text-red-600">Error loading targets: ${error.message}</p>`;
    });
}

if (addTargetForm) {
    addTargetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!db || currentUserRole !== 'teacher') {
            showMessageModal("Access Denied", "You must be an admin to add targets.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/targets`), {
                courseId: targetCourseSelect.value,
                date: targetDateInput.value,
                title: targetTitleInput.value,
                description: targetDescriptionInput.value,
                createdAt: new Date().toISOString()
            });
            showMessageModal("Success", "Target added successfully!");
            addTargetForm.reset();
        } catch (error) {
            console.error("Error adding target:", error);
            showMessageModal("Error", `Failed to add target: ${error.message}`);
        }
    });
}

async function loadAdminDocuments() {
    if (!db || currentUserRole !== 'teacher') {
        adminDocumentsList.innerHTML = '<p class="text-red-600">Access Denied: You must be an admin to view this page.</p>';
        return;
    }

    const documentsRef = collection(db, `artifacts/${appId}/public/data/documents`);
    onSnapshot(documentsRef, (snapshot) => {
        const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)); // Sort by date descending

        adminDocumentsList.innerHTML = ''; // Clear existing list
        if (documents.length === 0) {
            adminDocumentsList.innerHTML = '<p class="text-gray-600">No documents added yet.</p>';
        } else {
            documents.forEach(docItem => {
                const docCard = `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">${docItem.title}</h3>
                        <p class="text-sm text-gray-500 mb-2">
                            Uploaded: ${new Date(docItem.uploadDate).toLocaleDateString()}
                            ${docItem.courseId ? `| Course: ${allCourses.find(c => c.id === docItem.courseId)?.name || 'N/A'}` : '| General'}
                        </p>
                        <p class="text-gray-700 mb-3">${docItem.description}</p>
                        <a href="${docItem.fileUrl}" target="_blank" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300">
                            View Document
                        </a>
                        <div class="flex flex-wrap gap-2 mt-4">
                            <button data-document-id="${docItem.id}" class="edit-document-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300">
                                Edit
                            </button>
                            <button data-document-id="${docItem.id}" class="delete-document-btn px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
                adminDocumentsList.insertAdjacentHTML('beforeend', docCard);
            });
        }
    }, (error) => {
        console.error("Error fetching admin documents:", error);
        adminDocumentsList.innerHTML = `<p class="text-red-600">Error loading documents: ${error.message}</p>`;
    });
}

if (addDocumentForm) {
    addDocumentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!db || currentUserRole !== 'teacher') {
            showMessageModal("Access Denied", "You must be an admin to add documents.");
            return;
        }
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/documents`), {
                courseId: documentCourseSelect.value || '', // Empty string for general documents
                title: documentTitleInput.value,
                description: documentDescriptionInput.value,
                fileUrl: documentFileUrlInput.value,
                uploadDate: new Date().toISOString()
            });
            showMessageModal("Success", "Document added successfully!");
            addDocumentForm.reset();
        } catch (error) {
            console.error("Error adding document:", error);
            showMessageModal("Error", `Failed to add document: ${error.message}`);
        }
    });
}

// --- Admin Test Series Functions ---

async function loadAdminTestSeries() {
    if (!db || currentUserRole !== 'teacher') {
        adminTestSeriesList.innerHTML = '<p class="text-red-600">Access Denied: You must be an admin to view this page.</p>';
        return;
    }

    const testSeriesRef = collection(db, `artifacts/${appId}/public/data/testSeries`);
    onSnapshot(testSeriesRef, (snapshot) => {
        const testSeries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        testSeries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by creation date

        adminTestSeriesList.innerHTML = '';
        if (testSeries.length === 0) {
            adminTestSeriesList.innerHTML = '<p class="text-gray-600">No test series added yet.</p>';
        } else {
            testSeries.forEach(test => {
                const testCard = `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">${test.name}</h3>
                        <p class="text-gray-700 mb-2">${test.description}</p>
                        <p class="text-sm text-gray-500">Duration: ${test.duration} mins | Total Marks: ${test.totalMarks}</p>
                        <p class="text-sm text-gray-500">Course: ${test.courseId ? (allCourses.find(c => c.id === test.courseId)?.name || 'N/A') : 'General'}</p>
                        <p class="text-sm text-gray-500">Status: <span class="font-bold ${test.status === 'published' ? 'text-green-600' : 'text-yellow-600'}">${test.status}</span></p>
                        <div class="flex flex-wrap gap-2 mt-4">
                            <button data-test-id="${test.id}" class="manage-questions-btn px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-300">
                                Manage Questions
                            </button>
                            <button data-test-id="${test.id}" class="edit-test-series-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300">
                                Edit
                            </button>
                            <button data-test-id="${test.id}" class="delete-test-series-btn px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
                adminTestSeriesList.insertAdjacentHTML('beforeend', testCard);
            });
            attachTestSeriesEventListeners();
        }
    }, (error) => {
        console.error("Error fetching admin test series:", error);
        adminTestSeriesList.innerHTML = `<p class="text-red-600">Error loading test series: ${error.message}</p>`;
    });
}

function attachTestSeriesEventListeners() {
    document.querySelectorAll('.manage-questions-btn').forEach(button => {
        button.onclick = (e) => {
            const testId = e.target.dataset.testId;
            const testName = e.target.closest('.bg-white').querySelector('h3').textContent;
            currentManagingTestSeriesId = testId;
            currentTestSeriesNameSpan.textContent = testName;
            addEditTestSeriesFormContainer.classList.add('hidden');
            adminTestSeriesList.classList.add('hidden');
            manageQuestionsSection.classList.remove('hidden');
            loadQuestionsForTestSeries(testId);
            resetQuestionForm();
        };
    });

    document.querySelectorAll('.edit-test-series-btn').forEach(button => {
        button.onclick = async (e) => {
            const testId = e.target.dataset.testId;
            const testDocRef = doc(db, `artifacts/${appId}/public/data/testSeries`, testId);
            const testDocSnap = await getDoc(testDocRef);
            if (testDocSnap.exists()) {
                const testData = testDocSnap.data();
                editTestSeriesIdInput.value = testId;
                testSeriesNameInput.value = testData.name;
                testSeriesDescriptionInput.value = testData.description;
                testSeriesCourseSelect.value = testData.courseId || '';
                testSeriesDurationInput.value = testData.duration;
                testSeriesTotalMarksInput.value = testData.totalMarks;
                testSeriesPassMarksInput.value = testData.passMarks || '';
                testSeriesStatusSelect.value = testData.status;

                testSeriesFormTitle.textContent = 'Edit Test Series';
                cancelEditTestSeriesBtn.classList.remove('hidden');
            } else {
                showMessageModal("Error", "Test series not found for editing.");
            }
        };
    });

    document.querySelectorAll('.delete-test-series-btn').forEach(button => {
        button.onclick = (e) => {
            const testId = e.target.dataset.testId;
            showMessageModal("Confirm Deletion", "Are you sure you want to delete this test series and all its questions? This action is irreversible.", true, async (confirmed) => {
                if (confirmed) {
                    try {
                        // Delete test series document
                        await deleteDoc(doc(db, `artifacts/${appId}/public/data/testSeries`, testId));
                        // Note: Deleting subcollections requires a Cloud Function or client-side batch delete if many questions.
                        // For simplicity, this client-side code assumes subcollection deletion is handled by rules or a cloud function.
                        // If not, you'd need to fetch all questions and delete them one by one.
                        showMessageModal("Success", "Test series deleted successfully!");
                    } catch (error) {
                        console.error("Error deleting test series:", error);
                        showMessageModal("Error", `Failed to delete test series: ${error.message}`);
                    }
                }
            });
        };
    });
}

if (addEditTestSeriesForm) {
    addEditTestSeriesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!db || currentUserRole !== 'teacher') {
            showMessageModal("Access Denied", "You must be an admin to manage test series.");
            return;
        }

        const testId = editTestSeriesIdInput.value;
        const testData = {
            name: testSeriesNameInput.value,
            description: testSeriesDescriptionInput.value,
            courseId: testSeriesCourseSelect.value || '',
            duration: parseInt(testSeriesDurationInput.value),
            totalMarks: parseInt(testSeriesTotalMarksInput.value),
            passMarks: testSeriesPassMarksInput.value ? parseInt(testSeriesPassMarksInput.value) : 0,
            status: testSeriesStatusSelect.value,
        };

        try {
            if (testId) {
                // Update existing test series
                await updateDoc(doc(db, `artifacts/${appId}/public/data/testSeries`, testId), testData);
                showMessageModal("Success", "Test series updated successfully!");
            } else {
                // Add new test series
                testData.createdAt = new Date().toISOString();
                await addDoc(collection(db, `artifacts/${appId}/public/data/testSeries`), testData);
                showMessageModal("Success", "Test series added successfully!");
            }
            resetTestSeriesForm();
        } catch (error) {
            console.error("Error saving test series:", error);
            showMessageModal("Error", `Failed to save test series: ${error.message}`);
        }
    });
}

if (cancelEditTestSeriesBtn) {
    cancelEditTestSeriesBtn.addEventListener('click', resetTestSeriesForm);
}

function resetTestSeriesForm() {
    addEditTestSeriesForm.reset();
    editTestSeriesIdInput.value = '';
    testSeriesFormTitle.textContent = 'Add New Test Series';
    cancelEditTestSeriesBtn.classList.add('hidden');
}

if (backToTestSeriesListBtn) {
    backToTestSeriesListBtn.addEventListener('click', () => {
        manageQuestionsSection.classList.add('hidden');
        addEditTestSeriesFormContainer.classList.remove('hidden');
        adminTestSeriesList.classList.remove('hidden');
        currentManagingTestSeriesId = null;
        loadAdminTestSeries(); // Reload list
    });
}

async function loadQuestionsForTestSeries(testId) {
    if (!db || !testId || currentUserRole !== 'teacher') {
        questionsList.innerHTML = '<p class="text-red-600">Cannot load questions. Invalid access or test series.</p>';
        return;
    }

    const questionsRef = collection(db, `artifacts/${appId}/public/data/testSeries/${testId}/questions`);
    onSnapshot(questionsRef, (snapshot) => {
        const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        questions.sort((a,b) => a.questionText.localeCompare(b.questionText)); // Sort questions alphabetically

        questionsList.innerHTML = '';
        if (questions.length === 0) {
            questionsList.innerHTML = '<p class="text-gray-600">No questions added yet for this test series.</p>';
        } else {
            questions.forEach(question => {
                const questionCard = `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <p class="font-semibold text-gray-800 mb-2">${question.questionText}</p>
                        <ul class="list-disc list-inside text-gray-700 text-sm mb-2">
                            ${question.options.map((opt, idx) => `
                                <li class="${idx === question.correctAnswerIndex ? 'font-bold text-green-600' : ''}">
                                    ${opt} ${idx === question.correctAnswerIndex ? '(Correct)' : ''}
                                </li>
                            `).join('')}
                        </ul>
                        <p class="text-sm text-gray-600">Marks: ${question.marks}</p>
                        <p class="text-sm text-gray-600">Explanation: ${question.explanation || 'N/A'}</p>
                        <div class="flex flex-wrap gap-2 mt-4">
                            <button data-question-id="${question.id}" class="edit-question-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300">
                                Edit
                            </button>
                            <button data-question-id="${question.id}" class="delete-question-btn px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-300">
                                Delete
                            </button>
                        </div>
                    </div>
                `;
                questionsList.insertAdjacentHTML('beforeend', questionCard);
            });
            attachQuestionEventListeners();
        }
    }, (error) => {
        console.error("Error fetching questions:", error);
        questionsList.innerHTML = `<p class="text-red-600">Error loading questions: ${error.message}</p>`;
    });
}

function attachQuestionEventListeners() {
    document.querySelectorAll('.edit-question-btn').forEach(button => {
        button.onclick = async (e) => {
            const questionId = e.target.dataset.questionId;
            const questionDocRef = doc(db, `artifacts/${appId}/public/data/testSeries/${currentManagingTestSeriesId}/questions`, questionId);
            const questionDocSnap = await getDoc(questionDocRef);
            if (questionDocSnap.exists()) {
                const questionData = questionDocSnap.data();
                editQuestionIdInput.value = questionId;
                questionTextInput.value = questionData.questionText;
                option1Input.value = questionData.options[0] || '';
                option2Input.value = questionData.options[1] || '';
                option3Input.value = questionData.options[2] || '';
                option4Input.value = questionData.options[3] || '';
                correctOptionInput.value = questionData.correctAnswerIndex + 1; // Convert 0-indexed to 1-indexed
                questionMarksInput.value = questionData.marks || 1;
                questionExplanationInput.value = questionData.explanation || '';

                saveQuestionBtn.textContent = 'Update Question';
                cancelEditQuestionBtn.classList.remove('hidden');
            } else {
                showMessageModal("Error", "Question not found for editing.");
            }
        };
    });

    document.querySelectorAll('.delete-question-btn').forEach(button => {
        button.onclick = (e) => {
            const questionId = e.target.dataset.questionId;
            showMessageModal("Confirm Deletion", "Are you sure you want to delete this question?", true, async (confirmed) => {
                if (confirmed) {
                    try {
                        await deleteDoc(doc(db, `artifacts/${appId}/public/data/testSeries/${currentManagingTestSeriesId}/questions`, questionId));
                        showMessageModal("Success", "Question deleted successfully!");
                    } catch (error) {
                        console.error("Error deleting question:", error);
                        showMessageModal("Error", `Failed to delete question: ${error.message}`);
                    }
                }
            });
        };
    });
}

if (addQuestionForm) {
    addQuestionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!db || currentUserRole !== 'teacher' || !currentManagingTestSeriesId) {
            showMessageModal("Access Denied", "You must be an admin and select a test series to add questions.");
            return;
        }

        const questionId = editQuestionIdInput.value;
        const questionData = {
            questionText: questionTextInput.value,
            options: [option1Input.value, option2Input.value, option3Input.value, option4Input.value],
            correctAnswerIndex: parseInt(correctOptionInput.value) - 1, // Convert to 0-indexed
            marks: parseInt(questionMarksInput.value),
            explanation: questionExplanationInput.value,
        };

        // Basic validation for options and correct answer index
        if (questionData.options.some(opt => opt.trim() === '') || questionData.correctAnswerIndex < 0 || questionData.correctAnswerIndex > 3) {
            showMessageModal("Validation Error", "Please ensure all 4 options are filled and a valid correct option (1-4) is selected.");
            return;
        }

        try {
            if (questionId) {
                // Update existing question
                await updateDoc(doc(db, `artifacts/${appId}/public/data/testSeries/${currentManagingTestSeriesId}/questions`, questionId), questionData);
                showMessageModal("Success", "Question updated successfully!");
            } else {
                // Add new question
                await addDoc(collection(db, `artifacts/${appId}/public/data/testSeries/${currentManagingTestSeriesId}/questions`), questionData);
                showMessageModal("Success", "Question added successfully!");
            }
            resetQuestionForm();
        } catch (error) {
            console.error("Error saving question:", error);
            showMessageModal("Error", `Failed to save question: ${error.message}`);
        }
    });
}

if (cancelEditQuestionBtn) {
    cancelEditQuestionBtn.addEventListener('click', resetQuestionForm);
}

function resetQuestionForm() {
    addQuestionForm.reset();
    editQuestionIdInput.value = '';
    saveQuestionBtn.textContent = 'Add Question';
    cancelEditQuestionBtn.classList.add('hidden');
    questionMarksInput.value = 1; // Reset to default
}

// Initial page load for admin portal
document.addEventListener('DOMContentLoaded', () => {
    // This is handled by firebase_auth_listeners.js, which calls updateUIBasedOnRole
    // updateUIBasedOnRole will then call showPage('admin-dashboard') if current user is teacher.
});
