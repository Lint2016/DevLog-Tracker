import { auth, 
          db, 
          createUserWithEmailAndPassword, 
          signInWithEmailAndPassword, 
          signOut, 
          sendPasswordResetEmail, 
          updateProfile, 
          doc, 
          setDoc } 
          from './firebase.js';

// Auth Modals functionality
document.addEventListener('DOMContentLoaded', () => {
    // Signup Modal
    const signUpModal = document.getElementById('signupModal');
    const createAccount = document.getElementById('createAccount');
    const closeSignupModal = document.getElementById('closeSignupModal');
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // Handle Signup Form Submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const userName = document.getElementById('signup-name').value;

            try {
                // Create user in Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Update user profile with display name
                await updateProfile(user, {
                    displayName: userName
                });

                // Create user document in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: email,
                    displayName: userName,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                });

                console.log('User created and profile saved:', user);
                 Swal.fire({
      icon: "success",
      title: "Account Created",
      text: `Welcome, ${user.displayName}!`,
      confirmButtonColor: "#3085d6",
    });
                closeSignup();
                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Error creating user:', error);
                Swal.fire({
                    title: 'Error!',
                    text: error.message,
                    icon: 'error'
                });
            }
        });
    }

    // Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form elements
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');
            
            // Check if form elements exist
            if (!emailInput || !passwordInput) {
                console.error('Login form elements not found');
                Swal.fire({
                    title: 'Error!',
                    text: 'Login form elements not found. Please check your HTML.',
                    icon: 'error'
                });
                return;
            }

            const email = emailInput.value;
            const password = passwordInput.value;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Update last login time in Firestore
                await setDoc(doc(db, 'users', user.uid), {
                    lastLogin: new Date().toISOString()
                }, { merge: true });

                console.log('User logged in:', user);
                Swal.fire({
                    title: 'Success!',
                    text: 'Logged in successfully!',
                    icon: 'success'
                });
                window.location.href = '/DevLog Tracker/dashboard.html'; // Redirect to dashboard
            } catch (error) {
                console.error('Error logging in:', error);
                Swal.fire({
                    title: 'Error!',
                    text: error.message,
                    icon: 'error'
                });
            }
        });
    }

    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            if (logoutBtn) {
                logoutBtn.style.display = 'block';
            }
        } else {
            // User is signed out
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }
        }
    });

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                console.log('User logged out');
                window.location.href = '/DevLog Tracker/index.html'; // Redirect to login page
            } catch (error) {
                console.error('Error logging out:', error);
                Swal.fire({
                    title: 'Error!',
                    text: error.message,
                    icon: 'error'
                });
            }
        });
    }

    // Forgot Password Modal
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const closeForgotPassword = document.getElementById('closeForgotPassword');
    const backToLogin = document.getElementById('backToLogin');

    // Show Signup Modal
    if (createAccount && signUpModal) {
        createAccount.addEventListener('click', (e) => {
            e.preventDefault();
            signUpModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }


    // Close Signup Modal
    function closeSignup() {
        if (signUpModal) {
            signUpModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }


    // Show Forgot Password Modal
    if (forgotPasswordLink && forgotPasswordModal) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }


    // Close Forgot Password Modal
    function closeForgotPasswordModal() {
        if (forgotPasswordModal) {
            forgotPasswordModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }


    // Event Listeners for closing modals
    if (closeSignupModal) closeSignupModal.addEventListener('click', closeSignup);
    if (closeForgotPassword) closeForgotPassword.addEventListener('click', closeForgotPasswordModal);
    if (backToLogin) backToLogin.addEventListener('click', closeForgotPasswordModal);


    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === signUpModal) closeSignup();
        if (e.target === forgotPasswordModal) closeForgotPasswordModal();
    });


    // Close with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSignup();
            closeForgotPasswordModal();
        }
    });


    // Handle Forgot Password Form Submission
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            
            // Here you would typically send a reset password email
            console.log('Sending reset password email to:', email);
            
            // Show success message (in a real app, you would handle the response from your server)
            alert('If an account exists with this email, you will receive a password reset link.');
            Swal.fire({
  title: 'Success!',
  text: 'Reset password link sent.',
  icon: 'success',
  confirmButtonText: 'OK'
});
            
            // Close the modal
            closeForgotPasswordModal();
        });
    }
});
