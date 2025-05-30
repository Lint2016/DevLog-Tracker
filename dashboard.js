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
    setDoc,
    onSnapshot
} from './firebase.js';
import { showError, showSuccess } from './utils/errorHandler.js';

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
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        projectCount = querySnapshot.size;
        updateStatsUI();
    } catch (error) {
        console.error('Error updating project count:', error);
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
const projectCardTemplate = (projectData) => `
    <div class="project-card" data-id="${projectData.id}">
        <div class="card-header">
            <h3 class="project-title">${projectData.title || 'Untitled Project'}</h3>
            <div class="meta">
                <span><i class="far fa-calendar"></i> ${projectData.createdAt || 'No date'}</span>
                <span>Status: ${projectData.status || 'Active'}</span>
            </div>
        </div>
        <div class="card-content">
            <p class="project-description">${projectData.description || 'No description provided'}</p>
            <div class="tech-stack">
                ${(projectData.tags ? projectData.tags.split(',') : [])
                    .filter(tag => tag.trim())
                    .map(tag => `<span class="tech-tag">${tag.trim()}</span>`)
                    .join('')}
            </div>
        </div>
        <div class="card-footer">
            <button class="btn btn-primary view-logs-btn"><i class="fas fa-eye"></i> Logs</button>
            <button class="btn btn-outline edit-btn"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-warning delete-btn"><i class="fas fa-trash"></i> Delete</button>
        </div>
    </div>
`;

// Load projects from Firestore
const loadProjects = async (userId) => {
    try {
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
        addCardEventListeners();
    } catch (error) {
        console.error('Error loading projects:', error);
        showError({
            title: 'Error Loading Projects',
            message: 'Failed to load your projects. Please try again later.'
        });
    }
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
const updateUserInfo = (user) => {
    if (!user) return;
    
    const userNameElement = document.getElementById('userName');
    const userEmailElement = document.getElementById('userEmail');
    
    if (userNameElement) {
        const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        userNameElement.textContent = displayName;
    }
    
    if (userEmailElement) {
        userEmailElement.textContent = user.email || '';
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

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initialized'); // Debug log
    
    // Modal elements
    const profileModal = document.getElementById('profileModal');
    const profileLink = document.querySelector('[data-page="profile"]');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const cancelProfileBtn = document.getElementById('cancelProfileBtn');
    const profileForm = document.getElementById('profileForm');

    // Show modal when profile link is clicked
    if (profileLink) {
        profileLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (profileModal) profileModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
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

    // Check auth state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Update user info first
            updateUserInfo(user);
            
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
});