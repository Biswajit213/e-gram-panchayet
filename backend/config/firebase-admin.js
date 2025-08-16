const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin SDK configuration
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
  });
}

// Export Firebase services
const db = admin.firestore();
const realtimeDb = admin.database();
const auth = admin.auth();
const storage = admin.storage();

// Helper functions
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const getUserRole = async (uid) => {
  try {
    // Check in Realtime Database first
    const userSnapshot = await realtimeDb.ref(`users/${uid}`).once('value');
    if (userSnapshot.exists()) {
      return userSnapshot.val().role || 'user';
    }

    // Fallback to Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    if (userDoc.exists) {
      return userDoc.data().role || 'user';
    }

    return 'user'; // Default role
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};

const createUser = async (userData) => {
  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.name,
      disabled: false
    });

    // Save user data to Realtime Database
    await realtimeDb.ref(`users/${userRecord.uid}`).set({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      role: userData.role || 'user',
      createdAt: admin.database.ServerValue.TIMESTAMP,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    });

    return userRecord;
  } catch (error) {
    throw error;
  }
};

const updateUser = async (uid, userData) => {
  try {
    // Update Firebase Auth profile
    const updateData = {};
    if (userData.name) updateData.displayName = userData.name;
    if (userData.email) updateData.email = userData.email;
    
    if (Object.keys(updateData).length > 0) {
      await auth.updateUser(uid, updateData);
    }

    // Update Realtime Database
    const dbUpdateData = {
      ...userData,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };
    
    await realtimeDb.ref(`users/${uid}`).update(dbUpdateData);

    return { success: true };
  } catch (error) {
    throw error;
  }
};

const deleteUser = async (uid) => {
  try {
    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    // Delete from Realtime Database
    await realtimeDb.ref(`users/${uid}`).remove();

    return { success: true };
  } catch (error) {
    throw error;
  }
};

// Export everything
module.exports = {
  admin,
  db,
  realtimeDb,
  auth,
  storage,
  verifyIdToken,
  getUserRole,
  createUser,
  updateUser,
  deleteUser
};
