// Project Card Template
const projectCardTemplate = `
    <div class="project-card">
        <div class="card-header">
            <h3 class="project-title">{title}</h3>
            <div class="card-meta">
                <span class="project-date">Created: {date}</span>
                <span class="project-status">Status: {status}</span>
            </div>
        </div>
        <div class="card-content">
            <p class="project-description">{description}</p>
        </div>
        <div class="card-footer">
            <button class="view-logs-btn">View Logs</button>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    </div>
`;

// Load projects from Firestore
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('No user is logged in');
            return;
        }

        // Get projects collection for this user
        const projectsRef = collection(db, 'projects');
        const querySnapshot = await getDocs(query(projectsRef, where('userId', '==', user.uid)));

        const projectsGrid = document.getElementById('projectsGrid');
        
        // Create project cards for each project
        querySnapshot.forEach((doc) => {
            const project = doc.data();
            const cardHTML = projectCardTemplate
                .replace('{title}', project.title)
                .replace('{date}', project.createdAt)
                .replace('{status}', project.status || 'Active')
                .replace('{description}', project.description || 'No description provided');

            const cardElement = document.createElement('div');
            cardElement.innerHTML = cardHTML;
            projectsGrid.appendChild(cardElement.firstChild);
        });

        // Add event listeners to all buttons
        addCardEventListeners();
    } catch (error) {
        console.error('Error loading projects:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Failed to load projects. Please try again later.',
            icon: 'error'
        });
    }
});

// Add event listeners to project cards
function addCardEventListeners() {
    const viewLogsBtns = document.querySelectorAll('.view-logs-btn');
    const editBtns = document.querySelectorAll('.edit-btn');
    const deleteBtns = document.querySelectorAll('.delete-btn');

    viewLogsBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectCard = e.target.closest('.project-card');
            const title = projectCard.querySelector('.project-title').textContent;
            // Implement logic to view logs for this project
            console.log(`Viewing logs for project: ${title}`);
        });
    });

    editBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectCard = e.target.closest('.project-card');
            const title = projectCard.querySelector('.project-title').textContent;
            // Implement logic to edit this project
            console.log(`Editing project: ${title}`);
        });
    });

    deleteBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const projectCard = e.target.closest('.project-card');
            const title = projectCard.querySelector('.project-title').textContent;
            
            const result = await Swal.fire({
                title: 'Delete Project',
                text: `Are you sure you want to delete project: ${title}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                // Implement delete logic
                console.log(`Deleting project: ${title}`);
                projectCard.remove();
            }
        });
    });
}

// Add new project card when project is added
export function addProjectCard(projectData) {
    const projectsGrid = document.getElementById('projectsGrid');
    const cardHTML = projectCardTemplate
        .replace('{title}', projectData.title)
        .replace('{date}', projectData.createdAt)
        .replace('{status}', projectData.status || 'Active')
        .replace('{description}', projectData.description || 'No description provided');

    const cardElement = document.createElement('div');
    cardElement.innerHTML = cardHTML;
    projectsGrid.insertBefore(cardElement.firstChild, projectsGrid.firstChild);
    addCardEventListeners();
}
