import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from '../config/firebase';

/**
 * Firebase Authentication Service
 * Manages Email/Password registration, sign-in, session state, and Firestore user profiles.
 */

/**
 * Register a new user using Email and Password
 * @param {string} email
 * @param {string} password
 * @param {object} profileData - { name, role, company }
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function registerWithEmail(email, password, profileData = {}) {
  const { name = '', role = 'user', company = '' } = profileData;

  // 1. Create user account in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  // 2. Update display name in Firebase Auth
  if (name) {
    await updateProfile(firebaseUser, { displayName: name });
  }

  // 3. Persist extended profile in Firestore 'users' collection
  const userProfile = {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: name || firebaseUser.email.split('@')[0],
    role: role || 'user',
    company: company || '',
    avatarUrl: firebaseUser.photoURL || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, userProfile);
  } catch (firestoreErr) {
    console.warn('[Firebase Auth] Could not create Firestore profile doc immediately:', firestoreErr.message);
  }

  const idToken = await firebaseUser.getIdToken();

  return {
    user: {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: name || firebaseUser.displayName,
      role: userProfile.role,
      token: idToken,
    },
    token: idToken,
  };
}

/**
 * Log in an existing user with Email and Password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function loginWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  const idToken = await firebaseUser.getIdToken();

  // Fetch user profile from Firestore if available
  let role = 'user';
  let company = '';
  try {
    const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userSnap.exists()) {
      const data = userSnap.data();
      role = data.role || 'user';
      company = data.company || '';
    }
  } catch (err) {
    console.warn('[Firebase Auth] Firestore profile fetch failed, fallback to default:', err.message);
  }

  return {
    user: {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      role,
      company,
      token: idToken,
    },
    token: idToken,
  };
}

/**
 * Sign out current Firebase user
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Listen to Firebase Auth state changes
 * @param {function} callback - Receives user object or null
 * @returns {function} unsubscribe function
 */
export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    let role = 'user';
    let company = '';
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        role = data.role || 'user';
        company = data.company || '';
      }
    } catch {
      // Ignored if permissions not yet cached
    }

    const token = await firebaseUser.getIdToken();

    callback({
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      role,
      company,
      token,
    });
  });
}

/**
 * Get current authenticated user
 */
export function getCurrentFirebaseUser() {
  return auth.currentUser;
}
