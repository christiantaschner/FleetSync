
import * as admin from 'firebase-admin';

// This pattern ensures the SDK is initialized only once.
if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
        console.log(JSON.stringify({
            message: "Firebase Admin SDK initialized successfully.",
            severity: "INFO"
        }));
    } catch (error: any) {
        console.error(JSON.stringify({
            message: "CRITICAL: Firebase Admin SDK initialization failed.",
            error: {
                message: error.message,
                stack: error.stack,
            },
            severity: "ERROR"
        }));
    }
}

export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
export const storageAdmin = admin.storage();
