import { auth, onAuthStateChanged } from '../firebase.js';

/**
 * Manages user session state
 */
export const initSession = () => {
    // Set up auth state change listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Force refresh the user data to get the latest profile
            await user.reload();
            const currentUser = auth.currentUser;
            
            // User is signed in
            const userData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
                emailVerified: currentUser.emailVerified
            };
            
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Update the DOM if we're on the dashboard
            if (window.location.pathname.includes('dashboard.html')) {
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = userData.displayName;
                }
            }
            
            // Redirect to dashboard if on auth page
            if (window.location.pathname.includes('auth.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // User is signed out
            localStorage.removeItem('user');
            // Redirect to login if not on auth page
            if (!window.location.pathname.includes('auth.html')) {
                window.location.href = 'auth.html';
            }
        }
    });

    // Return cleanup function
    return () => unsubscribe();
};

/**
 * Gets the current user from session
 * @returns {Object|null} User object or null if not authenticated
 */
export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

/**
 * Checks if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
    return !!getCurrentUser();
};
