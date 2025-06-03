import {
    auth, 
    db, 
    collection, 
    query, 
    where, 
    getDocs, 
    deleteDoc, 
    doc,
    onAuthStateChanged,
    updateProfile,
    getDoc,
    updateDoc,
    setDoc,
    onSnapshot,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from './firebase.js';
import { showError, showSuccess } from './utils/errorHandler.js';
// Function to open the edit modal
const openEditModal = (projectData) => {
    console.log('openEditModal called with:', projectData);
    const modal = document.getElementById('editProjectModal');
    
    if (!modal) {
        console.error('Edit project modal not found in DOM');
        return;
    }
    
    try {
        currentEditProjectId = projectData.id;
        document.getElementById('editProjectId').value = projectData.id;
        document.getElementById('editTitle').value = projectData.title || '';
        document.getElementById('editDescription').value = projectData.description || '';
        document.getElementById('editStatus').value = projectData.status || 'In Progress';
        document.getElementById('editTags').value = Array.isArray(projectData.tags) 
            ? projectData.tags.join(', ') 
            : (projectData.tags || '');
        document.getElementById('editFeatures').value = Array.isArray(projectData.features) 
            ? projectData.features.join('\n') 
            : (projectData.features || '');
        document.getElementById('editChallenges').value = projectData.challenges || '';
        document.getElementById('editNotes').value = projectData.notes || '';
        
        // Show modal
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        console.log('Modal should be visible now');
    } catch (error) {
        console.error('Error in openEditModal:', error);
    }
};

// Function to close the edit modal
const closeEditModal = () => {
    const modal = document.getElementById('editProjectModal');
    if (modal) {
        modal.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
    const form = document.getElementById('editProjectForm');
    if (form) form.reset();
    currentEditProjectId = null;
};

// Add this near the top of your dashboard.js, after imports
let editButtonListenersAttached = false;
let currentEditProjectId = null;

// Function to handle edit button click
const handleEditButtonClick = async (e) => {
    console.log('Edit button clicked');
    e.stopPropagation();
    const card = e.currentTarget.closest('.project-card');
    const projectId = card.dataset.id;
    console.log('Project ID:', projectId);
    
    try {
        console.log('Fetching project data...');
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
            console.log('Project data found, opening modal...');
            openEditModal({
                id: projectId,
                ...projectDoc.data()
            });
        } else {
            console.log('Project not found');
            throw new Error('Project not found');
        }
    } catch (error) {
        console.error('Error loading project data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load project data. Please try again.',
            confirmButtonColor: '#4a6cf7'
        });
    }
};


// Initialize modal event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Close modal when clicking X or cancel button
    document.getElementById('closeEditModal')?.addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit')?.addEventListener('click', closeEditModal);

    // Close when clicking outside modal
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('editProjectModal')) {
            closeEditModal();
        }
    });

    // Handle form submission
    const form = document.getElementById('editProjectForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const projectTitle = document.getElementById('editTitle').value.trim();
            
            if (!projectTitle) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Project title is required',
                    confirmButtonColor: '#4a6cf7'
                });
                return;
            }
            
            const saveBtn = document.getElementById('saveChanges');
            const originalText = saveBtn.innerHTML;
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            try {
                const projectData = {
                    title: projectTitle,
                    description: document.getElementById('editDescription').value.trim(),
                    status: document.getElementById('editStatus').value,
                    tags: document.getElementById('editTags').value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0),
                    features: document.getElementById('editFeatures').value
                        .split('\n')
                        .map(feature => feature.trim())
                        .filter(feature => feature.length > 0),
                    challenges: document.getElementById('editChallenges').value.trim(),
                    notes: document.getElementById('editNotes').value.trim(),
                    updatedAt: new Date()
                };
                
                // Update project in Firestore
                const projectRef = doc(db, 'projects', currentEditProjectId);
                await updateDoc(projectRef, projectData);
                
                closeEditModal();
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Project updated successfully',
                    timer: 2000,
                    showConfirmButton: false
                });
                
                // Refresh the projects list
                const user = auth.currentUser;
                if (user) {
                    await loadProjects(user.uid);
                }
                
            } catch (error) {
                console.error('Error updating project:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update project. Please try again.',
                    confirmButtonColor: '#4a6cf7'
                });
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalText;
            }
        });
    }
});


