import admin from 'firebase-admin';

/**
 * Initializes the Firebase Admin SDK using the service account credentials.
 * Ensure GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT is set in .env.
 */
export const initializeFirebaseAdmin = () => {
  try {
    if (!admin.apps.length) {
      let credential;
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          credential = admin.credential.cert(serviceAccount);
        } catch (e) {
          console.warn('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON, falling back to application default credentials.');
        }
      }

      const appOptions = {
        projectId: process.env.FIREBASE_PROJECT_ID || 'apporbit-e635d',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'apporbit-e635d.firebasestorage.app'
      };

      if (credential) {
        appOptions.credential = credential;
      } else {
        appOptions.credential = admin.credential.applicationDefault();
      }

      admin.initializeApp(appOptions);
      console.log('[Firebase Admin] Initialized successfully');
    }
  } catch (error) {
    console.error('[Firebase Admin] Failed to initialize:', error.message);
  }
};

export { admin };
