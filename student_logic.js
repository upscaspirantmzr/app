// student_logic.js

import { auth, db, appId } from './firebase_config.js';
import { currentUser, currentUserId, currentUserRole, currentUserProfile, isAuthReady, allCourses, showMessageModal, updateUIBasedOnRole } from './firebase_auth_listeners.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc, collection, onSnapshot, query, where, addDoc, getDocs, updateDoc, getDoc as getFirestoreDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- DOM Elements ---
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');

// Student Pages
const studentTargetsList = document.getElementById('student-targets-list');
const studentDocumentsList = document.getElementById('student-documents-list');
const enrollmentStatusSpan = document.getElementById('enrollment-status');
const paymentVerificationStatusSpan = document.getElementById('payment-verification-status');
const selectCourseToEnroll = document.getElementById('select-course-to-enroll');
const selectedCoursePaymentLinkContainer = document.getElementById('selected-course-payment-link-container');
const selectedCourseNameSpan = document.getElementById('selected-course-name');
const selectedCoursePaymentLink = document.getElementById('selected-course-payment-link');
const requestPaymentVerificationBtn = document.getElementById('request-payment-verification-btn');

// Test Series Elements
const testListView = document.getElementById('test-list-view');
const availableTestSeriesList = document.getElementById('available-test-series-list');
const testTakingView = document.getElementById('test-taking-view');
const testTitleElement = document.getElementById('test-title');
const currentQuestionNumberElement = document.getElementById('current-question-number');
const totalQuestionsElement = document.getElementById('total-questions');
const questionTextElement = document.getElementById('question-text');
const questionOptionsElement = document.getElementById('question-options');
const prevQuestionBtn = document.getElementById('prev-question-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');
const submitTestBtn = document.getElementById('submit-test-btn');
const testResultsView = document.getElementById('test-results-view');
const resultScoreElement = document.getElementById('result-score');
const resultTotalMarksElement = document.getElementById('result-total-marks');
const resultCorrectCountElement = document.getElementById('result-correct-count');
const resultIncorrectCountElement = document.getElementById('result-incorrect-count');
const resultStatusElement = document.getElementById('result-status');
const reviewAnswersBtn = document.getElementById('review-answers-btn');
const backToTestsBtn = document.getElementById('back-to-tests-btn');
const reviewQuestionsList = document.getElementById('review-questions-list');