// Initialize modal event listeners
const initEditModal = () => {
    // Close modal when clicking X or cancel button
    document.getElementById('closeEditModal')?.addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit')?.addEventListener('click', closeEditModal);

    // Close when clicking outside modal
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('editProjectModal')) {
            closeEditModal();
        }
    });
};

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    
    // Debug: Check if elements exist
    const profileModal = document.getElementById('profileModal');
    const profileLink = document.querySelector('[data-page="profile"]');
    const closeProfileModal = document.getElementById('closeProfileModal');
    
    console.log('Profile modal element:', profileModal);
    console.log('Profile link element:', profileLink);
    console.log('Close modal button:', closeProfileModal);
    
    // Show profile modal when profile link is clicked
    if (profileLink) {
        console.log('Adding click event to profile link');
        profileLink.addEventListener('click', (e) => {
            console.log('Profile link clicked');
            e.preventDefault();
            console.log('Profile modal before show:', profileModal.style.display);
            if (profileModal) {
                // Add debug styling to ensure modal is visible
                profileModal.style.display = 'flex';
                profileModal.style.position = 'fixed';
                profileModal.style.top = '0';
                profileModal.style.left = '0';
                profileModal.style.width = '100%';
                profileModal.style.height = '100%';
                profileModal.style.backgroundColor = 'rgba(0,0,0,0.7)';
                profileModal.style.justifyContent = 'center';
                profileModal.style.alignItems = 'center';
                profileModal.style.zIndex = '1000';
                
                // Style the modal content
                const modalContent = profileModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.backgroundColor = '#1e293b';
                    modalContent.style.padding = '2rem';
                    modalContent.style.borderRadius = '8px';
                    modalContent.style.maxWidth = '500px';
                    modalContent.style.width = '90%';
                }
                
                document.body.style.overflow = 'hidden';
                
                // Update user info in the modal
                const user = auth.currentUser;
                if (user) {
                    const editDisplayName = document.getElementById('editDisplayName');
                    const editEmail = document.getElementById('editEmail');
                    if (editDisplayName) editDisplayName.value = user.displayName || '';
                    if (editEmail) editEmail.value = user.email || '';
                }
            } else {
                console.error('Profile modal not found');
            }
        });
    } else {
        console.error('Profile link not found');
    }

    // Close profile modal
    function closeProfileModalFunc() {
        console.log('Closing profile modal');
        if (profileModal) {
            profileModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Close modal when clicking X, cancel button, or outside
    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', closeProfileModalFunc);
    } else {
        console.error('Close profile modal button not found');
    }
    
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    if (cancelProfileBtn) {
        cancelProfileBtn.addEventListener('click', closeProfileModalFunc);
    } else {
        console.error('Cancel profile button not found');
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            closeProfileModalFunc();
        }
    });
});

// Global variables to store counts
let projectCount = 0;
let logCount = 0;

// Function to update the UI with current counts
const updateStatsUI = () => {
    const projectCountElement = document.getElementById('projectCount');
    const logCountElement = document.getElementById('logCount');
    
    if (projectCountElement) {
        projectCountElement.textContent = projectCount;
    }
    
    if (logCountElement) {
        logCountElement.textContent = logCount;
    }
};

// Function to fetch and update project count
const updateProjectCount = async (userId) => {
    try {
        if (!userId) {
            console.error('User ID is required to update project count');
            return;
        }
        
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        projectCount = querySnapshot.size;
        updateStatsUI();
    } catch (error) {
        console.error('Error updating project count:', error);
        // Don't throw the error to prevent unhandled promise rejections
    }
};

