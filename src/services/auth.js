import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Error message formatter
const formatErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/api-key-not-valid-please-pass-a-valid-api-key':
      return 'Firebase configuration error. Please check your API key.';
    case 'auth/invalid-api-key':
      return 'Firebase API key is invalid. Please check your configuration.';
    case 'auth/configuration-not-found':
      return 'Firebase configuration not found. Please check your setup.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
};

// Sign up with email and password
export const signUp = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.displayName,
      createdAt: new Date(),
      playlists: [],
      favorites: [],
      uploadedSongs: []
    });
    
    return user;
  } catch (error) {
    const message = formatErrorMessage(error);
    throw new Error(message);
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    const message = formatErrorMessage(error);
    throw new Error(message);
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create user document if it doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        playlists: [],
        favorites: [],
        uploadedSongs: []
      });
    }
    
    return user;
  } catch (error) {
    const message = formatErrorMessage(error);
    throw new Error(message);
  }
};

// Sign out
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    const message = formatErrorMessage(error);
    throw new Error(message);
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};