let currentTestSeries = null;
let currentQuestions = [];
let studentAnswers = [];
let currentQuestionIndex = 0;

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
    if (pageId === 'student-targets') {
        loadStudentTargets();
    } else if (pageId === 'student-documents') {
        loadStudentDocuments();
    } else if (pageId === 'student-payment') {
        loadStudentPaymentStatus();
    } else if (pageId === 'student-test-series') {
        loadStudentTestSeries();
        // Reset test views when navigating to test series main page
        testListView.classList.remove('hidden');
        testTakingView.classList.add('hidden');
        testResultsView.classList.add('hidden');
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

if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Create user profile in Firestore
            const profileDocRef = doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile`);
            await setDoc(profileDocRef, {
                email: email,
                role: 'student', // Default role for new registrations
                enrolledCourses: [],
                isPaymentVerified: false,
                registrationDate: new Date().toISOString()
            });
            showMessageModal("Success", "Registered successfully! You are now a student. Please complete payment verification.");
            // Redirection handled by firebase_auth_listeners.js
        } catch (error) {
            console.error("Registration error:", error);
            showMessageModal("Registration Failed", error.message);
        }
    });
}

// --- Student Portal Functions ---

async function loadStudentTargets() {
    if (!db || !currentUserId || !currentUserProfile || !currentUserProfile.isPaymentVerified) {
        studentTargetsList.innerHTML = '<p class="text-red-600">You need to be enrolled and have your payment verified to view targets.</p>';
        return;
    }

    if (currentUserProfile.enrolledCourses.length === 0) {
        studentTargetsList.innerHTML = '<p class="text-gray-600">You are not enrolled in any courses yet. Please enroll via the Payment section.</p>';
        return;
    }

    const targetsRef = collection(db, `artifacts/${appId}/public/data/targets`);
    const q = query(targetsRef, where('courseId', 'in', currentUserProfile.enrolledCourses));

    onSnapshot(q, (snapshot) => {
        const targets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        targets.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

        studentTargetsList.innerHTML = ''; // Clear existing list
        if (targets.length === 0) {
            studentTargetsList.innerHTML = '<p class="text-gray-600">No daily targets available for your enrolled courses yet.</p>';
        } else {
            targets.forEach(target => {
                const targetCard = `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">${target.title}</h3>
                        <p class="text-sm text-gray-500 mb-2">Date: ${target.date} | Course: ${allCourses.find(c => c.id === target.courseId)?.name || 'N/A'}</p>
                        <p class="text-gray-700">${target.description}</p>
                    </div>
                `;
                studentTargetsList.insertAdjacentHTML('beforeend', targetCard);
            });
        }
    }, (error) => {
        console.error("Error fetching student targets:", error);
        studentTargetsList.innerHTML = `<p class="text-red-600">Error loading targets: ${error.message}</p>`;
    });
}

async function loadStudentDocuments() {
    if (!db || !currentUserId || !currentUserProfile || !currentUserProfile.isPaymentVerified) {
        studentDocumentsList.innerHTML = '<p class="text-red-600">You need to be enrolled and have your payment verified to view documents.</p>';
        return;
    }

    if (currentUserProfile.enrolledCourses.length === 0) {
        studentDocumentsList.innerHTML = '<p class="text-gray-600">You are not enrolled in any courses yet. Please enroll via the Payment section.</p>';
        return;
    }

    const documentsRef = collection(db, `artifacts/${appId}/public/data/documents`);
    // Query for documents that are either general (no courseId) or for enrolled courses
    const q = query(documentsRef, where('courseId', 'in', [...currentUserProfile.enrolledCourses, ''])); // '' for general documents

    onSnapshot(q, (snapshot) => {
        const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)); // Sort by date descending

        studentDocumentsList.innerHTML = ''; // Clear existing list
        if (documents.length === 0) {
            studentDocumentsList.innerHTML = '<p class="text-gray-600">No documents available for your enrolled courses yet.</p>';
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
                    </div>
                `;
                studentDocumentsList.insertAdjacentHTML('beforeend', docCard);
            });
        }
    }, (error) => {
        console.error("Error fetching student documents:", error);
        studentDocumentsList.innerHTML = `<p class="text-red-600">Error loading documents: ${error.message}</p>`;
    });
}

async function loadStudentPaymentStatus() {
    if (!db || !currentUserId || !currentUserProfile) return;

    // Update enrollment status
    if (currentUserProfile.enrolledCourses && currentUserProfile.enrolledCourses.length > 0) {
        enrollmentStatusSpan.textContent = `Enrolled in ${currentUserProfile.enrolledCourses.length} course(s)`;
        enrollmentStatusSpan.classList.remove('text-red-800');
        enrollmentStatusSpan.classList.add('text-green-800');
    } else {
        enrollmentStatusSpan.textContent = 'Not Enrolled';
        enrollmentStatusSpan.classList.remove('text-green-800');
        enrollmentStatusSpan.classList.add('text-red-800');
    }

    // Update payment verification status
    if (currentUserProfile.isPaymentVerified) {
        paymentVerificationStatusSpan.textContent = 'Verified';
        paymentVerificationStatusSpan.classList.remove('text-red-800', 'text-yellow-800');
        paymentVerificationStatusSpan.classList.add('text-green-800');
    } else {
        paymentVerificationStatusSpan.textContent = 'Pending Verification / Not Paid';
        paymentVerificationStatusSpan.classList.remove('text-green-800');
        paymentVerificationStatusSpan.classList.add('text-red-800');
    }

    // Populate course selection for enrollment
    selectCourseToEnroll.innerHTML = '<option value="">-- Select a Course --</option>';
    allCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        selectCourseToEnroll.appendChild(option);
    });

    // Handle selection change for payment link
    selectCourseToEnroll.addEventListener('change', () => {
        const selectedCourseId = selectCourseToEnroll.value;
        const selectedCourse = allCourses.find(c => c.id === selectedCourseId);
        if (selectedCourse) {
            selectedCourseNameSpan.textContent = selectedCourse.name;
            selectedCoursePaymentLink.href = selectedCourse.paymentLink;
            selectedCoursePaymentLinkContainer.classList.remove('hidden');
            requestPaymentVerificationBtn.disabled = false;
        } else {
            selectedCoursePaymentLinkContainer.classList.add('hidden');
            requestPaymentVerificationBtn.disabled = true;
        }
    });

    // Check for existing pending payment requests for the current user
    const paymentRequestsRef = collection(db, `artifacts/${appId}/public/data/paymentRequests`);
    const q = query(paymentRequestsRef, where('userId', '==', currentUserId), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        requestPaymentVerificationBtn.textContent = 'Verification Request Sent (Pending)';
        requestPaymentVerificationBtn.disabled = true;
        requestPaymentVerificationBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        requestPaymentVerificationBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
    } else {
        requestPaymentVerificationBtn.textContent = 'Request Payment Verification';
        requestPaymentVerificationBtn.disabled = false;
        requestPaymentVerificationBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
        requestPaymentVerificationBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
    }
}

