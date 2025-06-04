// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail, 
    updateProfile,
    onAuthStateChanged,
    sendEmailVerification,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    deleteUser
} from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    deleteDoc,
    onSnapshot,
    addDoc,
    updateDoc,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCAMvK8PbTpI3pmdJuqHNkVUM_exHg_NvY",
    authDomain: "devlog-tracker-8ece5.firebaseapp.com",
    projectId: "devlog-tracker-8ece5",
    storageBucket: "devlog-tracker-8ece5.appspot.com",
    messagingSenderId: "522604450291",
    appId: "1:522604450291:web:1a4b8c3d3e5f6a7b8c9d0e"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Enable persistence for better offline support
    setPersistence(auth, browserSessionPersistence)
        .catch((error) => {
            console.error('Error enabling persistence:', error);
        });
    
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    // Show user-friendly error message
    alert('Failed to initialize the application. Please check your internet connection and try again.');
}

export {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    sendEmailVerification,
    setPersistence,
    browserSessionPersistence,
    browserLocalPersistence,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    deleteUser,
    db,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    deleteDoc,
    onSnapshot,
    addDoc,
    orderBy,
    updateDoc,
    serverTimestamp,
    Timestamp
};