// Function to fetch and update log count
const updateLogCount = async (userId) => {
    try {
        const logsRef = collection(db, 'logs');
        const q = query(logsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        logCount = querySnapshot.size;
        updateStatsUI();
    } catch (error) {
        console.error('Error updating log count:', error);
    }
};

// Function to set up real-time listeners for projects and logs
const setupRealtimeListeners = (userId) => {
    // Listen for project changes
    const projectsQuery = query(collection(db, 'projects'), where('userId', '==', userId));
    const projectsUnsubscribe = onSnapshot(projectsQuery, (snapshot) => {
        projectCount = snapshot.size;
        updateStatsUI();
    }, (error) => {
        console.error('Error listening to projects:', error);
    });

    // Listen for log changes
    const logsQuery = query(collection(db, 'logs'), where('userId', '==', userId));
    const logsUnsubscribe = onSnapshot(logsQuery, (snapshot) => {
        logCount = snapshot.size;
        updateStatsUI();
    }, (error) => {
        console.error('Error listening to logs:', error);
    });

    // Return cleanup functions
    return () => {
        projectsUnsubscribe();
        logsUnsubscribe();
    };
};

// Project Card Template
const projectCardTemplate = (projectData) => {
    const createdAt = projectData.createdAt?.toDate ? projectData.createdAt.toDate() : new Date();
    const updatedAt = projectData.updatedAt?.toDate ? projectData.updatedAt.toDate() : null;
    const projectTags = Array.isArray(projectData.tags) 
        ? projectData.tags 
        : (projectData.tags ? [projectData.tags] : []);
    const statusClass = projectData.status ? `status-${projectData.status.toLowerCase()}` : '';

    return `
    <div class="project-card" data-id="${projectData.id}" style="
        background: #fff;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        overflow: hidden;
        transition: all 0.3s ease;
        border: 1px solid #e0e0e0;
        width: 100%;
        max-width: 1200px;
        margin: 0 auto 35px;
    ">
        <div class="card-header" style="
            padding: 28px 32px;
            border-bottom: 1px solid #f0f0f0;
            background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%);
        ">
            <h3 class="project-title" style="
                margin: 0 0 12px 0;
                font-size: 1.8em;
                color: #1a1a1a;
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 600;
            "><i class="fas fa-project-diagram" style="color: #4a6cf7;"></i>${projectData.title || 'Untitled Project'}</h3>
            <div class="meta" style="
                display: flex;
                gap: 20px;
                margin-top: 8px;
                font-size: 0.95em;
                color: #555;
                flex-wrap: wrap;
                align-items: center;
            ">
                <span style="display: flex; align-items: center; gap: 6px;">
                    <i class="far fa-calendar" style="color: #6c757d;"></i> 
                    <span>Created: ${createdAt.toLocaleDateString()}</span>
                </span>
                ${updatedAt ? `
                <span style="display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-sync" style="color: #6c757d;"></i> 
                    <span>Updated: ${updatedAt.toLocaleDateString()}</span>
                </span>` : ''}
                <span class="status-badge ${statusClass}" style="
                    background: ${projectData.status === 'Completed' ? '#4CAF50' : projectData.status === 'In Progress' ? '#2196F3' : '#FF9800'};
                    color: white;
                    padding: 4px 14px;
                    border-radius: 20px;
                    font-size: 0.85em;
                    font-weight: 500;
                    margin-left: auto;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                ">${projectData.status || 'Active'}</span>
            </div>
        </div>
        
        <div class="card-content" style="
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            background: #ffffff;
        ">
            ${projectData.description ? `
            <div class="card-section" style="
                background: #ffffff;
                border-radius: 8px;
                padding: 20px;
                border: 1px solid #f0f0f0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            ">
                <h4 style="
                    margin: 0 0 8px 0;
                    font-size: 1.1em;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                "><i class="fas fa-info-circle" style="color: #4a6cf7;"></i>Description</h4>
                <p class="project-description" style="
                    margin: 0;
                    color: #444;
                    line-height: 1.5;
                    font-size: 0.95em;
                ">${projectData.description}</p>
            </div>` : ''}
            
            ${projectData.features && projectData.features.length > 0 ? `
            <div class="card-section" style="
                background: #ffffff;
                border-radius: 8px;
                padding: 20px;
                border: 1px solid #f0f0f0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            ">
                <h4 style="
                    margin: 0 0 8px 0;
                    font-size: 1.1em;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                "><i class="fas fa-list-check" style="color: #4a6cf7;"></i>Features</h4>
                <ul class="features-list" style="
                    margin: 0;
                    padding-left: 20px;
                ">
                    ${projectData.features.map(feature => `
                        <li style="
                            margin-bottom: 6px;
                            color: #444;
                            line-height: 1.5;
                            font-size: 0.95em;
                        ">${feature}</li>`).join('')}
                </ul>
            </div>` : ''}
            
            ${projectData.challenges ? `
            <div class="card-section" style="
                background: #ffffff;
                border-radius: 8px;
                padding: 20px;
                border: 1px solid #f0f0f0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            ">
                <h4 style="
                    margin: 0 0 8px 0;
                    font-size: 1.1em;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                "><i class="fas fa-exclamation-triangle" style="color: #ff9800;"></i>Challenges Faced</h4>
                <p class="challenges" style="
                    margin: 0;
                    color: #444;
                    line-height: 1.5;
                    font-size: 0.95em;
                    background: #fff8e1;
                    padding: 12px;
                    border-radius: 6px;
                    border-right: 3px solid #ffc107;
                ">${projectData.challenges}</p>
            </div>` : ''}
            
            ${projectData.notes ? `
            <div class="card-section" style="
                background: #ffffff;
                border-radius: 8px;
                padding: 20px;
                border: 1px solid #f0f0f0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            ">
                <h4 style="
                    margin: 0 0 8px 0;
                    font-size: 1.1em;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                "><i class="fas fa-sticky-note" style="color: #9c27b0;"></i>Additional Notes</h4>
                <p class="notes" style="
                    margin: 0;
                    color: #444;
                    line-height: 1.5;
                    font-size: 0.95em;
                    background: #f5f5f5;
                    padding: 12px;
                    border-radius: 6px;
                    border-left: 3px solid #9c27b0;
                ">${projectData.notes}</p>
            </div>` : ''}
            
            ${projectTags.length > 0 ? `
            <div class="card-section" style="
                background: #ffffff;
                border-radius: 8px;
                padding: 20px;
                border: 1px solid #f0f0f0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            ">
                <h4 style="
                    margin: 0 0 8px 0;
                    font-size: 1.1em;
                    color: #2c3e50;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                "><i class="fas fa-tags" style="color: #4caf50;"></i>Technologies Used</h4>
                <div class="tech-tags-container" style="
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 8px;
                ">
                    ${projectTags.map(tag => `
                        <span class="tech-tag" style="
                            background: #e3f2fd;
                            color: #1976d2;
                            padding: 4px 12px;
                            border-radius: 16px;
                            font-size: 0.85em;
                            white-space: nowrap;
                            border: 1px solid #bbdefb;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        ">
                            <i class="fas fa-tag" style="font-size: 0.8em; opacity: 0.8;"></i>
                            ${tag.trim()}
                        </span>`).join('')}
                </div>
            </div>` : ''}
        </div>
        <div class="card-footer" style="
            padding: 24px 32px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            justify-content: flex-end;
            border-bottom-left-radius: 16px;
            border-bottom-right-radius: 16px;
        ">
            <button class="btn btn-primary view-logs-btn" data-id="${projectData.id}" style="
                background: #4a6cf7;
                color: white;
                border: none;
                padding: 10px 22px;
                border-radius: 8px;
                font-size: 0.95em;
                font-weight: 500;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 5px rgba(74, 108, 247, 0.2);
                min-width: 120px;
            " onmouseover="this.style.background='#3a5bd9'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(74, 108, 247, 0.3)'" 
               onmouseout="this.style.background='#4a6cf7'; this.style.transform='none'; this.style.boxShadow='0 2px 5px rgba(74, 108, 247, 0.2)'">
                <i class="fas fa-eye"></i>
                <span>View Logs</span>
            </button>
            <button class="btn btn-outline edit-btn" data-id="${projectData.id}" style="
                background: transparent;
                color: #4a6cf7;
                border: 2px solid #4a6cf7;
                padding: 10px 22px;
                border-radius: 8px;
                font-size: 0.95em;
                font-weight: 500;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s ease;
                min-width: 120px;
            " onmouseover="this.style.background='rgba(74, 108, 247, 0.05)'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.1)'"
               onmouseout="this.style.background='transparent'; this.style.transform='none'; this.style.boxShadow='none'">
                <i class="fas fa-edit"></i>
                <span>Edit</span>
            </button>
            <button class="btn btn-warning delete-btn" data-id="${projectData.id}" style="
                background: #ff4444;
                color: white;
                border: none;
                padding: 10px 22px;
                border-radius: 8px;
                font-size: 0.95em;
                font-weight: 500;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 5px rgba(255, 68, 68, 0.2);
                min-width: 120px;
            " onmouseover="this.style.background='#e53935'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(255, 68, 68, 0.3)'"
               onmouseout="this.style.background='#ff4444'; this.style.transform='none'; this.style.boxShadow='0 2px 5px rgba(255, 68, 68, 0.2)'">
                <i class="fas fa-trash"></i>
                <span>Delete</span>
            </button>
        </div>
    </div>
    `;
};

// In your setupProjectCardListeners function, update the edit button click handler:
// Update the edit button click handler in setupProjectCardListeners
document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const card = e.currentTarget.closest('.project-card');
        const projectId = card.dataset.id;
        
        try {
            // Get the full project data from Firestore
            const projectRef = doc(db, 'projects', projectId);
            const projectDoc = await getDoc(projectRef);
            
            if (projectDoc.exists()) {
                openEditModal({
                    id: projectId,
                    ...projectDoc.data()
                });
            } else {
                throw new Error('Project not found');
            }
        } catch (error) {
            console.error('Error loading project data:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load project data. Please try again.',
                confirmButtonColor: '#4a6cf7'
            });
        }
    });
});
// Load projects from Firestore
const loadProjects = async (userId) => {
    try {
        // Reset the flag when loading new projects
        editButtonListenersAttached = false;
        
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        projectCount = querySnapshot.size;
        updateStatsUI();
        
        const projectsGrid = document.getElementById('projectsGrid');
        if (!projectsGrid) return;
        
        projectsGrid.innerHTML = ''; // Clear existing content
        let logCount = 0;
        
        querySnapshot.forEach((doc) => {
            const project = { id: doc.id, ...doc.data() };
            projectsGrid.innerHTML += projectCardTemplate(project);
            logCount += project.logCount || 0;
        });
        
        // Update counters
        document.getElementById('logCount').textContent = logCount;
        
        // Add event listeners to the new cards
        setupProjectCardListeners();
    } catch (error) {
        console.error('Error loading projects:', error);
        showError({
            title: 'Error Loading Projects',
            message: 'Failed to load your projects. Please try again later.'
        });
    }
};

