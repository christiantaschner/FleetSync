
import * as admin from 'firebase-admin';

// This pattern ensures the SDK is initialized only once.
if (admin.apps.length === 0) {
    // Explicitly providing the projectId can resolve auth issues in some serverless environments
    // where the default project is not automatically inferred.
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
export const storageAdmin = admin.storage();
