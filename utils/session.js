import { auth, onAuthStateChanged } from '../firebase.js';

/**
 * Manages user session state
 */
export const initSession = () => {
    // Check for existing session
    const user = JSON.parse(localStorage.getItem('user')) || null;
    
    // Set up auth state change listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                emailVerified: user.emailVerified
            };
            localStorage.setItem('user', JSON.stringify(userData));
            
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
