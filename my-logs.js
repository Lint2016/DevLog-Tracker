import { 
    auth, 
    db, 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot,
    orderBy,
    serverTimestamp
} from './firebase.js';
import { showError, showSuccess } from './utils/errorHandler.js';

// DOM Elements
const logsContainer = document.getElementById('logsContainer');
const logForm = document.getElementById('logForm');
const logModal = document.getElementById('logModal');
const newLogBtn = document.getElementById('newLogBtn');
const cancelLogBtn = document.getElementById('cancelLogBtn');
const searchLogs = document.getElementById('searchLogs');
const filterProject = document.getElementById('filterProject');
const filterDate = document.getElementById('filterDate');

// State
let projects = [];
let logs = [];
let currentUser = null;

// Initialize the page
const init = () => {
    setupEventListeners();
    checkAuthState();
};

// Check authentication state
const checkAuthState = () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            updateUserInfo(user);
            loadProjects(user.uid);
            setupRealtimeListeners(user.uid);
        } else {
            window.location.href = 'auth.html';
        }
    });
};

// Update user info in the UI
const updateUserInfo = (user) => {
    const userNameElement = document.getElementById('userNavName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userNameElement) {
        const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        userNameElement.textContent = displayName;
    }
    
    if (userAvatar) {
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`;
    }
};

// Load projects for the current user
const loadProjects = async (userId) => {
    try {
        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        projects = [];
        filterProject.innerHTML = '<option value="">All Projects</option>';
        const projectSelect = document.getElementById('logProject');
        projectSelect.innerHTML = '<option value="">Select a project</option>';
        
        querySnapshot.forEach((doc) => {
            const project = { id: doc.id, ...doc.data() };
            projects.push(project);
            
            // Add to filter dropdown
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            filterProject.appendChild(option.cloneNode(true));
            
            // Add to project select in form
            projectSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error loading projects:', error);
        showError({ message: 'Failed to load projects' });
    }
};

// Set up real-time listeners for logs
const setupRealtimeListeners = (userId) => {
    // Listen for logs
    const logsQuery = query(
        collection(db, 'logs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(logsQuery, (snapshot) => {
        logs = [];
        logsContainer.innerHTML = '';
        
        if (snapshot.empty) {
            showNoLogsMessage();
            return;
        }
        
        snapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() });
        });
        
        renderLogs(logs);
    }, (error) => {
        console.error('Error listening to logs:', error);
    });
};

// Render logs to the UI
const renderLogs = (logsToRender) => {
    if (logsToRender.length === 0) {
        showNoLogsMessage();
        return;
    }
    
    logsContainer.innerHTML = '';
    
    logsToRender.forEach(log => {
        const project = projects.find(p => p.id === log.projectId) || { name: 'Unknown Project' };
        const logDate = log.createdAt?.toDate() || new Date();
        
        const logElement = document.createElement('div');
        logElement.className = 'bg-white rounded-lg shadow-md overflow-hidden';
        logElement.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">${log.title}</h3>
                        <span class="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full mb-3">
                            ${project.name}
                        </span>
                    </div>
                    <div class="text-sm text-gray-500">
                        ${formatDate(logDate)}
                    </div>
                </div>
                <p class="text-gray-600 mb-4 whitespace-pre-line">${log.content}</p>
                ${log.tags ? `
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${log.tags.split(',').map(tag => `
                            <span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                ${tag.trim()}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="flex justify-end space-x-2">
                    <button class="text-indigo-600 hover:text-indigo-800" data-id="${log.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="text-red-600 hover:text-red-800 ml-2" data-id="${log.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        logsContainer.appendChild(logElement);
    });
    
    // Add event listeners to the new log cards
    document.querySelectorAll('[data-id]').forEach(button => {
        button.addEventListener('click', (e) => {
            const logId = e.currentTarget.getAttribute('data-id');
            const log = logs.find(l => l.id === logId);
            
            if (e.currentTarget.innerHTML.includes('fa-trash')) {
                deleteLog(logId);
            } else {
                editLog(log);
            }
        });
    });
};

// Show "no logs" message
const showNoLogsMessage = () => {
    logsContainer.innerHTML = `
        <div class="text-center py-12 text-gray-500">
            <i class="fas fa-clipboard-list text-4xl mb-4"></i>
            <p class="text-lg">No logs found. Create your first log to get started!</p>
        </div>
    `;
};

// Format date to readable format
const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// Open log modal for new log
const openNewLogModal = () => {
    document.getElementById('logModalTitle').textContent = 'Add New Log';
    document.getElementById('logForm').reset();
    document.getElementById('logId').value = '';
    logModal.classList.remove('hidden');
};

// Open log modal for editing
const editLog = (log) => {
    document.getElementById('logModalTitle').textContent = 'Edit Log';
    document.getElementById('logId').value = log.id;
    document.getElementById('logTitle').value = log.title;
    document.getElementById('logProject').value = log.projectId;
    document.getElementById('logContent').value = log.content;
    document.getElementById('logTags').value = log.tags || '';
    logModal.classList.remove('hidden');
};

// Save log (create or update)
const saveLog = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(logForm);
    const logData = {
        title: formData.get('title'),
        projectId: formData.get('projectId'),
        content: formData.get('content'),
        tags: formData.get('tags'),
        userId: currentUser.uid,
        updatedAt: serverTimestamp(),
        ...(formData.get('id') ? {} : { createdAt: serverTimestamp() })
    };
    
    try {
        if (formData.get('id')) {
            // Update existing log
            const logRef = doc(db, 'logs', formData.get('id'));
            await updateDoc(logRef, logData);
            showSuccess({ message: 'Log updated successfully!' });
        } else {
            // Create new log
            await addDoc(collection(db, 'logs'), logData);
            showSuccess({ message: 'Log created successfully!' });
        }
        
        closeLogModal();
    } catch (error) {
        console.error('Error saving log:', error);
        showError({ message: 'Failed to save log. Please try again.' });
    }
};

// Delete log
const deleteLog = async (logId) => {
    if (!confirm('Are you sure you want to delete this log? This action cannot be undone.')) {
        return;
    }
    
    try {
        await deleteDoc(doc(db, 'logs', logId));
        showSuccess({ message: 'Log deleted successfully!' });
    } catch (error) {
        console.error('Error deleting log:', error);
        showError({ message: 'Failed to delete log. Please try again.' });
    }
};

// Close log modal
const closeLogModal = () => {
    logModal.classList.add('hidden');
};

// Filter logs based on search and filters
const filterLogs = () => {
    const searchTerm = searchLogs.value.toLowerCase();
    const projectId = filterProject.value;
    const dateFilter = filterDate.value;
    
    let filteredLogs = [...logs];
    
    // Filter by search term
    if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
            log.title.toLowerCase().includes(searchTerm) || 
            log.content.toLowerCase().includes(searchTerm) ||
            (log.tags && log.tags.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filter by project
    if (projectId) {
        filteredLogs = filteredLogs.filter(log => log.projectId === projectId);
    }
    
    // Filter by date
    if (dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filteredLogs = filteredLogs.filter(log => {
            const logDate = log.createdAt?.toDate() || new Date();
            
            switch (dateFilter) {
                case 'today':
                    return logDate >= today;
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(today.getDate() - 7);
                    return logDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(today.getMonth() - 1);
                    return logDate >= monthAgo;
                default:
                    return true;
            }
        });
    }
    
    renderLogs(filteredLogs);
};

// Set up event listeners
const setupEventListeners = () => {
    // New log button
    if (newLogBtn) {
        newLogBtn.addEventListener('click', openNewLogModal);
    }
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-btn, #cancelLogBtn');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeLogModal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === logModal) {
            closeLogModal();
        }
    });
    
    // Form submission
    if (logForm) {
        logForm.addEventListener('submit', saveLog);
    }
    
    // Filter events
    if (searchLogs) searchLogs.addEventListener('input', filterLogs);
    if (filterProject) filterProject.addEventListener('change', filterLogs);
    if (filterDate) filterDate.addEventListener('change', filterLogs);
    
    // Sign out button
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
                window.location.href = 'auth.html';
            } catch (error) {
                console.error('Error signing out:', error);
                showError({ message: 'Failed to sign out. Please try again.' });
            }
        });
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
