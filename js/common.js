// js/common.js

// This script will handle dynamic content loading for all frontend pages.
// Firebase initialization and global variables (window.db, window.auth, etc.)
// are now handled directly within each HTML file to ensure immediate availability.

// Card Component HTML structure (used by content-loading functions)
window.createCardHtml = function(item) {
    return `
        <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 transform hover:-translate-y-1 animate-fade-in">
            <h3 class="text-xl font-semibold text-gray-800 mb-2">${item.title || 'No Title'}</h3>
            ${item.date ? `<p class="text-sm text-gray-500 mb-2">${item.date}</p>` : ''}
            <p class="text-gray-600 mb-4">${item.description || 'No description available.'}</p>
            <a href="${item.link || '#'}" target="_blank" class="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                Read More
                <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </a>
        </div>
    `;
};

// Generic function to load content for a given collection
window.loadContent = async function(collectionName, containerId, limitCount = null) {
    // Ensure Firebase is initialized and auth state is ready from the HTML script
    if (!window.db || !window.isAuthReady) {
        console.log(`Firebase not ready yet for ${collectionName}. Retrying...`);
        setTimeout(() => window.loadContent(collectionName, containerId, limitCount), 500);
        return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    container.innerHTML = `<p class="text-center text-gray-500 col-span-full py-8">Loading ${collectionName}...</p>`;

    try {
        let q = window.collection(window.db, `artifacts/${window.appId}/public/data/${collectionName}`);
        if (limitCount) {
            q = window.query(q, window.limit(limitCount));
        }
        const querySnapshot = await window.getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = `<p class="text-center text-gray-600 text-lg col-span-full py-8">No ${collectionName} available yet. Check back soon!</p>`;
            return;
        }

        let htmlContent = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            htmlContent += window.createCardHtml(data);
        });
        container.innerHTML = htmlContent;
        lucide.createIcons(); // Re-render Lucide icons for dynamically added content

    } catch (error) {
        console.error(`Error loading ${collectionName}:`, error);
        container.innerHTML = `<p class="text-center text-red-600 text-lg col-span-full py-8">Failed to load ${collectionName}. Please try again later.</p>`;
        window.showCustomModal('Error', `Failed to load ${collectionName}. Please check your internet connection or try again later.`, 'error');
    }
};

// Function to determine which content to load based on the current page
window.loadPageContent = function() {
    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/') {
        window.loadContent('currentAffairs', 'latest-current-affairs-container', 3); // Load 3 latest for home
    } else if (path.includes('syllabus.html')) {
        window.loadContent('syllabus', 'syllabus-container');
    } else if (path.includes('study-planner.html')) {
        // Study planner might be a more complex UI, so this might just be a placeholder for now
        // or load some general tips from Firestore.
        window.loadContent('studyPlanners', 'study-planner-container');
    }
    else if (path.includes('study-material.html')) {
        window.loadContent('studyMaterials', 'study-material-container');
    } else if (path.includes('current-affairs.html')) {
        window.loadContent('currentAffairs', 'current-affairs-container');
    } else if (path.includes('pyqs.html')) {
        window.loadContent('pyqs', 'pyqs-container');
    } else if (path.includes('answer-writing.html')) {
        window.loadContent('answerWriting', 'answer-writing-container');
    }
    // Community and About pages are mostly static, no dynamic content loading needed here.
};

// This script will be executed after the main HTML, including Firebase setup.
// The onAuthStateChanged listener in the HTML will call window.loadPageContent
// once Firebase authentication state is determined.
