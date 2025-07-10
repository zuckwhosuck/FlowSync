import { initializeApp, getApp } from "firebase/app";

import { 
  getAuth, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA5WfDj5cQXnC2aEt7r3XPV757k9J07-Xg",
  authDomain: "crm-48b32.firebaseapp.com",
  projectId: "crm-48b32",
  storageBucket: "crm-48b32.firebasestorage.app",
  messagingSenderId: "1050665010032",
  appId: "1:1050665010032:web:e3ef236475d67be2c705b5",
  measurementId: "G-7NF86BH06R"
};

// Initialize Firebase
let app;
try {
  console.log("Firebase config:", firebaseConfig);
  app = initializeApp(firebaseConfig);
} catch (error: any) {
  // Detect duplicate app initialization
  if (error.code === "app/duplicate-app") {
    console.log('Firebase app already exists, retrieving existing app.');
    app = getApp();
  } else {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting ID token", error);
    return null;
  }
}

export const signUpWithEmailPassword = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, {
      displayName: displayName,
    });
    return result.user;
  } catch (error) {
    console.error("Error signing up with email and password", error);
    throw error;
  }
};

export const signInWithEmailPassword = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email and password", error);
    throw error;
  }
};

export { auth };