// Set up event listeners for project cards
const setupProjectCardListeners = () => {
    // Delete button click
    document.querySelectorAll('.delete-btn').forEach(btn => {
        // Remove any existing listeners first
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const card = e.currentTarget.closest('.project-card');
            const projectId = card.dataset.id;
            const projectName = card.querySelector('.project-title').textContent;

            const result = await Swal.fire({
                title: 'Delete Project',
                text: `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'Cancel',
                reverseButtons: true
            });

            if (result.isConfirmed) {
                try {
                    // Show loading state
                    Swal.fire({
                        title: 'Deleting...',
                        text: 'Please wait while we delete your project',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // Delete the project
                    await deleteDoc(doc(db, 'projects', projectId));
                    
                    // Remove the card from the UI
                    card.style.opacity = '0';
                    setTimeout(() => card.remove(), 300);
                    
                    // Update project count
                    projectCount--;
                    updateStatsUI();
                    
                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Your project has been deleted.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } catch (error) {
                    console.error('Error deleting project:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to delete the project. Please try again.'
                    });
                }
            }
        });
    });

    // View logs button click
    document.querySelectorAll('.view-logs-btn').forEach(btn => {
        // Remove any existing listeners first
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectId = e.currentTarget.closest('.project-card').dataset.id;
            window.location.href = `my-logs.html?projectId=${projectId}`;
        });
    });

    // Edit button click
    document.querySelectorAll('.edit-btn').forEach(btn => {
        // Remove any existing listeners first
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', handleEditButtonClick);
    });
};

// Add event listeners to project cards
const addCardEventListeners = () => {
    document.querySelectorAll('.project-card').forEach(card => {
        const projectId = card.dataset.id;
        
        // View Logs Button
        const viewLogsBtn = card.querySelector('.view-logs-btn');
        if (viewLogsBtn) {
            viewLogsBtn.addEventListener('click', () => {
                window.location.href = `my-logs.html?projectId=${projectId}`;
            });
        }
        
        // Edit Button
        const editBtn = card.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                window.location.href = `new-project.html?edit=${projectId}`;
            });
        }
        
        // Delete Button
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                    try {
                        await deleteDoc(doc(db, 'projects', projectId));
                        card.remove();
                        // Update project count
                        projectCount--;
                        updateStatsUI();
                    } catch (error) {
                        console.error('Error deleting project:', error);
                        showError({
                            title: 'Error Deleting Project',
                            message: 'Failed to delete the project. Please try again.'
                        });
                    }
                }
            });
        }
    });
};

// Function to update user info in the UI
const updateUserInfo = async (user) => {
    console.log('Updating user info for:', user);
    
    if (!user) {
        console.log('No user provided to updateUserInfo');
        return;
    }
    
    try {
        // Force refresh the user data
        await user.reload();
        const currentUser = auth.currentUser;
        console.log('Refreshed user data:', currentUser);
        
        // Try to get the display name from multiple sources
        let displayName = currentUser?.displayName || 
                         user?.displayName || 
                         (currentUser?.email ? currentUser.email.split('@')[0] : 'User');
        
        console.log('Final display name:', displayName);
        
        // Update the UI
        const userNameElement = document.getElementById('userName');
        const userEmailElement = document.getElementById('userEmail');
        const userNavName = document.getElementById('userNavName');
        
        if (userNameElement) {
            console.log('Setting username in greeting to:', displayName);
            userNameElement.textContent = displayName;
        }
        
        if (userNavName) {
            console.log('Setting username in nav to:', displayName);
            userNavName.textContent = displayName;
        }
        
        if (userEmailElement && currentUser?.email) {
            userEmailElement.textContent = currentUser.email;
        }
        
        // Update localStorage with the latest user data
        const userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: displayName,
            emailVerified: currentUser.emailVerified
        };
        localStorage.setItem('user', JSON.stringify(userData));
        
    } catch (error) {
        console.error('Error updating user info:', error);
    }
};

// Load user profile data
const loadUserProfile = async (user) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            // Update form fields
            document.getElementById('displayName').value = user.displayName || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('bio').value = userData.bio || '';
            document.getElementById('github').value = userData.githubUsername || '';
        } else {
            // Set default values if no profile exists yet
            document.getElementById('displayName').value = user.displayName || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('bio').value = '';
            document.getElementById('github').value = '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError({
            title: 'Error Loading Profile',
            message: 'Failed to load your profile information.'
        });
    }
};

// Save user profile
const saveUserProfile = async (user, formData) => {
    try {
        // Update display name in Firebase Auth
        if (formData.displayName && formData.displayName !== user.displayName) {
            await updateProfile(user, {
                displayName: formData.displayName
            });
        }

        // Save additional profile data to Firestore
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            displayName: formData.displayName || user.displayName,
            email: user.email,
            bio: formData.bio || '',
            githubUsername: formData.github || '',
            lastUpdated: new Date().toISOString()
        }, { merge: true });

        // Update UI with new data
        updateUserInfo({
            ...user,
            displayName: formData.displayName || user.displayName
        });

        showSuccess('Profile updated successfully!');
        return true;
    } catch (error) {
        console.error('Error updating profile:', error);
        showError({
            title: 'Update Failed',
            message: error.message || 'Failed to update profile. Please try again.'
        });
        return false;
    }
};

// Project Management
const projectsGrid = document.getElementById('projectsGrid');
const projectCountElement = document.getElementById('projectCount');
let projects = [];

// Function to fetch user's projects
const fetchProjects = async (userId) => {
    try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        projects = [];
        querySnapshot.forEach((doc) => {
            projects.push({ id: doc.id, ...doc.data() });
        });
        renderProjects();
        updateProjectCount(userId);
    } catch (error) {
        console.error('Error fetching projects:', error);
        showError({ title: 'Error', message: 'Failed to load projects' });
    }
};

// Function to render projects in the grid
const renderProjects = () => {
    if (!projectsGrid) return;

    if (projects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="no-projects">
                <i class="fas fa-folder-open"></i>
                <p>You don't have any projects yet</p>
                <p>Click the "New Project" button to get started!</p>
            </div>
        `;
        return;
    }

    // Clear existing content
    projectsGrid.innerHTML = '';
    
    // Render each project using our styled template
    projects.forEach(project => {
        projectsGrid.innerHTML += projectCardTemplate(project);
    });

    // Add event listeners to the new cards
    setupProjectCardListeners();
};

// Update project in Firestore
const updateProject = async (projectId, updates) => {
    try {
        const projectRef = doc(db, 'projects', projectId);
        await setDoc(projectRef, updates, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
};

// Confirm project deletion
const confirmDeleteProject = async (projectId) => {
    const result = await Swal.fire({
        title: 'Delete Project?',
        text: 'This will permanently delete your project and all associated data. This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true
    });

    if (result.isConfirmed) {
        try {
            await deleteProject(projectId);
            projects = projects.filter(project => project.id !== projectId);
            renderProjects();
            updateProjectCount(auth.currentUser.uid);
            showSuccess('Project deleted successfully');
        } catch (error) {
            console.error('Error deleting project:', error);
            showError({ title: 'Error', message: 'Failed to delete project' });
        }
    }
};

// Delete project from Firestore
const deleteProject = async (projectId) => {
    try {
        // First, delete all logs associated with this project
        const logsRef = collection(db, 'logs');
        const q = query(logsRef, where('projectId', '==', projectId));
        const querySnapshot = await getDocs(q);
        
        const deletePromises = [];
        querySnapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        // Wait for all logs to be deleted
        await Promise.all(deletePromises);
        
        // Then delete the project itself
        const projectRef = doc(db, 'projects', projectId);
        await deleteDoc(projectRef);
        
        return true;
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
};


// Initialize the dashboard
const initDashboard = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Update user info in the UI
            updateUserInfo(user);
            
            // Fetch and display projects
            await fetchProjects(user.uid);
            
            // Set up real-time updates for projects
            const projectsRef = collection(db, 'projects');
            const q = query(projectsRef, where('userId', '==', user.uid));
            
            onSnapshot(q, (snapshot) => {
                projects = [];
                snapshot.forEach((doc) => {
                    projects.push({ id: doc.id, ...doc.data() });
                });
                renderProjects();
                updateProjectCount(auth.currentUser.uid);
            });
            
        } else {
            // User is signed out, redirect to login
            window.location.href = 'auth.html';
        }
    });
};

// Start the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);

// Modal elements
const profileModal = document.getElementById('profileModal');
const profileLink = document.querySelector('[data-page="profile"]');
const closeProfileModal = document.getElementById('closeProfileModal');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');
const profileForm = document.getElementById('profileForm');

// Show modal when profile link is clicked
if (profileLink) {
    // Remove any existing event listeners first
    const newProfileLink = profileLink.cloneNode(true);
    profileLink.parentNode.replaceChild(newProfileLink, profileLink);
    
    newProfileLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (profileModal) {
            // Add debug styling to ensure modal is visible
            profileModal.style.display = 'flex';
            profileModal.style.position = 'fixed';
            profileModal.style.top = '0';
            profileModal.style.left = '0';
            profileModal.style.width = '100%';
            profileModal.style.height = '100%';
            profileModal.style.backgroundColor = 'rgba(0,0,0,0.7)';
            profileModal.style.justifyContent = 'center';
            profileModal.style.alignItems = 'center';
            profileModal.style.zIndex = '1000';
            
            // Style the modal content
            const modalContent = profileModal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.backgroundColor = '#1e293b';
                modalContent.style.padding = '2rem';
                modalContent.style.borderRadius = '8px';
                modalContent.style.maxWidth = '500px';
                modalContent.style.width = '90%';
            }
            
            document.body.style.overflow = 'hidden';
            
            // Update user info in the modal
            const user = auth.currentUser;
            if (user) {
                const editDisplayName = document.getElementById('editDisplayName');
                const editEmail = document.getElementById('editEmail');
                if (editDisplayName) editDisplayName.value = user.displayName || '';
                if (editEmail) editEmail.value = user.email || '';
            }
        }
    });
}

