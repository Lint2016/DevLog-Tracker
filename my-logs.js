import {
    auth,
    db,
    collection,
    query,
    where,
    getDocs,
    onAuthStateChanged,
    orderBy
} from './firebase.js';
import { showError } from './utils/errorHandler.js'; 

// DOM Elements
const projectsContainer = document.getElementById('projectsContainer');
const filterDate = document.getElementById('filterDate');
const loadingMessage = document.getElementById('loadingMessage');
const noProjectsMessage = document.getElementById('noProjectsMessage');
const userNavName = document.getElementById('userNavName'); 
const userAvatar = document.getElementById('userAvatar'); 

// State
let currentUser = null;
let allFetchedProjects = []; 

// --- Project Card Template (Adapted from dashboard.js, no buttons, summary focus) ---
const projectCardTemplate_MyLogsPage = (projectData) => {
    const createdAt = projectData.createdAt?.toDate ? projectData.createdAt.toDate() : new Date();
    const projectTags = Array.isArray(projectData.tags)
        ? projectData.tags
        : (projectData.tags ? String(projectData.tags).split(',').map(t => t.trim()) : []);

    // Truncate description for summary view
    let summaryDescription = projectData.description || '';
    if (summaryDescription.length > 150) {
        summaryDescription = summaryDescription.substring(0, 147) + '...';
    }

    return `
    <div class="project-card my-logs-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200 w-full mb-6">
        <div class="card-header p-6 border-b border-gray-200 bg-gray-50">
            <h3 class="text-2xl font-semibold text-gray-800 flex items-center mb-1">
                <i class="fas fa-project-diagram text-indigo-600 mr-3"></i>
                ${projectData.title || 'Untitled Project'}
            </h3>
            <div class="meta text-xs text-gray-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span class="flex items-center">
                    <i class="far fa-calendar-alt text-gray-400 mr-1.5"></i>
                    Created: ${createdAt.toLocaleDateString()}
                </span>
                <span class="status-badge inline-flex items-center px-2.5 py-0.5 rounded-full font-medium 
                    ${projectData.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      projectData.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'}">
                    ${projectData.status || 'N/A'}
                </span>
            </div>
        </div>
        
        <div class="card-content p-6 space-y-4">
            ${summaryDescription ? `
            <div>
                <h4 class="text-base font-semibold text-white mb-1.5">Description</h4>
                <p class="text-white text-base leading-relaxed">${summaryDescription}</p>
            </div>` : '<p class="text-sm text-gray-500 italic">No description provided.</p>'}
            
            ${projectTags.length > 0 ? `
            <div>
                <h4 class="text-base font-semibold text-white mb-2">Tags</h4>
                <div class="flex flex-wrap gap-2">
                    ${projectTags.map(tag => `
                        <span class="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">${tag}</span>
                    `).join('')}
                </div>
            </div>` : ''}
        </div>
    </div>
    `;
};

// --- Date Helper Functions ---
const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const isThisWeek = (date) => {
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); 
    firstDayOfWeek.setHours(0, 0, 0, 0);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
    lastDayOfWeek.setHours(23, 59, 59, 999);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
};

const isThisMonth = (date) => {
    const today = new Date();
    return date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

// --- Core Logic ---
const updateUserInfoInNav = (user) => {
    if (userNavName) {
        userNavName.textContent = user.displayName || user.email.split('@')[0];
    }
    if (userAvatar) {
        userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email.split('@')[0])}&background=random&color=fff`;
    }
    const userDropdownToggle = document.getElementById('userDropdownToggle'); 
    if(userDropdownToggle) userDropdownToggle.classList.remove('hidden');
};

const renderProjectCards = (projectsToRender) => {
    if (!projectsContainer) return;
    projectsContainer.innerHTML = ''; 

    if (projectsToRender.length === 0) {
        if (noProjectsMessage) noProjectsMessage.classList.remove('hidden');
        if (loadingMessage) loadingMessage.classList.add('hidden');
        return;
    }

    if (noProjectsMessage) noProjectsMessage.classList.add('hidden');
    if (loadingMessage) loadingMessage.classList.add('hidden');

    projectsToRender.forEach(project => {
        projectsContainer.innerHTML += projectCardTemplate_MyLogsPage(project);
    });
};

const applyFiltersAndRender = () => {
    const filterValue = filterDate ? filterDate.value : 'all';
    let filteredProjects = allFetchedProjects;

    if (filterValue !== 'all') {
        filteredProjects = allFetchedProjects.filter(project => {
            const projectDate = project.createdAt?.toDate ? project.createdAt.toDate() : new Date(project.createdAt);
            if (filterValue === 'today') return isToday(projectDate);
            if (filterValue === 'week') return isThisWeek(projectDate);
            if (filterValue === 'month') return isThisMonth(projectDate);
            return true;
        });
    }
    renderProjectCards(filteredProjects);
};

const loadAndDisplayProjects = async (userId) => {
    if (loadingMessage) loadingMessage.classList.remove('hidden');
    if (noProjectsMessage) noProjectsMessage.classList.add('hidden');
    if (projectsContainer) projectsContainer.innerHTML = ''; 

    try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        allFetchedProjects = [];
        querySnapshot.forEach((doc) => {
            allFetchedProjects.push({ id: doc.id, ...doc.data() });
        });
        
        applyFiltersAndRender(); 

    } catch (error) {
        console.error('Error loading projects:', error);
        if (showError) showError({ message: 'Failed to load projects. Please try again.' });
        if (projectsContainer) projectsContainer.innerHTML = '<p class="text-red-500 text-center">Error loading projects.</p>';
        if (loadingMessage) loadingMessage.classList.add('hidden');
    }
};

const checkAuthState_MyProjectsPage = () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            updateUserInfoInNav(user); 
            loadAndDisplayProjects(user.uid);
        } else {
            currentUser = null;
            allFetchedProjects = [];
            renderProjectCards([]); 
            if (noProjectsMessage) noProjectsMessage.classList.remove('hidden'); 
            if (loadingMessage) loadingMessage.classList.add('hidden');
            // Optionally redirect to login page
            // window.location.href = 'auth.html'; 
        }
    });
};

const initMyProjectsPage = () => {
    checkAuthState_MyProjectsPage();
    if (filterDate) {
        filterDate.addEventListener('change', applyFiltersAndRender);
    }

    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'auth.html'; 
            }).catch((error) => {
                console.error('Sign out error', error);
                if(showError) showError({message: 'Error signing out.'});
            });
        });
    }
    
    const userDropdownToggle = document.getElementById('userDropdownToggle');
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdownToggle && userDropdown) {
        userDropdownToggle.addEventListener('click', (event) => {
            event.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', (event) => {
            if (!userDropdown.contains(event.target) && !userDropdownToggle.contains(event.target)) {
                userDropdown.classList.add('hidden');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', initMyProjectsPage);