if (requestPaymentVerificationBtn) {
    requestPaymentVerificationBtn.addEventListener('click', async () => {
        const selectedCourseId = selectCourseToEnroll.value;
        if (!selectedCourseId) {
            showMessageModal("Error", "Please select a course to request verification for.");
            return;
        }
        if (!db || !currentUserId || !currentUser) {
            showMessageModal("Error", "User not authenticated or Firestore not ready.");
            return;
        }

        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/paymentRequests`), {
                userId: currentUserId,
                courseId: selectedCourseId,
                requestDate: new Date().toISOString(),
                status: 'pending', // Admin will change this to 'verified'
                userEmail: currentUser.email // For admin's reference
            });
            showMessageModal("Success", "Payment verification request sent! Admin will review it shortly.");
            requestPaymentVerificationBtn.textContent = 'Verification Request Sent (Pending)';
            requestPaymentVerificationBtn.disabled = true;
            requestPaymentVerificationBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
            requestPaymentVerificationBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
        } catch (error) {
            console.error("Error sending payment verification request:", error);
            showMessageModal("Error", `Failed to send request: ${error.message}`);
        }
    });
}

// --- Test Series Functions ---

async function loadStudentTestSeries() {
    if (!db || !currentUserId || !currentUserProfile || !currentUserProfile.isPaymentVerified) {
        availableTestSeriesList.innerHTML = '<p class="text-red-600">You need to be enrolled and have your payment verified to access test series.</p>';
        return;
    }

    if (currentUserProfile.enrolledCourses.length === 0) {
        availableTestSeriesList.innerHTML = '<p class="text-gray-600">You are not enrolled in any courses yet. Please enroll via the Payment section to access test series.</p>';
        return;
    }

    const testSeriesRef = collection(db, `artifacts/${appId}/public/data/testSeries`);
    // Only show published tests that are either general or for enrolled courses
    const q = query(testSeriesRef, where('status', '==', 'published'), where('courseId', 'in', [...currentUserProfile.enrolledCourses, '']));

    onSnapshot(q, (snapshot) => {
        const testSeries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        testSeries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by creation date

        availableTestSeriesList.innerHTML = '';
        if (testSeries.length === 0) {
            availableTestSeriesList.innerHTML = '<p class="text-gray-600">No test series available yet.</p>';
        } else {
            testSeries.forEach(test => {
                const testCard = `
                    <div class="bg-white p-6 rounded-lg shadow-md">
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">${test.name}</h3>
                        <p class="text-gray-700 mb-2">${test.description}</p>
                        <p class="text-sm text-gray-500">Duration: ${test.duration} mins | Total Marks: ${test.totalMarks}</p>
                        <p class="text-sm text-gray-500">Course: ${test.courseId ? (allCourses.find(c => c.id === test.courseId)?.name || 'N/A') : 'General'}</p>
                        <button data-test-id="${test.id}" class="start-test-btn mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300">
                            Start Test
                        </button>
                    </div>
                `;
                availableTestSeriesList.insertAdjacentHTML('beforeend', testCard);
            });
            document.querySelectorAll('.start-test-btn').forEach(button => {
                button.addEventListener('click', (e) => startTest(e.target.dataset.testId));
            });
        }
    }, (error) => {
        console.error("Error fetching test series:", error);
        availableTestSeriesList.innerHTML = `<p class="text-red-600">Error loading test series: ${error.message}</p>`;
    });
}

async function startTest(testId) {
    if (!db || !currentUserId) {
        showMessageModal("Error", "User not authenticated or Firestore not ready.");
        return;
    }

    try {
        // Fetch test series details
        const testDocRef = doc(db, `artifacts/${appId}/public/data/testSeries`, testId);
        const testDocSnap = await getFirestoreDoc(testDocRef);
        if (!testDocSnap.exists()) {
            showMessageModal("Error", "Test series not found.");
            return;
        }
        currentTestSeries = { id: testDocSnap.id, ...testDocSnap.data() };

        // Fetch questions for the test series
        const questionsRef = collection(db, `artifacts/${appId}/public/data/testSeries/${testId}/questions`);
        const questionsSnapshot = await getDocs(questionsRef);
        currentQuestions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        currentQuestions.sort((a,b) => a.questionText.localeCompare(b.questionText)); // Simple sort for consistency

        if (currentQuestions.length === 0) {
            showMessageModal("Error", "No questions found for this test series.");
            return;
        }

        // Initialize student answers array
        studentAnswers = Array(currentQuestions.length).fill(null);
        currentQuestionIndex = 0;

        // Update UI to test taking view
        testListView.classList.add('hidden');
        testResultsView.classList.add('hidden');
        testTakingView.classList.remove('hidden');

        testTitleElement.textContent = currentTestSeries.name;
        totalQuestionsElement.textContent = currentQuestions.length;

        displayQuestion();
        attachTestNavigationListeners();

    } catch (error) {
        console.error("Error starting test:", error);
        showMessageModal("Error", `Failed to start test: ${error.message}`);
    }
}

function displayQuestion() {
    if (currentQuestions.length === 0) return;

    const question = currentQuestions[currentQuestionIndex];
    currentQuestionNumberElement.textContent = currentQuestionIndex + 1;
    questionTextElement.textContent = question.questionText;
    questionOptionsElement.innerHTML = ''; // Clear previous options

    question.options.forEach((optionText, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'flex items-center';
        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = 'question-option';
        radioInput.value = index;
        radioInput.id = `option-${index}`;
        radioInput.className = 'mr-2';
        radioInput.checked = studentAnswers[currentQuestionIndex] === index; // Retain selection

        radioInput.addEventListener('change', (e) => {
            studentAnswers[currentQuestionIndex] = parseInt(e.target.value);
            console.log(`Question ${currentQuestionIndex + 1} answer: ${studentAnswers[currentQuestionIndex]}`);
        });

        const label = document.createElement('label');
        label.htmlFor = `option-${index}`;
        label.textContent = optionText;
        label.className = 'text-gray-700';

        optionDiv.appendChild(radioInput);
        optionDiv.appendChild(label);
        questionOptionsElement.appendChild(optionDiv);
    });

    // Update navigation button states
    prevQuestionBtn.disabled = currentQuestionIndex === 0;
    nextQuestionBtn.disabled = currentQuestionIndex === currentQuestions.length - 1;
    submitTestBtn.classList.toggle('hidden', currentQuestionIndex !== currentQuestions.length - 1);
}

function attachTestNavigationListeners() {
    prevQuestionBtn.onclick = () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        }
    };

    nextQuestionBtn.onclick = () => {
        if (currentQuestionIndex < currentQuestions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        }
    };

    submitTestBtn.onclick = () => {
        showMessageModal("Confirm Submission", "Are you sure you want to submit the test?", true, (confirmed) => {
            if (confirmed) {
                submitTest();
            }
        });
    };
}

async function submitTest() {
    if (!db || !currentUserId || !currentTestSeries || currentQuestions.length === 0) {
        showMessageModal("Error", "Test data missing. Cannot submit.");
        return;
    }

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    const answeredQuestions = [];

    currentQuestions.forEach((question, index) => {
        const selectedOption = studentAnswers[index];
        const isCorrect = selectedOption !== null && selectedOption === question.correctAnswerIndex;

        if (isCorrect) {
            score += question.marks || 1; // Default 1 mark per question if not specified
            correctCount++;
        } else if (selectedOption !== null) {
            incorrectCount++;
        }

        answeredQuestions.push({
            questionId: question.id,
            selectedOptionIndex: selectedOption,
            isCorrect: isCorrect,
            questionText: question.questionText,
            options: question.options,
            correctAnswerIndex: question.correctAnswerIndex,
            explanation: question.explanation || 'No explanation provided.'
        });
    });

    try {
        // Save test attempt to Firestore
        const testAttemptsRef = collection(db, `artifacts/${appId}/users/${currentUserId}/testAttempts`);
        await addDoc(testAttemptsRef, {
            testSeriesId: currentTestSeries.id,
            testSeriesName: currentTestSeries.name,
            userId: currentUserId,
            score: score,
            totalMarks: currentTestSeries.totalMarks,
            totalQuestions: currentQuestions.length,
            correctCount: correctCount,
            incorrectCount: incorrectCount,
            attemptDate: new Date().toISOString(),
            answers: answeredQuestions // Store detailed answers for review
        });

        displayTestResults(score, currentTestSeries.totalMarks, correctCount, incorrectCount, answeredQuestions);

    } catch (error) {
        console.error("Error submitting test:", error);
        showMessageModal("Error", `Failed to submit test: ${error.message}`);
    }
}

function displayTestResults(score, totalMarks, correctCount, incorrectCount, answeredQuestions) {
    testTakingView.classList.add('hidden');
    testListView.classList.add('hidden');
    testResultsView.classList.remove('hidden');

    resultScoreElement.textContent = score;
    resultTotalMarksElement.textContent = totalMarks;
    resultCorrectCountElement.textContent = correctCount;
    resultIncorrectCountElement.textContent = incorrectCount;

    const passStatus = score >= (currentTestSeries.passMarks || 0) ? 'Passed' : 'Failed';
    resultStatusElement.textContent = passStatus;
    resultStatusElement.className = `font-bold ${passStatus === 'Passed' ? 'text-green-600' : 'text-red-600'}`;

    reviewAnswersBtn.onclick = () => reviewAnswers(answeredQuestions);
    backToTestsBtn.onclick = () => showPage('student-test-series'); // Go back to test list
}

function reviewAnswers(answeredQuestions) {
    reviewQuestionsList.innerHTML = ''; // Clear previous review
    answeredQuestions.forEach((ans, index) => {
        const isCorrect = ans.isCorrect;
        const selectedOptionText = ans.selectedOptionIndex !== null ? ans.options[ans.selectedOptionIndex] : 'No answer selected';
        const correctAnswerText = ans.options[ans.correctAnswerIndex];

        const reviewCard = `
            <div class="bg-white p-6 rounded-lg shadow-md border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'}">
                <p class="text-lg font-semibold text-gray-800 mb-2">Question ${index + 1}: ${ans.questionText}</p>
                <ul class="list-disc list-inside text-gray-700 mb-3">
                    ${ans.options.map((option, optIndex) => `
                        <li class="${optIndex === ans.correctAnswerIndex ? 'font-bold text-green-700' : ''} ${optIndex === ans.selectedOptionIndex && !isCorrect ? 'text-red-700 line-through' : ''}">
                            ${option}
                            ${optIndex === ans.correctAnswerIndex ? ' (Correct Answer)' : ''}
                            ${optIndex === ans.selectedOptionIndex && !isCorrect ? ' (Your Answer)' : ''}
                        </li>
                    `).join('')}
                </ul>
                <p class="text-sm text-gray-600">Your Selection: <span class="${isCorrect ? 'text-green-600' : 'text-red-600'}">${selectedOptionText}</span></p>
                <p class="text-sm text-gray-600">Correct Answer: <span class="text-green-600">${correctAnswerText}</span></p>
                <p class="text-sm text-gray-800 mt-2">Explanation: ${ans.explanation}</p>
            </div>
        `;
        reviewQuestionsList.insertAdjacentHTML('beforeend', reviewCard);
    });
    // Scroll to review section or make it prominent
    reviewQuestionsList.scrollIntoView({ behavior: 'smooth' });
}


// Initial page load for student portal
document.addEventListener('DOMContentLoaded', () => {
    // This is handled by firebase_auth_listeners.js, which calls updateUIBasedOnRole
    // updateUIBasedOnRole will then call showPage('student-dashboard') if current user is student.
});
