/**
 * Handles authentication errors and displays user-friendly messages
 * @param {Error} error - The error object from Firebase
 * @returns {Object} Object containing error details
 */
export const handleAuthError = (error) => {
    let message = 'An error occurred. Please try again.';
    let title = 'Error';
    let code = error.code || 'unknown';
    
    switch(code) {
        case 'auth/email-already-in-use':
            message = 'This email is already in use. Try logging in instead.';
            break;
        case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
        case 'auth/weak-password':
            message = 'Password should be at least 6 characters long.';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email. Please sign up first.';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password. Please try again.';
            break;
        case 'auth/too-many-requests':
            message = 'Too many failed attempts. Please try again later or reset your password.';
            break;
        case 'auth/email-not-verified':
            title = 'Email Not Verified';
            message = 'Please verify your email before logging in. Check your inbox for the verification link.';
            break;
        case 'auth/requires-recent-login':
            message = 'This operation is sensitive and requires recent authentication. Please log in again.';
            break;
    }
    
    return {
        title,
        message,
        code,
        showToUser: true
    };
};

/**
 * Displays an error message to the user using SweetAlert2
 * @param {Object} error - Error object with title and message
 * @param {Function} callback - Optional callback function
 */
export const showError = (error, callback) => {
    if (!error || !error.showToUser) return;
    
    Swal.fire({
        icon: 'error',
        title: error.title || 'Error',
        text: error.message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#3085d6'
    }).then(() => {
        if (typeof callback === 'function') {
            callback();
        }
    });
};

/**
 * Displays a success message to the user using SweetAlert2
 * @param {string} message - Success message to display
 * @param {string} title - Optional title for the success message
 * @param {Function} callback - Optional callback function
 */
export const showSuccess = (message, title = 'Success!', callback) => {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: title,
            text: message,
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#2ecc71'
        }).then(() => {
            if (typeof callback === 'function') callback();
        });
    } else {
        console.log(`${title}: ${message}`);
        alert(message);
        if (typeof callback === 'function') callback();
    }
};
