
import * as admin from 'firebase-admin';

// This pattern ensures the SDK is initialized only once.
if (admin.apps.length === 0) {
    // Explicitly configure with Application Default Credentials.
    // This is the standard for Google Cloud environments and helps prevent
    // authentication conflicts with other Google SDKs like Genkit.
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
export const storageAdmin = admin.storage();
