
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
    console.error('CRITICAL: Firebase admin initialization error. Server actions will fail. Ensure you have set up Application Default Credentials (ADC) for local development or that the service account has the correct permissions in production.', error.message);
  }
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();