// Close modal when clicking the close button
if (closeProfileModal) {
    closeProfileModal.addEventListener('click', () => {
        if (profileModal) profileModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}

// Close modal when clicking cancel
if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener('click', () => {
        if (profileModal) profileModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}

// Close modal when clicking outside the modal
window.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        profileModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Handle profile form submission
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            displayName: document.getElementById('displayName').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            github: document.getElementById('github').value.trim()
        };

        const submitBtn = profileForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            const success = await saveUserProfile(auth.currentUser, formData);
            if (success) {
                // Close modal after successful save
                profileModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

// Profile Modal Functionality
const editDisplayName = document.getElementById('editDisplayName');
const editEmail = document.getElementById('editEmail');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const changePasswordModal = document.getElementById('changePasswordModal');
const closePasswordModal = document.getElementById('closePasswordModal');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
const updatePasswordBtn = document.getElementById('updatePasswordBtn');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const confirmNewPassword = document.getElementById('confirmNewPassword');

// Open profile modal
if (profileLink) {
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (user) {
            editDisplayName.value = user.displayName || '';
            editEmail.value = user.email || '';
            profileModal.style.display = 'flex';
        }
    });
}

// Close modals
function closeModal(modal) {
    modal.style.display = 'none';
}

if (closeProfileModal) {
    closeProfileModal.addEventListener('click', () => closeModal(profileModal));
}
    
if (closePasswordModal) {
    closePasswordModal.addEventListener('click', () => closeModal(changePasswordModal));
}
    
if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener('click', () => closeModal(changePasswordModal));
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === profileModal) closeModal(profileModal);
    if (e.target === changePasswordModal) closeModal(changePasswordModal);
});

