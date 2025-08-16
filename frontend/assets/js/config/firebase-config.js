// Firebase Configuration
// Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBp4EBo6Aykvhoceei-bh7MulryoXGgY18",
    authDomain: "e-panchayet.firebaseapp.com",
    databaseURL: "https://e-panchayet-default-rtdb.firebaseio.com/", // Add this for Realtime Database
    projectId: "e-panchayet",
    storageBucket: "e-panchayet.firebasestorage.app",
    messagingSenderId: "840234975376",
    appId: "1:840234975376:web:2a4a467589723b6f801815",
    measurementId: "G-NJW0WRFRQH"
};

// Check if Firebase config is properly set up
const isFirebaseConfigured = !firebaseConfig.apiKey.includes('XXXXX');

// Initialize Firebase only if properly configured
let firebaseInitialized = false;
try {
    if (isFirebaseConfigured) {
        firebase.initializeApp(firebaseConfig);
        firebaseInitialized = true;
        console.log('Firebase initialized successfully');
    } else {
        console.warn('Firebase not configured - using demo mode');
        console.log('To enable Firebase:');
        console.log('1. Create a Firebase project at https://console.firebase.google.com/');
        console.log('2. Enable Authentication and Firestore');
        console.log('3. Replace the firebaseConfig object with your project settings');
    }
} catch (error) {
    console.error('Firebase initialization failed:', error);
    firebaseInitialized = false;
}

// Initialize Firebase services
let auth, db, realtimeDB, storage;

if (firebaseInitialized) {
    auth = firebase.auth();
    db = firebase.firestore(); // Keep Firestore for compatibility
    realtimeDB = firebase.database(); // Add Realtime Database
    storage = firebase.storage();

    console.log('Firebase services initialized:');
    console.log('- Authentication: ✅');
    console.log('- Firestore: ✅');
    console.log('- Realtime Database: ✅');
    console.log('- Storage: ✅');

    // Enable offline persistence for Firestore
    db.enablePersistence()
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                console.log('Firestore persistence failed - multiple tabs open');
            } else if (err.code == 'unimplemented') {
                console.log('Firestore persistence not supported');
            }
        });
} else {
    // Create mock Firebase services for demo mode
    auth = {
        createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured. Please set up your Firebase project.')),
        signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured. Please set up your Firebase project.')),
        signOut: () => Promise.resolve(),
        onAuthStateChanged: (callback) => callback(null)
    };
    
    db = {
        collection: () => ({
            doc: () => ({
                set: () => Promise.reject(new Error('Firebase not configured. Please set up your Firebase project.')),
                get: () => Promise.reject(new Error('Firebase not configured. Please set up your Firebase project.'))
            }),
            add: () => Promise.reject(new Error('Firebase not configured. Please set up your Firebase project.')),
            get: () => Promise.resolve({ docs: [], forEach: () => {} })
        })
    };
    
    realtimeDB = {
        ref: () => ({
            set: () => Promise.reject(new Error('Firebase not configured. Please set up your Firebase project.')),
            push: () => Promise.reject(new Error('Firebase not configured. Please set up your Firebase project.')),
            once: () => Promise.reject(new Error('Firebase not configured. Please set up your Firebase project.'))
        })
    };
    
    storage = {
        ref: () => ({
            put: () => Promise.reject(new Error('Firebase not configured. Please set up your Firebase project.'))
        })
    };
}

// Export Firebase instances for use in other modules
window.firebaseAuth = auth;
window.firebaseDB = db; // Firestore
window.firebaseRealtimeDB = realtimeDB; // Realtime Database
window.firebaseStorage = storage;
window.firebaseInitialized = firebaseInitialized;
