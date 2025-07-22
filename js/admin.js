// js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const userInfoSpan = document.getElementById('user-info');

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Forms and tables for each content type
    // Study Materials
    const smForm = document.getElementById('study-material-form');
    const smDocId = document.getElementById('sm-doc-id');
    const smTitle = document.getElementById('sm-title');
    const smDescription = document.getElementById('sm-description');
    const smLink = document.getElementById('sm-link');
    const smTableBody = document.getElementById('sm-table-body');
    const smCancelEditBtn = document.getElementById('sm-cancel-edit');

    // Current Affairs - UPDATED ELEMENTS
    const caForm = document.getElementById('current-affairs-form');
    const caDocId = document.getElementById('ca-doc-id');
    const caDate = document.getElementById('ca-date'); // This will be the document ID
    const caSummaryTitle = document.getElementById('ca-summary-title');
    const caSummaryContent = document.getElementById('ca-summary-content');
    const caDailyReportLink = document.getElementById('ca-daily-report-link');
    const caTableBody = document.getElementById('ca-table-body');
    const caCancelEditBtn = document.getElementById('ca-cancel-edit');

    // PYQs
    const pyqsForm = document.getElementById('pyqs-form');
    const pyqsDocId = document.getElementById('pyqs-doc-id');
    const pyqsYear = document.getElementById('pyqs-year');
    const pyqsPaper = document.getElementById('pyqs-paper');
    const pyqsDescription = document.getElementById('pyqs-description');
    const pyqsLink = document.getElementById('pyqs-link');
    const pyqsTableBody = document.getElementById('pyqs-table-body');
    const pyqsCancelEditBtn = document.getElementById('pyqs-cancel-edit');

    // Answer Writing - UPDATED ELEMENTS
    const awForm = document.getElementById('answer-writing-form');
    const awDocId = document.getElementById('aw-doc-id');
    const awDate = document.getElementById('aw-date'); // This will be the document ID
    const awQuestion = document.getElementById('aw-question');
    const awModelAnswerContent = document.getElementById('aw-model-answer-content');
    const awDifficulty = document.getElementById('aw-difficulty');
    const awMarks = document.getElementById('aw-marks');
    const awTimeLimitMinutes = document.getElementById('aw-time-limit-minutes');
    const awOfficialLink = document.getElementById('aw-official-link');
    const awTableBody = document.getElementById('aw-table-body');
    const awCancelEditBtn = document.getElementById('aw-cancel-edit');

    // Syllabus
    const syllForm = document.getElementById('syllabus-form');
    const syllDocId = document.getElementById('syll-doc-id');
    const syllTitle = document.getElementById('syll-title');
    const syllContent = document.getElementById('syll-content');
    const syllLink = document.getElementById('syll-link');
    const syllTableBody = document.getElementById('syll-table-body');
    const syllCancelEditBtn = document.getElementById('syll-cancel-edit');

    // Study Planners
    const spForm = document.getElementById('study-planner-form');
    const spDocId = document.getElementById('sp-doc-id');
    const spTitle = document.getElementById('sp-title');
    const spDescription = document.getElementById('sp-description');
    const spLink = document.getElementById('sp-link');
    const spTableBody = document.getElementById('sp-table-body');
    const spCancelEditBtn = document.getElementById('sp-cancel-edit');


    let currentUserId = null; // Store the authenticated user's ID

    // --- Authentication Logic ---
    window.onAuthStateChanged(window.auth, (user) => {
        if (user) {
            currentUserId = user.uid;
            userInfoSpan.textContent = `Logged in as: ${user.email || 'Admin'}`;
            logoutButton.classList.remove('hidden');
            loginSection.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
            window.isAuthReady = true; // Indicate auth is ready for data loading
            // Load content for the currently active tab
            const activeTabButton = document.querySelector('.tab-button.active');
            if (activeTabButton) {
                loadContent(activeTabButton.dataset.tab);
            } else {
                // Default to study materials if no tab is active (shouldn't happen with initial active class)
                loadContent('studyMaterials');
            }
        } else {
            currentUserId = null;
            userInfoSpan.textContent = '';
            logoutButton.classList.add('hidden');
            loginSection.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
            window.isAuthReady = false;
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        loginError.classList.add('hidden');

        try {
            await window.signInWithEmailAndPassword(window.auth, email, password);
            window.showCustomModal('Success', 'Logged in successfully!', 'info');
        } catch (error) {
            console.error("Login failed:", error);
            let errorMessage = "Login failed. Please check your credentials.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Invalid email or password.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many login attempts. Please try again later.";
            }
            loginError.textContent = errorMessage;
            loginError.classList.remove('hidden');
            window.showCustomModal('Error', errorMessage, 'error');
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            await window.signOut(window.auth);
            window.showCustomModal('Logged Out', 'You have been successfully logged out.', 'info');
        } catch (error) {
            console.error("Logout failed:", error);
            window.showCustomModal('Error', 'Failed to log out. Please try again.', 'error');
        }
    });

    // --- Tab Switching Logic ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;

            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-700', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            button.classList.add('active', 'bg-blue-700', 'text-white');
            button.classList.remove('bg-gray-200', 'text-gray-700');


            tabContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(`tab-content-${tab}`).classList.remove('hidden');

            loadContent(tab); // Load content for the selected tab
        });
    });

    // --- CRUD Operations ---

    // Generic function to load content for a given collection
    async function loadContent(collectionName) {
        if (!window.db || !window.isAuthReady || !currentUserId) {
            console.log(`Firebase not ready or user not authenticated for ${collectionName}. Retrying...`);
            setTimeout(() => loadContent(collectionName), 500);
            return;
        }

        let tableBody;
        let colspan;
        switch (collectionName) {
            case 'studyMaterials': tableBody = smTableBody; colspan = 4; break;
            case 'currentAffairs': tableBody = caTableBody; colspan = 5; break;
            case 'pyqs': tableBody = pyqsTableBody; colspan = 5; break;
            case 'answerWriting': tableBody = awTableBody; colspan = 7; break; // Increased colspan for new fields
            case 'syllabus': tableBody = syllTableBody; colspan = 4; break;
            case 'studyPlanners': tableBody = spTableBody; colspan = 4; break;
            default: return;
        }

        tableBody.innerHTML = `<tr><td colspan="${colspan}" class="py-4 text-center text-gray-500">Loading ${collectionName}...</td></tr>`;

        try {
            const q = window.collection(window.db, `artifacts/${window.appId}/public/data/${collectionName}`);

            // Use onSnapshot for real-time updates
            window.onSnapshot(q, (querySnapshot) => {
                let htmlContent = '';
                if (querySnapshot.empty) {
                    htmlContent = `<tr><td colspan="${colspan}" class="py-4 text-center text-gray-600">No ${collectionName} added yet.</td></tr>`;
                } else {
                    // Sort by date in JavaScript for current affairs and answer writing, otherwise no specific sorting
                    const sortedDocs = Array.from(querySnapshot.docs).sort((a, b) => {
                        if (collectionName === 'currentAffairs' || collectionName === 'answerWriting') {
                            // Assuming 'date' is in YYYY-MM-DD format for string comparison
                            return new Date(b.data().date) - new Date(a.data().date); // Descending date
                        } else if (collectionName === 'syllabus') {
                            const titleA = a.data().title || '';
                            const titleB = b.data().title || '';
                            return titleA.localeCompare(titleB); // Alphabetical sort for syllabus
                        }
                        return 0; // No specific sorting for other collections
                    });

                    sortedDocs.forEach((doc) => {
                        const data = doc.data();
                        const docId = doc.id;
                        htmlContent += createTableRow(collectionName, docId, data);
                    });
                }
                tableBody.innerHTML = htmlContent;
            }, (error) => {
                console.error(`Error listening to ${collectionName}:`, error);
                tableBody.innerHTML = `<tr><td colspan="${colspan}" class="py-4 text-center text-red-600">Failed to load ${collectionName}.</td></tr>`;
                window.showCustomModal('Error', `Failed to load ${collectionName}. Please check your internet connection or try again later.`, 'error');
            });

        } catch (error) {
            console.error(`Error fetching ${collectionName}:`, error);
            tableBody.innerHTML = `<tr><td colspan="${colspan}" class="py-4 text-center text-red-600">Failed to load ${collectionName}.</td></tr>`;
            window.showCustomModal('Error', `Failed to load ${collectionName}. Please check your internet connection or try again later.`, 'error');
        }
    }

    // Helper to create table rows for each content type
    function createTableRow(collectionName, docId, data) {
        let cells = '';
        let contentPreview = (data.description || data.content || data.topic || data.summaryContent || data.question || '').substring(0, 70);
        if ((data.description || data.content || data.topic || data.summaryContent || data.question || '').length > 70) {
            contentPreview += '...';
        }

        switch (collectionName) {
            case 'studyMaterials':
                cells = `
                    <td class="py-3 px-6 text-left whitespace-nowrap">${data.title || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${contentPreview}</td>
                    <td class="py-3 px-6 text-left"><a href="${data.link || '#'}" target="_blank" class="text-blue-500 hover:underline">${data.link ? 'Link' : 'N/A'}</a></td>
                `;
                break;
            case 'currentAffairs': // UPDATED FOR DAILY DIGEST
                cells = `
                    <td class="py-3 px-6 text-left whitespace-nowrap">${data.date || 'N/A'}</td>
                    <td class="py-3 px-6 text-left whitespace-nowrap">${data.summaryTitle || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${contentPreview}</td>
                    <td class="py-3 px-6 text-left"><a href="${data.dailyReportLink || '#'}" target="_blank" class="text-blue-500 hover:underline">${data.dailyReportLink ? 'Link' : 'N/A'}</a></td>
                `;
                break;
            case 'pyqs':
                cells = `
                    <td class="py-3 px-6 text-left whitespace-nowrap">${data.year || 'N/A'}</td>
                    <td class="py-3 px-6 text-left whitespace-nowrap">${data.paper || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${contentPreview}</td>
                    <td class="py-3 px-6 text-left"><a href="${data.link || '#'}" target="_blank" class="text-blue-500 hover:underline">${data.link ? 'Link' : 'N/A'}</a></td>
                `;
                break;
            case 'answerWriting': // UPDATED FOR NEW FIELDS
                cells = `
                    <td class="py-3 px-6 text-left whitespace-nowrap">${data.date || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${contentPreview}</td>
                    <td class="py-3 px-6 text-left">${data.difficulty || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${data.marks || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${data.timeLimitMinutes ? `${data.timeLimitMinutes} min` : 'N/A'}</td>
                    <td class="py-3 px-6 text-left"><a href="${data.officialLink || '#'}" target="_blank" class="text-blue-500 hover:underline">${data.officialLink ? 'Link' : 'N/A'}</a></td>
                `;
                break;
            case 'syllabus':
                cells = `
                    <td class="py-3 px-6 text-left whitespace-nowrap">${data.title || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${contentPreview}</td>
                    <td class="py-3 px-6 text-left"><a href="${data.link || '#'}" target="_blank" class="text-blue-500 hover:underline">${data.link ? 'Link' : 'N/A'}</a></td>
                `;
                break;
            case 'studyPlanners':
                cells = `
                    <td class="py-3 px-6 text-left whitespace-nowrap">${data.title || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${contentPreview}</td>
                    <td class="py-3 px-6 text-left"><a href="${data.link || '#'}" target="_blank" class="text-blue-500 hover:underline">${data.link ? 'Link' : 'N/A'}</a></td>
                `;
                break;
        }

        return `
            <tr class="border-b border-gray-200 hover:bg-gray-50">
                ${cells}
                <td class="py-3 px-6 text-center whitespace-nowrap">
                    <div class="flex item-center justify-center space-x-2">
                        <button class="w-8 h-8 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center edit-btn" data-id="${docId}" data-collection="${collectionName}" title="Edit">
                            <svg class="icon-svg-action w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center delete-btn" data-id="${docId}" data-collection="${collectionName}" title="Delete">
                            <svg class="icon-svg-action w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // Add/Update Logic (Generalized)
    async function handleFormSubmit(e, collectionName, docIdField, fields, cancelEditBtn) {
        e.preventDefault();
        console.log(`[handleFormSubmit] Attempting to submit form for collection: ${collectionName}`); // Debug log
        const docId = docIdField.value;
        const data = {};
        fields.forEach(field => {
            // Handle number conversions for marks and timeLimitMinutes
            if (field.name === 'marks' || field.name === 'timeLimitMinutes') {
                data[field.name] = field.element.value ? parseInt(field.element.value) : null;
            } else {
                data[field.name] = field.element.value || '';
            }
        });

        // Special handling for Current Affairs and Answer Writing to use date as doc ID
        let targetDocId = docId;
        if (collectionName === 'currentAffairs') {
            targetDocId = caDate.value; // Use the date as the document ID
            if (!targetDocId) {
                window.showCustomModal('Error', 'Date is required for Current Affairs digest.', 'error');
                console.error('[handleFormSubmit] Date is missing for Current Affairs.');
                return;
            }
        } else if (collectionName === 'answerWriting') {
            targetDocId = awDate.value; // Use the date as the document ID for Answer Writing
            if (!targetDocId) {
                window.showCustomModal('Error', 'Date is required for Answer Writing question.', 'error');
                console.error('[handleFormSubmit] Date is missing for Answer Writing.');
                return;
            }
        }
        console.log(`[handleFormSubmit] Data to be saved for ${collectionName}:`, data); // Debug log
        console.log(`[handleFormSubmit] Target Document ID: ${targetDocId}`); // Debug log


        try {
            if (targetDocId) { // Check if we have a doc ID (for update or new with specific ID)
                const docRef = window.doc(window.db, `artifacts/${window.appId}/public/data/${collectionName}`, targetDocId);
                // Use setDoc with merge: true for updates, or addDoc for new if no specific ID
                if (docId) { // This means it's an existing document being edited
                    await window.setDoc(docRef, data, { merge: true }); // Use setDoc with merge for updates
                    window.showCustomModal('Success', `${collectionName.slice(0, -1)} updated successfully!`, 'info');
                } else { // This means it's a brand new document with a date-based ID
                    await window.setDoc(docRef, data); // Use setDoc for creating with specific ID
                    window.showCustomModal('Success', `${collectionName.slice(0, -1)} added successfully!`, 'info');
                }
            } else { // Fallback for other collections if docIdField is empty and no specific ID logic
                 await window.addDoc(window.collection(window.db, `artifacts/${window.appId}/public/data/${collectionName}`), data);
                 window.showCustomModal('Success', `${collectionName.slice(0, -1)} added successfully!`, 'info');
            }

            e.target.reset(); // Clear form
            docIdField.value = ''; // Clear doc ID
            cancelEditBtn.classList.add('hidden'); // Hide cancel button
            console.log(`[handleFormSubmit] Form submission successful for ${collectionName}.`); // Debug log
            // onSnapshot listener handles real-time update, no need to call loadContent explicitly
        } catch (error) {
            console.error(`[handleFormSubmit] Error saving ${collectionName.slice(0, -1)}:`, error);
            window.showCustomModal('Error', `Failed to save ${collectionName.slice(0, -1)}. Error: ${error.message}`, 'error');
        }
    }

    // Attach form submit listeners
    smForm.addEventListener('submit', (e) => handleFormSubmit(e, 'studyMaterials', smDocId, [
        { name: 'title', element: smTitle },
        { name: 'description', element: smDescription },
        { name: 'link', element: smLink }
    ], smCancelEditBtn));

    caForm.addEventListener('submit', (e) => handleFormSubmit(e, 'currentAffairs', caDocId, [
        { name: 'date', element: caDate }, // Date is now part of data and used as doc ID
        { name: 'summaryTitle', element: caSummaryTitle },
        { name: 'summaryContent', element: caSummaryContent },
        { name: 'dailyReportLink', element: caDailyReportLink }
    ], caCancelEditBtn));

    pyqsForm.addEventListener('submit', (e) => handleFormSubmit(e, 'pyqs', pyqsDocId, [
        { name: 'year', element: pyqsYear },
        { name: 'paper', element: pyqsPaper },
        { name: 'description', element: pyqsDescription },
        { name: 'link', element: pyqsLink }
    ], pyqsCancelEditBtn));

    // IMPORTANT: Ensure this listener is correctly set up and the fields are correctly referenced.
    awForm.addEventListener('submit', (e) => {
        console.log('[AW Form Listener] Submit event triggered for Answer Writing form.'); // Debug log
        handleFormSubmit(e, 'answerWriting', awDocId, [
            { name: 'date', element: awDate }, // Ensure date is included in fields
            { name: 'question', element: awQuestion },
            { name: 'modelAnswerContent', element: awModelAnswerContent },
            { name: 'difficulty', element: awDifficulty },
            { name: 'marks', element: awMarks },
            { name: 'timeLimitMinutes', element: awTimeLimitMinutes },
            { name: 'officialLink', element: awOfficialLink }
        ], awCancelEditBtn);
    });

    syllForm.addEventListener('submit', (e) => handleFormSubmit(e, 'syllabus', syllDocId, [
        { name: 'title', element: syllTitle },
        { name: 'content', element: syllContent },
        { name: 'link', element: syllLink }
    ], syllCancelEditBtn));

    spForm.addEventListener('submit', (e) => handleFormSubmit(e, 'studyPlanners', spDocId, [
        { name: 'title', element: spTitle },
        { name: 'description', element: spDescription },
        { name: 'link', element: spLink }
    ], spCancelEditBtn));


    // Edit Logic (Delegated event listeners for table buttons)
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.edit-btn')) {
            const button = e.target.closest('.edit-btn');
            const docId = button.dataset.id;
            const collectionName = button.dataset.collection;

            try {
                const docRef = window.doc(window.db, `artifacts/${window.appId}/public/data/${collectionName}`, docId);
                const docSnap = await window.getDoc(docRef); // Use getDoc for single fetch

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    let formToFill;
                    let docIdField;
                    let cancelEditBtn;

                    switch (collectionName) {
                        case 'studyMaterials':
                            formToFill = smForm;
                            docIdField = smDocId;
                            smTitle.value = data.title || '';
                            smDescription.value = data.description || '';
                            smLink.value = data.link || '';
                            cancelEditBtn = smCancelEditBtn;
                            break;
                        case 'currentAffairs': // UPDATED FOR DAILY DIGEST
                            formToFill = caForm;
                            docIdField = caDocId;
                            caDate.value = data.date || ''; // Populate date field
                            caSummaryTitle.value = data.summaryTitle || '';
                            caSummaryContent.value = data.summaryContent || '';
                            caDailyReportLink.value = data.dailyReportLink || '';
                            cancelEditBtn = caCancelEditBtn;
                            break;
                        case 'pyqs':
                            formToFill = pyqsForm;
                            docIdField = pyqsDocId;
                            pyqsYear.value = data.year || '';
                            pyqsPaper.value = data.paper || '';
                            pyqsDescription.value = data.description || '';
                            pyqsLink.value = data.link || '';
                            cancelEditBtn = pyqsCancelEditBtn;
                            break;
                        case 'answerWriting': // UPDATED FOR NEW FIELDS
                            formToFill = awForm;
                            docIdField = awDocId;
                            awDate.value = data.date || '';
                            awQuestion.value = data.question || '';
                            awModelAnswerContent.value = data.modelAnswerContent || '';
                            awDifficulty.value = data.difficulty || '';
                            awMarks.value = data.marks || '';
                            awTimeLimitMinutes.value = data.timeLimitMinutes || '';
                            awOfficialLink.value = data.officialLink || '';
                            cancelEditBtn = awCancelEditBtn;
                            break;
                        case 'syllabus':
                            formToFill = syllForm;
                            docIdField = syllDocId;
                            syllTitle.value = data.title || '';
                            syllContent.value = data.content || '';
                            syllLink.value = data.link || '';
                            cancelEditBtn = syllCancelEditBtn;
                            break;
                        case 'studyPlanners':
                            formToFill = spForm;
                            docIdField = spDocId;
                            spTitle.value = data.title || '';
                            spDescription.value = data.description || '';
                            spLink.value = data.link || '';
                            cancelEditBtn = spCancelEditBtn;
                            break;
                        default:
                            return;
                    }
                    docIdField.value = docId;
                    cancelEditBtn.classList.remove('hidden');
                    formToFill.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    window.showCustomModal('Error', 'Document not found for editing.', 'error');
                }
            } catch (error) {
                console.error("Error fetching document for edit:", error);
                window.showCustomModal('Error', `Failed to load document for editing. Error: ${error.message}`, 'error');
            }
        }
    });

    // Delete Logic (Delegated event listeners for table buttons)
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.delete-btn')) {
            const button = e.target.closest('.delete-btn');
            const docId = button.dataset.id;
            const collectionName = button.dataset.collection;

            // Custom confirmation modal
            window.showCustomModal('Confirm Delete', 'Are you sure you want to delete this item? This action cannot be undone.', 'warning', async () => {
                try {
                    await window.deleteDoc(window.doc(window.db, `artifacts/${window.appId}/public/data/${collectionName}`, docId));
                    window.showCustomModal('Success', 'Item deleted successfully!', 'info');
                    // onSnapshot handles real-time update, no need to call loadContent explicitly
                } catch (error) {
                    console.error("Error deleting document:", error);
                    window.showCustomModal('Error', `Failed to delete item. Error: ${error.message}`, 'error');
                }
            });
        }
    });

    // Cancel Edit Logic
    smCancelEditBtn.addEventListener('click', () => { smForm.reset(); smDocId.value = ''; smCancelEditBtn.classList.add('hidden'); });
    caCancelEditBtn.addEventListener('click', () => { caForm.reset(); caDocId.value = ''; caCancelEditBtn.classList.add('hidden'); });
    pyqsCancelEditBtn.addEventListener('click', () => { pyqsForm.reset(); pyqsDocId.value = ''; pyqsCancelEditBtn.classList.add('hidden'); });
    awCancelEditBtn.addEventListener('click', () => { awForm.reset(); awDocId.value = ''; awCancelEditBtn.classList.add('hidden'); });
    syllCancelEditBtn.addEventListener('click', () => { syllForm.reset(); syllDocId.value = ''; syllCancelEditBtn.classList.add('hidden'); });
    spCancelEditBtn.addEventListener('click', () => { spForm.reset(); spDocId.value = ''; spCancelEditBtn.classList.add('hidden'); });
});
