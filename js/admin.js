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

    // Weekly Plan Sub-tab elements
    const weeklyPlanSubTabButtons = document.querySelectorAll('.sub-tab-button');
    const weeklyPlanSubTabContents = document.querySelectorAll('.sub-tab-content');

    // Forms and tables for each content type
    // Study Materials
    const smForm = document.getElementById('study-material-form');
    const smDocId = document.getElementById('sm-doc-id');
    const smTitle = document.getElementById('sm-title');
    const smDescription = document.getElementById('sm-description');
    const smLink = document.getElementById('sm-link');
    const smTableBody = document.getElementById('sm-table-body');
    const smCancelEditBtn = document.getElementById('sm-cancel-edit');

    // Current Affairs
    const caForm = document.getElementById('current-affairs-form');
    const caDocId = document.getElementById('ca-doc-id');
    const caDate = document.getElementById('ca-date');
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

    // Answer Writing
    const awForm = document.getElementById('answer-writing-form');
    const awDocId = document.getElementById('aw-doc-id');
    const awDate = document.getElementById('aw-date');
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

    // Weekly Plan Syllabus Topics
    const wpSyllabusTopicForm = document.getElementById('wp-syllabus-topic-form');
    const wpSyllDocId = document.getElementById('wp-syll-doc-id');
    const wpSyllSubject = document.getElementById('wp-syll-subject');
    const wpSyllTopic = document.getElementById('wp-syll-topic');
    const wpSyllDescription = document.getElementById('wp-syll-description');
    const wpSyllTableBody = document.getElementById('wp-syll-table-body');
    const wpSyllCancelEditBtn = document.getElementById('wp-syll-cancel-edit');

    // Weekly Plan Resources
    const wpResourceForm = document.getElementById('wp-resource-form');
    const wpResourceDocId = document.getElementById('wp-resource-doc-id');
    const wpResourceName = document.getElementById('wp-resource-name');
    const wpResourceType = document.getElementById('wp-resource-type');
    const wpResourceLink = document.getElementById('wp-resource-link');
    const wpResourceAssociatedSubjects = document.getElementById('wp-resource-associated-subjects');
    const wpResourceAssociatedTopics = document.getElementById('wp-resource-associated-topics');
    const wpResourceTableBody = document.getElementById('wp-resource-table-body');
    const wpResourceCancelEditBtn = document.getElementById('wp-resource-cancel-edit');

    // NEW: Fixed Weekly Schedule Elements
    const wpFixedScheduleForm = document.getElementById('wp-fixed-schedule-form');
    const wpFixedScheduleDaySelect = document.getElementById('wp-fixed-schedule-day');
    const scheduleEntriesContainer = document.getElementById('schedule-entries-container');
    const addScheduleEntryBtn = document.getElementById('add-schedule-entry-btn');
    const wpFixedScheduleTableBody = document.getElementById('wp-fixed-schedule-table-body');
    const wpFixedScheduleTableTitle = document.getElementById('fixed-schedule-table-title');
    const wpFixedScheduleCancelEditBtn = document.getElementById('wp-fixed-schedule-cancel-edit');

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
                activeTabButton.click(); // Simulate click to load content for the active tab
            } else {
                // Default to study materials if no tab is active (shouldn't happen with initial active class)
                document.querySelector('.tab-button[data-tab="studyMaterials"]').click();
            }
        } else {
            currentUserId = null;
            userInfoSpan.textContent = '';
            logoutButton.classList.add('hidden');
            adminDashboard.classList.add('hidden');
            loginSection.classList.remove('hidden'); // Ensure login section is visible
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

    // --- Main Tab Switching Logic ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            console.log(`[Main Tab] Clicked tab: ${tab}`); // Debug log

            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-700', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            button.classList.add('active', 'bg-blue-700', 'text-white');
            button.classList.remove('bg-gray-200', 'text-gray-700');


            tabContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(`tab-content-${tab}`).classList.remove('hidden');

            // Special handling for Weekly Plan tab to activate its first sub-tab
            if (tab === 'weeklyPlan') {
                console.log('[Main Tab] Activating first sub-tab for Weekly Plan.'); // Debug log
                const firstSubTabButton = document.querySelector('#tab-content-weeklyPlan .sub-tab-button.active');
                if (firstSubTabButton) {
                    firstSubTabButton.click(); // Simulate click to activate the first sub-tab
                } else { // Fallback if no active class initially (e.g., first load)
                    document.querySelector('#tab-content-weeklyPlan .sub-tab-button[data-sub-tab="wpSyllabusTopics"]').click();
                }
            } else {
                 // Load content for the selected main tab (non-weeklyPlan)
                let tableBodyId;
                switch (tab) {
                    case 'studyMaterials': tableBodyId = 'sm-table-body'; break;
                    case 'currentAffairs': tableBodyId = 'ca-table-body'; break;
                    case 'pyqs': tableBodyId = 'pyqs-table-body'; break;
                    case 'answerWriting': tableBodyId = 'aw-table-body'; break;
                    case 'syllabus': tableBodyId = 'syll-table-body'; break;
                    case 'studyPlanners': tableBodyId = 'sp-table-body'; break;
                }
                if (tableBodyId) {
                    loadContent(tab, tableBodyId);
                }
            }
        });
    });

    // --- Weekly Plan Sub-tab Switching Logic ---
    weeklyPlanSubTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const subTab = button.dataset.subTab;
            console.log(`[Sub-Tab] Clicked sub-tab: ${subTab}`); // Debug log

            weeklyPlanSubTabButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            });
            button.classList.add('active', 'bg-blue-500', 'text-white');
            button.classList.remove('bg-gray-200', 'text-gray-700');

            weeklyPlanSubTabContents.forEach(content => content.classList.add('hidden'));
            document.getElementById(`sub-tab-content-${subTab}`).classList.remove('hidden');

            // Load content for the selected sub-tab
            if (subTab === 'wpSyllabusTopics') {
                loadContent('weeklyPlanSyllabus', 'wp-syll-table-body');
            } else if (subTab === 'wpResources') {
                loadContent('weeklyPlanResources', 'wp-resource-table-body');
            } else if (subTab === 'wpFixedSchedule') { // NEW: Fixed Schedule Sub-tab
                loadFixedScheduleForSelectedDay(); // Load schedule for the default/selected day
                addScheduleEntryBtn.disabled = !wpFixedScheduleDaySelect.value; // Disable if no day selected
            }
        });
    });


    // --- CRUD Operations ---

    // Generic function to load content for a given collection
    async function loadContent(collectionName, tableBodyId) {
        if (!window.db || !window.isAuthReady || !currentUserId) {
            console.log(`[loadContent] Firebase not ready or user not authenticated for ${collectionName}. Retrying...`);
            setTimeout(() => loadContent(collectionName, tableBodyId), 500);
            return;
        }
        console.log(`[loadContent] Loading content for collection: ${collectionName} into table body: ${tableBodyId}`); // Debug log


        const tableBody = document.getElementById(tableBodyId);
        let colspan;
        switch (collectionName) {
            case 'studyMaterials': colspan = 4; break;
            case 'currentAffairs': colspan = 5; break;
            case 'pyqs': colspan = 5; break;
            case 'answerWriting': colspan = 7; break;
            case 'syllabus': colspan = 4; break;
            case 'studyPlanners': colspan = 4; break;
            case 'weeklyPlanSyllabus': colspan = 4; break;
            case 'weeklyPlanResources': colspan = 5; break;
            case 'fixedWeeklySchedule': colspan = 4; break; // This is handled by loadFixedScheduleForSelectedDay
            default: colspan = 1; // Fallback
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
                    // Sort logic (unchanged)
                    const sortedDocs = Array.from(querySnapshot.docs).sort((a, b) => {
                        if (collectionName === 'currentAffairs' || collectionName === 'answerWriting') {
                            return new Date(b.data().date) - new Date(a.data().date); // Descending date
                        } else if (collectionName === 'syllabus') {
                            const titleA = a.data().title || '';
                            const titleB = b.data().title || '';
                            return titleA.localeCompare(titleB);
                        } else if (collectionName === 'weeklyPlanSyllabus') {
                            const topicA = a.data().topic || '';
                            const topicB = b.data().topic || '';
                            return topicA.localeCompare(topicB);
                        } else if (collectionName === 'weeklyPlanResources') {
                            const nameA = a.data().name || '';
                            const nameB = b.data().name || '';
                            return nameA.localeCompare(nameB);
                        }
                        return 0;
                    });

                    sortedDocs.forEach((doc) => {
                        const data = doc.data();
                        const docId = doc.id;
                        htmlContent += createTableRow(collectionName, docId, data);
                    });
                }
                tableBody.innerHTML = htmlContent;
            }, (error) => {
                console.error(`[loadContent] Error listening to ${collectionName}:`, error);
                tableBody.innerHTML = `<tr><td colspan="${colspan}" class="py-4 text-center text-red-600">Failed to load ${collectionName}.</td></tr>`;
                window.showCustomModal('Error', `Failed to load ${collectionName}. Please check your internet connection or try again later.`, 'error');
            });

        } catch (error) {
            console.error(`[loadContent] Error fetching ${collectionName}:`, error);
            tableBody.innerHTML = `<tr><td colspan="${colspan}" class="py-4 text-center text-red-600">Failed to load ${collectionName}.</td></tr>`;
            window.showCustomModal('Error', `Failed to load ${collectionName}. Please check your internet connection or try again later.`, 'error');
        }
    }

    // Helper to create table rows for each content type (unchanged for existing types)
    function createTableRow(collectionName, docId, data) {
        let cells = '';
        let contentPreview = (data.description || data.content || data.topic || data.summaryContent || data.question || data.name || '').substring(0, 70);
        if ((data.description || data.content || data.topic || data.summaryContent || data.question || data.name || '').length > 70) {
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
            case 'currentAffairs':
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
            case 'answerWriting':
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
            case 'weeklyPlanSyllabus':
                cells = `
                    <td class="py-3 px-6 text-left whitespace-nowrap">${data.subject || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${data.topic || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${contentPreview}</td>
                `;
                break;
            case 'weeklyPlanResources':
                cells = `
                    <td class="py-3 px-6 text-left whitespace-nowrap">${data.name || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${data.type || 'N/A'}</td>
                    <td class="py-3 px-6 text-left">${(data.associatedSubjects || []).join(', ') || 'N/A'}</td>
                    <td class="py-3 px-6 text-left"><a href="${data.link || '#'}" target="_blank" class="text-blue-500 hover:underline">${data.link ? 'Link' : 'N/A'}</a></td>
                `;
                break;
            // fixedWeeklySchedule table rows are handled by renderFixedScheduleTable
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
        const docId = docIdField.value; // This will be empty for new documents unless it's CA/AW date-based.
        const data = {};
        fields.forEach(field => {
            // Handle number conversions for marks and timeLimitMinutes
            if (field.name === 'marks' || field.name === 'timeLimitMinutes') {
                data[field.name] = field.element.value ? parseInt(field.element.value) : null;
            } else if (field.name === 'associatedSubjects' || field.name === 'associatedTopics') { // Handle comma-separated strings to arrays
                data[field.name] = field.element.value ? field.element.value.split(',').map(s => s.trim()).filter(s => s) : [];
            } else {
                data[field.name] = field.element.value || '';
            }
        });

        // Determine the target document reference
        let docRef;
        if (collectionName === 'currentAffairs') {
            const dateId = caDate.value;
            if (!dateId) {
                window.showCustomModal('Error', 'Date is required for Current Affairs digest.', 'error');
                console.error('[handleFormSubmit] Date is missing for Current Affairs.');
                return;
            }
            docRef = window.doc(window.db, `artifacts/${window.appId}/public/data/${collectionName}`, dateId);
            console.log(`[handleFormSubmit] Using date as doc ID for Current Affairs: ${dateId}`);
        } else if (collectionName === 'answerWriting') {
            const dateId = awDate.value;
            if (!dateId) {
                window.showCustomModal('Error', 'Date is required for Answer Writing question.', 'error');
                console.error('[handleFormSubmit] Date is missing for Answer Writing.');
                return;
            }
            docRef = window.doc(window.db, `artifacts/${window.appId}/public/data/${collectionName}`, dateId);
            console.log(`[handleFormSubmit] Using date as doc ID for Answer Writing: ${dateId}`);
        } else if (docId) { // For other collections, if docId is present, it's an update
            docRef = window.doc(window.db, `artifacts/${window.appId}/public/data/${collectionName}`, docId);
            console.log(`[handleFormSubmit] Updating existing document with ID: ${docId}`);
        } else { // For new documents in other collections, Firestore auto-generates ID via addDoc
            docRef = null; // Signal to use addDoc
            console.log(`[handleFormSubmit] Adding new document to ${collectionName} (ID will be auto-generated).`);
        }

        console.log(`[handleFormSubmit] Data to be saved for ${collectionName}:`, data); // Debug log

        try {
            if (docRef) { // If docRef exists, it's either a date-based new doc or an update
                await window.setDoc(docRef, data, { merge: true });
                window.showCustomModal('Success', `${collectionName.slice(0, -1)} saved successfully!`, 'info');
            } else { // If docRef is null, it's a brand new document for collections that don't use date as ID
                await window.addDoc(window.collection(window.db, `artifacts/${window.appId}/public/data/${collectionName}`), data);
                window.showCustomModal('Success', `${collectionName.slice(0, -1)} added successfully!`, 'info');
            }

            e.target.reset(); // Clear form
            if (docIdField) docIdField.value = ''; // Clear doc ID if it exists
            if (cancelEditBtn) cancelEditBtn.classList.add('hidden'); // Hide cancel button if it exists
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
        { name: 'date', element: caDate },
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

    awForm.addEventListener('submit', (e) => {
        console.log('[AW Form Listener] Submit event triggered for Answer Writing form.'); // Debug log
        handleFormSubmit(e, 'answerWriting', awDocId, [
            { name: 'date', element: awDate },
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

    // Weekly Plan Syllabus Topic Form
    wpSyllabusTopicForm.addEventListener('submit', (e) => {
        console.log('[WP Syllabus Form Listener] Submit event triggered for Weekly Plan Syllabus form.'); // Debug log
        handleFormSubmit(e, 'weeklyPlanSyllabus', wpSyllDocId, [
            { name: 'subject', element: wpSyllSubject },
            { name: 'topic', element: wpSyllTopic },
            { name: 'description', element: wpSyllDescription }
        ], wpSyllCancelEditBtn);
    });

    // Weekly Plan Resource Form
    wpResourceForm.addEventListener('submit', (e) => {
        console.log('[WP Resource Form Listener] Submit event triggered for Weekly Plan Resource form.'); // Debug log
        handleFormSubmit(e, 'weeklyPlanResources', wpResourceDocId, [
            { name: 'name', element: wpResourceName },
            { name: 'type', element: wpResourceType },
            { name: 'link', element: wpResourceLink },
            { name: 'associatedSubjects', element: wpResourceAssociatedSubjects },
            { name: 'associatedTopics', element: wpResourceAssociatedTopics }
        ], wpResourceCancelEditBtn);
    });

    // NEW: Fixed Weekly Schedule Form Submission
    wpFixedScheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('[Fixed Schedule Form] Submit event triggered.');
        const selectedDay = wpFixedScheduleDaySelect.value;
        if (!selectedDay) {
            window.showCustomModal('Error', 'Please select a day to save the schedule.', 'error');
            return;
        }

        const scheduleEntries = [];
        const entryElements = scheduleEntriesContainer.querySelectorAll('.schedule-entry-item');
        let isValid = true;

        entryElements.forEach(entryDiv => {
            const timeInput = entryDiv.querySelector('input[name="time"]');
            const activityInput = entryDiv.querySelector('input[name="activity"]');
            const typeSelect = entryDiv.querySelector('select[name="type"]');

            if (!timeInput.value.trim() || !activityInput.value.trim() || !typeSelect.value.trim()) {
                isValid = false;
                return;
            }
            scheduleEntries.push({
                time: timeInput.value.trim(),
                activity: activityInput.value.trim(),
                type: typeSelect.value.trim()
            });
        });

        if (!isValid) {
            window.showCustomModal('Error', 'Please fill all fields for each schedule entry.', 'error');
            return;
        }

        const dataToSave = {
            day: selectedDay,
            schedule: scheduleEntries
        };
        console.log(`[Fixed Schedule Form] Saving schedule for ${selectedDay}:`, dataToSave);

        try {
            const docRef = window.doc(window.db, `artifacts/${window.appId}/public/data/fixedWeeklySchedule`, selectedDay);
            await window.setDoc(docRef, dataToSave); // Use setDoc as day ID is known
            window.showCustomModal('Success', `Schedule for ${selectedDay} saved successfully!`, 'info');
            // No need to reset form, as we want to keep the current day's schedule loaded for further edits
            // wpFixedScheduleForm.reset(); // Don't reset the day select
            // scheduleEntriesContainer.innerHTML = '<p class="text-gray-600 text-center">Select a day to add schedule entries.</p>';
            // addScheduleEntryBtn.disabled = true;
            loadFixedScheduleForSelectedDay(); // Reload the table to reflect changes
        } catch (error) {
            console.error('[Fixed Schedule Form] Error saving fixed schedule:', error);
            window.showCustomModal('Error', `Failed to save schedule for ${selectedDay}. Error: ${error.message}`, 'error');
        }
    });

    // Add new schedule entry dynamically
    addScheduleEntryBtn.addEventListener('click', () => {
        addScheduleEntryToForm();
    });

    // Handle change on day selection for fixed schedule
    wpFixedScheduleDaySelect.addEventListener('change', () => {
        loadFixedScheduleForSelectedDay();
        addScheduleEntryBtn.disabled = !wpFixedScheduleDaySelect.value; // Enable/disable add button
    });

    // Function to add a new schedule entry input group to the form
    function addScheduleEntryToForm(time = '', activity = '', type = '') {
        // Clear initial message if present
        if (scheduleEntriesContainer.querySelector('p.text-gray-600')) {
            scheduleEntriesContainer.innerHTML = '';
        }

        const entryDiv = document.createElement('div');
        entryDiv.className = 'schedule-entry-item grid grid-cols-1 md:grid-cols-4 gap-3 items-end p-3 bg-gray-100 rounded-md shadow-sm border border-gray-200';
        entryDiv.innerHTML = `
            <div class="col-span-1">
                <label class="block text-gray-700 text-xs font-semibold mb-1">Time (e.g., 9 AM - 11 AM):</label>
                <input type="text" name="time" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value="${time}" placeholder="e.g., 9 AM - 11 AM">
            </div>
            <div class="col-span-2">
                <label class="block text-gray-700 text-xs font-semibold mb-1">Activity:</label>
                <input type="text" name="activity" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value="${activity}" placeholder="e.g., GS Paper 1: Ancient History">
            </div>
            <div class="col-span-1 flex items-end space-x-2">
                <div class="flex-grow">
                    <label class="block text-gray-700 text-xs font-semibold mb-1">Type:</label>
                    <select name="type" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Select Type</option>
                        <option value="Study">Study</option>
                        <option value="Break">Break</option>
                        <option value="Special">Special</option>
                        <option value="Optional">Optional</option>
                        <option value="Revision">Revision</option>
                        <option value="Mock Test">Mock Test</option>
                        <option value="Essay">Essay</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <button type="button" class="remove-schedule-entry-btn bg-red-500 hover:bg-red-600 text-white p-2 rounded-md flex-shrink-0" title="Remove Entry">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        `;
        scheduleEntriesContainer.appendChild(entryDiv);

        // Set selected type
        if (type) {
            entryDiv.querySelector(`select[name="type"]`).value = type;
        }

        // Add event listener for remove button
        entryDiv.querySelector('.remove-schedule-entry-btn').addEventListener('click', () => {
            entryDiv.remove();
            if (scheduleEntriesContainer.children.length === 0) {
                scheduleEntriesContainer.innerHTML = '<p class="text-gray-600 text-center">Select a day to add schedule entries.</p>';
            }
        });
    }

    // Function to load and display fixed schedule for selected day
    async function loadFixedScheduleForSelectedDay() {
        const selectedDay = wpFixedScheduleDaySelect.value;
        wpFixedScheduleTableTitle.textContent = selectedDay ? `Schedule for ${selectedDay}` : 'Schedule for Selected Day';
        scheduleEntriesContainer.innerHTML = ''; // Clear form entries
        wpFixedScheduleTableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-500">Loading schedule...</td></tr>`;

        if (!selectedDay) {
            scheduleEntriesContainer.innerHTML = '<p class="text-gray-600 text-center">Select a day to add schedule entries.</p>';
            wpFixedScheduleTableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-600">Select a day to view its schedule.</td></tr>`;
            return;
        }

        try {
            const docRef = window.doc(window.db, `artifacts/${window.appId}/public/data/fixedWeeklySchedule`, selectedDay);
            const docSnap = await window.getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const schedule = data.schedule || [];
                console.log(`[loadFixedScheduleForSelectedDay] Loaded schedule for ${selectedDay}:`, schedule);

                // Populate form for editing
                if (schedule.length > 0) {
                    schedule.forEach(entry => {
                        addScheduleEntryToForm(entry.time, entry.activity, entry.type);
                    });
                } else {
                    scheduleEntriesContainer.innerHTML = '<p class="text-gray-600 text-center">No entries for this day. Add new ones below.</p>';
                }

                // Populate table for viewing
                let tableHtml = '';
                if (schedule.length > 0) {
                    schedule.forEach(entry => {
                        tableHtml += `
                            <tr class="border-b border-gray-200 hover:bg-gray-50">
                                <td class="py-3 px-6 text-left whitespace-nowrap">${entry.time || 'N/A'}</td>
                                <td class="py-3 px-6 text-left">${entry.activity || 'N/A'}</td>
                                <td class="py-3 px-6 text-left">${entry.type || 'N/A'}</td>
                                <td class="py-3 px-6 text-center">
                                    <button class="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center delete-fixed-schedule-entry-btn" data-day="${selectedDay}" data-time="${entry.time}" title="Delete Entry">
                                        <svg class="icon-svg-action w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        `;
                    });
                } else {
                    tableHtml = `<tr><td colspan="4" class="py-4 text-center text-gray-600">No schedule entries for ${selectedDay}.</td></tr>`;
                }
                wpFixedScheduleTableBody.innerHTML = tableHtml;

            } else {
                console.log(`[loadFixedScheduleForSelectedDay] No schedule found for ${selectedDay}.`);
                scheduleEntriesContainer.innerHTML = '<p class="text-gray-600 text-center">No schedule found for this day. Add new entries below.</p>';
                wpFixedScheduleTableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-600">No schedule entries for ${selectedDay}.</td></tr>`;
            }
        } catch (error) {
            console.error(`[loadFixedScheduleForSelectedDay] Error loading fixed schedule for ${selectedDay}:`, error);
            wpFixedScheduleTableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-red-600">Failed to load schedule.</td></tr>`;
            window.showCustomModal('Error', `Failed to load schedule for ${selectedDay}. Error: ${error.message}`, 'error');
        }
    }

    // Delegated event listener for deleting individual fixed schedule entries from the table
    wpFixedScheduleTableBody.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-fixed-schedule-entry-btn');
        if (deleteBtn) {
            const day = deleteBtn.dataset.day;
            const timeToDelete = deleteBtn.dataset.time;

            window.showCustomModal('Confirm Delete', `Are you sure you want to delete the entry for "${timeToDelete}" on ${day}?`, 'warning', async (confirmed) => {
                if (confirmed) {
                    try {
                        const docRef = window.doc(window.db, `artifacts/${window.appId}/public/data/fixedWeeklySchedule`, day);
                        const docSnap = await window.getDoc(docRef);

                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            let schedule = data.schedule || [];
                            const initialLength = schedule.length;
                            schedule = schedule.filter(entry => entry.time !== timeToDelete);

                            if (schedule.length < initialLength) {
                                await window.setDoc(docRef, { schedule: schedule }, { merge: true });
                                window.showCustomModal('Success', 'Schedule entry deleted successfully!', 'info');
                                loadFixedScheduleForSelectedDay(); // Reload to update table and form
                            } else {
                                window.showCustomModal('Error', 'Entry not found or already deleted.', 'error');
                            }
                        }
                    } catch (error) {
                        console.error("Error deleting fixed schedule entry:", error);
                        window.showCustomModal('Error', `Failed to delete schedule entry. Error: ${error.message}`, 'error');
                    }
                }
            });
        }
    });


    // Edit Logic (Delegated event listeners for table buttons) - unchanged for existing types
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.edit-btn')) {
            const button = e.target.closest('.edit-btn');
            const docId = button.dataset.id;
            const collectionName = button.dataset.collection;
            console.log(`[Edit Button] Clicked edit for ${collectionName} with ID: ${docId}`); // Debug log

            // Fixed schedule is not edited via this generic edit button, it has its own form
            if (collectionName === 'fixedWeeklySchedule') {
                wpFixedScheduleDaySelect.value = docId; // Set the day
                loadFixedScheduleForSelectedDay(); // Load its entries into the form
                document.getElementById('tab-content-weeklyPlan').classList.remove('hidden');
                document.getElementById('sub-tab-content-wpFixedSchedule').classList.remove('hidden');
                document.querySelector('.sub-tab-button[data-sub-tab="wpFixedSchedule"]').click();
                wpFixedScheduleForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

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
                        case 'currentAffairs':
                            formToFill = caForm;
                            docIdField = caDocId;
                            caDate.value = data.date || '';
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
                        case 'answerWriting':
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
                        case 'weeklyPlanSyllabus':
                            formToFill = wpSyllabusTopicForm;
                            docIdField = wpSyllDocId;
                            wpSyllSubject.value = data.subject || '';
                            wpSyllTopic.value = data.topic || '';
                            wpSyllDescription.value = data.description || '';
                            cancelEditBtn = wpSyllCancelEditBtn;
                            break;
                        case 'weeklyPlanResources':
                            formToFill = wpResourceForm;
                            docIdField = wpResourceDocId;
                            wpResourceName.value = data.name || '';
                            wpResourceType.value = data.type || '';
                            wpResourceLink.value = data.link || '';
                            wpResourceAssociatedSubjects.value = (data.associatedSubjects || []).join(', ');
                            wpResourceAssociatedTopics.value = (data.associatedTopics || []).join(', ');
                            cancelEditBtn = wpResourceCancelEditBtn;
                            break;
                        default:
                            return;
                    }
                    docIdField.value = docId;
                    cancelEditBtn.classList.remove('hidden');
                    formToFill.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    console.log(`[Edit Button] Form fields populated for ${collectionName}.`); // Debug log
                } else {
                    window.showCustomModal('Error', 'Document not found for editing.', 'error');
                    console.error(`[Edit Button] Document with ID ${docId} not found for ${collectionName}.`);
                }
            } catch (error) {
                console.error("[Edit Button] Error fetching document for edit:", error);
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
            console.log(`[Delete Button] Clicked delete for ${collectionName} with ID: ${docId}`); // Debug log


            // Custom confirmation modal
            window.showCustomModal('Confirm Delete', 'Are you sure you want to delete this item? This action cannot be undone.', 'warning', async (confirmed) => {
                if (confirmed) {
                    try {
                        await window.deleteDoc(window.doc(window.db, `artifacts/${window.appId}/public/data/${collectionName}`, docId));
                        window.showCustomModal('Success', 'Item deleted successfully!', 'info');
                        console.log(`[Delete Button] Document ${docId} deleted from ${collectionName}.`); // Debug log
                        // onSnapshot handles real-time update, no need to call loadContent explicitly
                    } catch (error) {
                        console.error("[Delete Button] Error deleting document:", error);
                        window.showCustomModal('Error', `Failed to delete item. Error: ${error.message}`, 'error');
                    }
                }
            });
        }
    });

    // Cancel Edit Logic
    smCancelEditBtn.addEventListener('click', () => { smForm.reset(); smDocId.value = ''; smCancelEditBtn.classList.add('hidden'); console.log('[Cancel Edit] Study Materials form reset.'); });
    caCancelEditBtn.addEventListener('click', () => { caForm.reset(); caDocId.value = ''; caCancelEditBtn.classList.add('hidden'); console.log('[Cancel Edit] Current Affairs form reset.'); });
    pyqsCancelEditBtn.addEventListener('click', () => { pyqsForm.reset(); pyqsDocId.value = ''; pyqsCancelEditBtn.classList.add('hidden'); console.log('[Cancel Edit] PYQs form reset.'); });
    awCancelEditBtn.addEventListener('click', () => { awForm.reset(); awDocId.value = ''; awCancelEditBtn.classList.add('hidden'); console.log('[Cancel Edit] Answer Writing form reset.'); });
    syllCancelEditBtn.addEventListener('click', () => { syllForm.reset(); syllDocId.value = ''; syllCancelEditBtn.classList.add('hidden'); console.log('[Cancel Edit] Syllabus form reset.'); });
    spCancelEditBtn.addEventListener('click', () => { spForm.reset(); spDocId.value = ''; spCancelEditBtn.classList.add('hidden'); console.log('[Cancel Edit] Study Planners form reset.'); });
    // Weekly Plan Cancel Edit buttons
    wpSyllCancelEditBtn.addEventListener('click', () => { wpSyllabusTopicForm.reset(); wpSyllDocId.value = ''; wpSyllCancelEditBtn.classList.add('hidden'); console.log('[Cancel Edit] Weekly Plan Syllabus Topic form reset.'); });
    wpResourceCancelEditBtn.addEventListener('click', () => { wpResourceForm.reset(); wpResourceDocId.value = ''; wpResourceCancelEditBtn.classList.add('hidden'); console.log('[Cancel Edit] Weekly Plan Resource form reset.'); });
    // NEW: Fixed Schedule Clear Form button
    wpFixedScheduleCancelEditBtn.addEventListener('click', () => {
        wpFixedScheduleDaySelect.value = ''; // Clear selected day
        scheduleEntriesContainer.innerHTML = '<p class="text-gray-600 text-center">Select a day to add schedule entries.</p>';
        addScheduleEntryBtn.disabled = true;
        wpFixedScheduleTableBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-600">Select a day to view its schedule.</td></tr>`;
        wpFixedScheduleTableTitle.textContent = 'Schedule for Selected Day';
        console.log('[Cancel Edit] Fixed Schedule form cleared.');
    });
});
