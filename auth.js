import { 
    auth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendEmailVerification, 
    sendPasswordResetEmail,
    updateProfile,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult
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
        console.log('User created:', user.uid);

        // Update user profile with display name
        const sanitizedDisplayName = sanitizeInput(displayName);
        console.log('Updating profile with display name:', sanitizedDisplayName);
        
        await updateProfile(user, { 
            displayName: sanitizedDisplayName
        });
        
        console.log('Profile updated, reloading user...');
        
        // Force refresh the user object to get the latest data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay to ensure update propagates
        await user.reload();
        const currentUser = auth.currentUser;
        
        console.log('Reloaded user:', {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            emailVerified: currentUser.emailVerified
        });

        // Store user data in localStorage
        const userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || sanitizedDisplayName,
            emailVerified: currentUser.emailVerified
        };
        localStorage.setItem('user', JSON.stringify(userData));

        // Send verification email
        await sendEmailVerification(currentUser);

        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Account Created!',
            html: `Welcome, ${sanitizedDisplayName}!<br><br>
                  We've sent a verification email to ${sanitizedEmail}.<br>
                  Please verify your email to continue.`,
            confirmButtonColor: '#3085d6'
        });

        // Reset form
        if (signupForm) signupForm.reset();
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';

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
    const rememberMe = document.getElementById('remember-me')?.checked || false;

    try {
        // Set persistence based on remember me
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        
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

// Initialize Google provider with additional scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
    prompt: 'select_account' // Forces account selection even for one account
});

/**
 * Handles Google Sign-In
 */
const handleGoogleSignIn = async () => {
    try {
        console.log('Starting Google Sign-In process...');
        
        // Set session persistence
        await setPersistence(auth, browserSessionPersistence);
        console.log('Session persistence set');

        // Always use redirect for better compatibility
        console.log('Initiating Google Sign-In with redirect');
        try {
            await signInWithRedirect(auth, googleProvider);
            console.log('Redirect initiated, page will reload after authentication');
            // The page will reload after redirect
            return;
        } catch (error) {
            console.error('Google Sign-In Redirect Error:', error);
            throw error;
        }
    } catch (error) {
        console.error('Google Sign-In Error:', error);
        throw error;
    }
};
// Handle redirect result on page load
const handleRedirectResult = async () => {
    console.log('Checking for redirect result...');
    try {
        const result = await getRedirectResult(auth);
        console.log('Redirect result:', result);
        
        if (result && result.user) {
            const user = result.user;
            console.log('User signed in via redirect:', user.email);
            
            // Store user data
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                emailVerified: user.emailVerified,
                photoURL: user.photoURL
            };
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('User data stored in localStorage');

            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            console.log('No redirect result found');
        }
    } catch (error) {
        console.error('Redirect Sign-In Error:', error);
        showError({
            title: 'Google Sign-In Failed',
            message: error.message || 'Failed to complete Google Sign-In. Please try again.'
        });
    }
};

// Initialize the auth page
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing auth...');
    
    // Call the redirect result handler
    handleRedirectResult();

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

    // Add Google Sign-In event listener
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async (e) => {
            console.log('Google sign-in button clicked');
            e.preventDefault();
            
            const originalText = googleSignInBtn.innerHTML;
            
            try {
                // Show loading state
                googleSignInBtn.disabled = true;
                googleSignInBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
                
                // Handle Google Sign-In
                await handleGoogleSignIn();
                
                // If we get here, it's not a redirect flow
                console.log('Sign-in process completed without redirect');
            } catch (error) {
                console.error('Google Sign-In Error:', error);
                // Reset button state
                googleSignInBtn.disabled = false;
                googleSignInBtn.innerHTML = originalText;
                
                // Show error message to user
                showError({
                    title: 'Google Sign-In Failed',
                    message: error.message || 'Failed to sign in with Google. Please try again.'
                });
            }
        });
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
            modal.style.display = 'flex';
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
