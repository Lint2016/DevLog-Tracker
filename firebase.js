// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCAMvK8PbTpI3pmdJuqHNkVUM_exHg_NvY",
    authDomain: "devlog-tracker-8ece5.firebaseapp.com",
    projectId: "devlog-tracker-8ece5",
    storageBucket: "devlog-tracker-8ece5.firebasestorage.app",
    messagingSenderId: "522604450291",
    appId: "1:522604450291:web:ae84e1b298a38806cbc286"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { 
    auth, 
    db, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    sendPasswordResetEmail, 
    updateProfile,
    doc,
    setDoc,
    getDoc
};