// Save profile changes
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            const newDisplayName = editDisplayName.value.trim();
            if (newDisplayName) {
                await updateProfile(user, { displayName: newDisplayName });
                await user.reload();
                
                // Update UI
                const userNameElements = document.querySelectorAll('#userName, #userNavName');
                userNameElements.forEach(el => {
                    el.textContent = newDisplayName;
                });
                
                showSuccess('Profile updated successfully!');
                closeModal(profileModal);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showError({
                title: 'Update Failed',
                message: error.message || 'Failed to update profile. Please try again.'
            });
        }
    });
}

// Open change password modal
if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
        closeModal(profileModal);
        changePasswordModal.style.display = 'flex';
        
        // Style the modal content
        const modalContent = changePasswordModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.backgroundColor = '#1e293b';
            modalContent.style.padding = '2rem';
            modalContent.style.borderRadius = '8px';
            modalContent.style.maxWidth = '500px';
            modalContent.style.width = '90%';
            
            // Style form groups and inputs
            const formGroups = modalContent.querySelectorAll('.form-group');
            formGroups.forEach(group => {
                group.style.marginBottom = '1.5rem';
                
                const label = group.querySelector('label');
                if (label) {
                    label.style.display = 'block';
                    label.style.marginBottom = '0.5rem';
                    label.style.color = '#e2e8f0';
                    label.style.fontWeight = '500';
                }
                
                const input = group.querySelector('input');
                if (input) {
                    input.style.width = '100%';
                    input.style.padding = '0.75rem 1rem';
                    input.style.backgroundColor = '#1e293b';
                    input.style.border = '1px solid #334155';
                    input.style.borderRadius = '0.375rem';
                    input.style.color = '#f8fafc';
                    input.style.fontSize = '1rem';
                    input.style.transition = 'border-color 0.2s, box-shadow 0.2s';
                    input.style.boxSizing = 'border-box';
                    
                    // Focus styles
                    input.addEventListener('focus', () => {
                        input.style.borderColor = '#4a6cf7';
                        input.style.outline = 'none';
                        input.style.boxShadow = '0 0 0 3px rgba(74, 108, 247, 0.2)';
                    });
                    
                    // Blur styles
                    input.addEventListener('blur', () => {
                        input.style.borderColor = '#334155';
                        input.style.boxShadow = 'none';
                    });
                }
            });
            
            // Style the submit button
            const submitBtn = modalContent.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.style.width = '100%';
                submitBtn.style.padding = '0.75rem 1.5rem';
                submitBtn.style.backgroundColor = '#4a6cf7';
                submitBtn.style.color = 'white';
                submitBtn.style.border = 'none';
                submitBtn.style.borderRadius = '0.375rem';
                submitBtn.style.fontWeight = '600';
                submitBtn.style.fontSize = '1rem';
                submitBtn.style.cursor = 'pointer';
                submitBtn.style.transition = 'background-color 0.2s';
                
                // Hover effect
                submitBtn.addEventListener('mouseover', () => {
                    submitBtn.style.backgroundColor = '#3b5bdb';
                });
                
                submitBtn.addEventListener('mouseout', () => {
                    submitBtn.style.backgroundColor = '#4a6cf7';
                });
            }
        }
        
        document.body.style.overflow = 'hidden';
    });
}

