import admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK using the service account credentials.
 * Ensure GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT is set in .env.
 */
export const initializeFirebaseAdmin = () => {
  try {
    if (!admin.apps.length) {
      // In production, we'd use process.env.GOOGLE_APPLICATION_CREDENTIALS
      // For development, we can mock it or expect the user to provide it.
      // If no credentials are provided, Firebase Admin will attempt to use Application Default Credentials.
      admin.initializeApp();
      console.log('[Firebase Admin] Initialized successfully');
    }
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error.message);
  }
};

export { admin };
