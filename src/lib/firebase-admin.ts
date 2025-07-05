import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // When running in a Google Cloud environment (like Cloud Run, Cloud Functions),
    // the SDK automatically uses the service account credentials.
    // For local development, you need to set up Application Default Credentials (ADC)
    // by running `gcloud auth application-default login` in your terminal.
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error('Firebase admin initialization error:', error.message);
    // Avoid crashing the server on initialization error, but log it.
  }
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();