// Handle password update
if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user || !user.email) return;

        if (newPassword.value !== confirmNewPassword.value) {
            showError({
                title: 'Password Mismatch',
                message: 'New passwords do not match.'
            });
            return;
        }

        try {
            // Reauthenticate user
            const credential = EmailAuthProvider.credential(user.email, currentPassword.value);
            await reauthenticateWithCredential(user, credential);
            
            // Update password
            await updatePassword(user, newPassword.value);
            
            showSuccess('Password updated successfully!');
            closeModal(changePasswordModal);
            // Clear password fields
            currentPassword.value = '';
            newPassword.value = '';
            confirmNewPassword.value = '';
        } catch (error) {
            console.error('Error updating password:', error);
            showError({
                title: 'Update Failed',
                message: error.message || 'Failed to update password. Please try again.'
            });
        }
    });
}

// Handle account deletion
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
        const result = await Swal.fire({
            title: 'Delete Account?',
            text: 'This will permanently delete your account and all associated data. This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete my account',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                const user = auth.currentUser;
                if (!user) return;

                // Show password prompt
                const { value: password } = await Swal.fire({
                    title: 'Confirm Your Password',
                    input: 'password',
                    inputLabel: 'Enter your password to confirm account deletion',
                    inputPlaceholder: 'Enter your password',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    inputValidator: (value) => {
                        if (!value) {
                            return 'Please enter your password';
                        }
                    }
                });

                if (password) {
                    // Reauthenticate user
                    const credential = EmailAuthProvider.credential(user.email, password);
                    await reauthenticateWithCredential(user, credential);
                    
                    // Delete user account
                    await user.delete();
                    
                    // Clear local storage
                    localStorage.removeItem('user');
                    
                    // Redirect to auth page
                    window.location.href = 'auth.html';
                    
                    Swal.fire(
                        'Deleted!',
                        'Your account has been permanently deleted.',
                        'success'
                    );
                }
            } catch (error) {
                console.error('Error deleting account:', error);
                showError({
                    title: 'Deletion Failed',
                    message: error.message || 'Failed to delete account. Please try again.'
                });
            }
        }
    });
}

// Check auth state
onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed, user:', user);
    if (user) {
        console.log('User signed in. Display name:', user.displayName);
        // Update user info first
        await updateUserInfo(user);
        
        // Set up real-time listeners
        const cleanupListeners = setupRealtimeListeners(user.uid);
        
        // Initial data loads
        loadProjects(user.uid);
        updateProjectCount(user.uid);
        updateLogCount(user.uid);
        
        // Set up sign out button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', async () => {
                try {
                    await auth.signOut();
                    window.location.href = 'auth.html';
                } catch (error) {
                    console.error('Error signing out:', error);
                    showError({
                        title: 'Sign Out Error',
                        message: 'Failed to sign out. Please try again.'
                    });
                }
            });
        }
        
        // Clean up listeners when component unmounts
        return () => {
            if (typeof cleanupListeners === 'function') {
                cleanupListeners();
            }
        };
    } else {
        // User is signed out, redirect to login
        window.location.href = 'auth.html';
    }
});

// Add New Project Button
const newProjectBtn = document.getElementById('newProjectBtn');
if (newProjectBtn) {
    newProjectBtn.addEventListener('click', () => {
        window.location.href = 'new-project.html';
    });
}
// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize auth state listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            loadProjects(user.uid);
            // Any other initialization code...
        } else {
            // User is signed out
            window.location.href = 'index.html';
        }
    });

    // Initialize modal event listeners
    initEditModal();
});

