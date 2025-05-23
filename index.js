// Settings Modal functionality
document.addEventListener('DOMContentLoaded', () => {
    // Modal Elements
    const settingsLink = document.getElementById('settingsLink');
    const myModal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettings');
    const transparencyRange = document.getElementById('transparencyRange');
    const projectCards = document.querySelectorAll('.project-card');

    // Open Modal
    function openModal() {
        myModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
        myModal.classList.add('modal-visible');
    }


    // Close Modal
    function closeModal() {
        myModal.classList.remove('modal-visible');
        setTimeout(() => {
            myModal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        }, 200); // Match this with your CSS transition time
    }


    // Event Listeners
    if (settingsLink) {
        settingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }


    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }


    // Close modal when clicking outside the content
    myModal?.addEventListener('click', (e) => {
        if (e.target === myModal) {
            closeModal();
        }
    });


    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && myModal.style.display === 'flex') {
            closeModal();
        }
    });


    // Card Transparency Control
    if (transparencyRange) {
        // Load saved transparency
        const savedTransparency = localStorage.getItem('cardTransparency');
        if (savedTransparency) {
            transparencyRange.value = savedTransparency;
            updateCardTransparency(savedTransparency);
        }

        // Update on change
        transparencyRange.addEventListener('input', (e) => {
            const value = e.target.value;
            updateCardTransparency(value);
            localStorage.setItem('cardTransparency', value);
        });
    }


    // Update card transparency
    function updateCardTransparency(value) {
        projectCards.forEach(card => {
            card.style.opacity = value;
        });
    }


    // Sign Out Button
    const signoutBtn = document.querySelector('.signout-btn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', () => {
            // Add your sign out logic here
            alert('Signing out...');
            window.location.href = 'auth.html';
        });
    }


    // Delete Account Button
    const deleteBtn = document.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                // Add your delete account logic here
                alert('Account deletion requested...');
            }
        });
    }
});
