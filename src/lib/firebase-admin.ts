
import * as admin from 'firebase-admin';

// This pattern ensures the SDK is initialized only once.
if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
        console.log("Firebase Admin SDK initialized successfully with explicit Project ID.");
    } catch (error: any) {
        console.error(`
        ---
        CRITICAL: Firebase Admin SDK initialization failed.
        ---
        Error Message: ${error.message}
        This is a fatal error. Server-side Firebase services (Firestore, Auth) will not be available.
        Please check your server environment configuration and credentials.
        ---
        `);
    }
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
export const storageAdmin = admin.storage();