// Handle form submission for editing projects
const editProjectForm = document.getElementById('editProjectForm');
if (editProjectForm) {
    // Remove any existing event listeners by cloning the form
    const newForm = editProjectForm.cloneNode(true);
    editProjectForm.parentNode.replaceChild(newForm, editProjectForm);
    
    // Prevent multiple submissions
    let isSubmitting = false;
    
    // Add new event listener to the cloned form
    newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return;
        isSubmitting = true;
        
        const saveBtn = document.getElementById('saveChanges');
        const originalBtnText = saveBtn.innerHTML;
        
        try {
            // Show loading state
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            const projectData = {
                title: document.getElementById('editTitle').value.trim(),
                description: document.getElementById('editDescription').value.trim(),
                status: document.getElementById('editStatus').value,
                tags: document.getElementById('editTags').value
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0),
                features: document.getElementById('editFeatures').value
                    .split('\n')
                    .map(feature => feature.trim())
                    .filter(feature => feature.length > 0),
                challenges: document.getElementById('editChallenges').value.trim(),
                notes: document.getElementById('editNotes').value.trim(),
                updatedAt: new Date()
            };
            
            // Update project in Firestore
            const projectRef = doc(db, 'projects', currentEditProjectId);
            await updateDoc(projectRef, projectData);
            
            // Close modal and show success message
            closeEditModal();
            
            // Only show success message after successful update
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Project updated successfully',
                timer: 2000,
                showConfirmButton: false
            });
            
            // Refresh the projects list
            const user = auth.currentUser;
            if (user) {
                await loadProjects(user.uid);
            }
            
        } catch (error) {
            console.error('Error updating project:', error);
            // Only show error message if not already showing one
            if (!Swal.isVisible()) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update project. Please try again.',
                    confirmButtonColor: '#4a6cf7'
                });
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalBtnText;
            }
            isSubmitting = false;
        }
    });
}

// Handle change password button click


if (changePasswordBtn && changePasswordModal) {
    changePasswordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Hide profile modal
        if (profileModal) profileModal.style.display = 'none';
        
        // Show change password modal with debug styling
        changePasswordModal.style.display = 'flex';
        changePasswordModal.style.position = 'fixed';
        changePasswordModal.style.top = '0';
        changePasswordModal.style.left = '0';
        changePasswordModal.style.width = '100%';
        changePasswordModal.style.height = '100%';
        changePasswordModal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        changePasswordModal.style.justifyContent = 'center';
        changePasswordModal.style.alignItems = 'center';
        changePasswordModal.style.zIndex = '1000';
        
        // Style the modal content
        const modalContent = changePasswordModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.backgroundColor = '#1e293b';
            modalContent.style.padding = '2rem';
            modalContent.style.borderRadius = '8px';
            modalContent.style.maxWidth = '500px';
            modalContent.style.width = '90%';
            
            // Style form groups and inputs
            const formGroups = modalContent.querySelectorAll('.form-group');
            formGroups.forEach(group => {
                group.style.marginBottom = '1.5rem';
                
                const label = group.querySelector('label');
                if (label) {
                    label.style.display = 'block';
                    label.style.marginBottom = '0.5rem';
                    label.style.color = '#e2e8f0';
                    label.style.fontWeight = '500';
                }
                
                const input = group.querySelector('input');
                if (input) {
                    input.style.width = '100%';
                    input.style.padding = '0.75rem 1rem';
                    input.style.backgroundColor = '#1e293b';
                    input.style.border = '1px solid #334155';
                    input.style.borderRadius = '0.375rem';
                    input.style.color = '#f8fafc';
                    input.style.fontSize = '1rem';
                    input.style.transition = 'border-color 0.2s, box-shadow 0.2s';
                    input.style.boxSizing = 'border-box';
                    
                    // Focus styles
                    input.addEventListener('focus', () => {
                        input.style.borderColor = '#4a6cf7';
                        input.style.outline = 'none';
                        input.style.boxShadow = '0 0 0 3px rgba(74, 108, 247, 0.2)';
                    });
                    
                    // Blur styles
                    input.addEventListener('blur', () => {
                        input.style.borderColor = '#334155';
                        input.style.boxShadow = 'none';
                    });
                }
            });
            
            // Style the submit button
            const submitBtn = modalContent.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.style.width = '100%';
                submitBtn.style.padding = '0.75rem 1.5rem';
                submitBtn.style.backgroundColor = '#4a6cf7';
                submitBtn.style.color = 'white';
                submitBtn.style.border = 'none';
                submitBtn.style.borderRadius = '0.375rem';
                submitBtn.style.fontWeight = '600';
                submitBtn.style.fontSize = '1rem';
                submitBtn.style.cursor = 'pointer';
                submitBtn.style.transition = 'background-color 0.2s';
                
                // Hover effect
                submitBtn.addEventListener('mouseover', () => {
                    submitBtn.style.backgroundColor = '#3b5bdb';
                });
                
                submitBtn.addEventListener('mouseout', () => {
                    submitBtn.style.backgroundColor = '#4a6cf7';
                });
            }
        }
        
        document.body.style.overflow = 'hidden';
    });
}

// Close change password modal
function closeChangePasswordModal() {
    if (changePasswordModal) {
        changePasswordModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking X, cancel button, or outside
if (closePasswordModal) closePasswordModal.addEventListener('click', closeChangePasswordModal);
if (cancelPasswordBtn) cancelPasswordBtn.addEventListener('click', closeChangePasswordModal);
    
window.addEventListener('click', (e) => {
    if (e.target === changePasswordModal) {
        closeChangePasswordModal();
    }
});