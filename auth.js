import { 
    auth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendEmailVerification, 
    sendPasswordResetEmail,
    updateProfile,
    setPersistence,
    browserSessionPersistence
} from "./firebase.js";
import { 
    sanitizeInput, 
    validateEmail, 
    validatePassword 
} from './utils/sanitize.js';
import { 
    handleAuthError, 
    showError 
} from './utils/errorHandler.js';
import { initSession } from './utils/session.js';

// DOM Elements
const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');

/**
 * Handles user registration
 */
const handleSignup = async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const displayName = document.getElementById('signup-name').value.trim();

    // Validate inputs
    const sanitizedEmail = validateEmail(email);
    if (!sanitizedEmail) {
        showError({
            title: 'Invalid Email',
            message: 'Please enter a valid email address.'
        });
        return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        showError({
            title: 'Weak Password',
            message: passwordValidation.message
        });
        return;
    }

    try {
        // Set session persistence
        await setPersistence(auth, browserSessionPersistence);
        
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
        const user = userCredential.user;

        // Update user profile
        await updateProfile(user, { 
            displayName: sanitizeInput(displayName) 
        });

        // Send verification email
        await sendEmailVerification(user);

        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Account Created!',
            html: `Welcome, ${sanitizeInput(displayName)}!<br><br>
                  We've sent a verification email to ${sanitizedEmail}.<br>
                  Please verify your email to continue.`,
            confirmButtonColor: '#3085d6'
        });

        // Reset form
        if (signupForm) signupForm.reset();
        
        // Redirect to login
        document.getElementById('login-tab').click();

    } catch (error) {
        console.error('Signup error:', error);
        const authError = handleAuthError(error);
        showError(authError);
    }
};

/**
 * Handles user login
 */
const handleLogin = async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    try {
        // Set persistence based on remember me
        await setPersistence(auth, rememberMe ? 'local' : 'session');
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
            await sendEmailVerification(user);
            await auth.signOut();
            throw { code: 'auth/email-not-verified' };
        }

        // Redirect to dashboard on successful login
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Login error:', error);
        const authError = handleAuthError(error);
        showError(authError);
    }
};

/**
 * Handles password reset
 */
const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('forgot-email').value.trim();
    
    if (!validateEmail(email)) {
        showError({
            title: 'Invalid Email',
            message: 'Please enter a valid email address.'
        });
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        
        await Swal.fire({
            icon: 'success',
            title: 'Password Reset Email Sent',
            text: 'Check your email for instructions to reset your password.',
            confirmButtonColor: '#3085d6'
        });
        
        // Reset form and switch to login
        if (forgotPasswordForm) forgotPasswordForm.reset();
        document.getElementById('login-tab').click();
        
    } catch (error) {
        console.error('Password reset error:', error);
        const authError = handleAuthError(error);
        showError(authError);
    }
};

// Initialize the auth page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize session management
    const cleanup = initSession();
    
    // Add form event listeners
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handlePasswordReset);
    }

    // Modal elements
    const signupModal = document.getElementById('signupModal');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeSignupModal = document.getElementById('closeSignupModal');
    const closeForgotPassword = document.getElementById('closeForgotPassword');
    const createAccountLink = document.getElementById('createAccount');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLogin = document.getElementById('backToLogin');
    
    // Function to show modal
    const showModal = (modal) => {
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    };
    
    // Function to hide modal
    const hideModal = (modal) => {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
    
    // Close modals when clicking the close button
    if (closeSignupModal) {
        closeSignupModal.addEventListener('click', () => hideModal(signupModal));
    }
    
    if (closeForgotPassword) {
        closeForgotPassword.addEventListener('click', () => hideModal(forgotPasswordModal));
    }
    
    // Show modals when clicking on links
    if (createAccountLink) {
        createAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(forgotPasswordModal);
            showModal(signupModal);
        });
    }
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(signupModal);
            showModal(forgotPasswordModal);
        });
    }
    
    if (backToLogin) {
        backToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            hideModal(forgotPasswordModal);
        });
    }
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === signupModal) {
            hideModal(signupModal);
        } else if (e.target === forgotPasswordModal) {
            hideModal(forgotPasswordModal);
        }
    });
    
    // Tab switching (for forms within modals)
    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('data-tab');
            
            // Update active tab
            document.querySelectorAll('.tab-link').forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            
            // Show target tab content
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.style.display = 'none';
            });
            if (target) {
                const targetPane = document.getElementById(target);
                if (targetPane) {
                    targetPane.style.display = 'block';
                }
            }
        });
    });
    
    // Cleanup on unmount
    return () => {
        if (cleanup && typeof cleanup === 'function') {
            cleanup();
        }
    };
});
