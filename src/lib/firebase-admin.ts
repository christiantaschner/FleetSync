
import * as admin from 'firebase-admin';

let dbAdmin: admin.firestore.Firestore | null = null;
let authAdmin: admin.auth.Auth | null = null;
let storageAdmin: admin.storage.Storage | null = null;

try {
    if (admin.apps.length === 0) {
        // In a deployed Google Cloud environment (like App Hosting), the SDK
        // will automatically find the project's service account credentials.
        if (process.env.NODE_ENV === 'production') {
            admin.initializeApp();
            console.log('Firebase Admin SDK initialized for production.');
        } else {
             // For local development, we use the Project ID and expect Application
             // Default Credentials (ADC) to be configured. This is more robust
             // than parsing a JSON string from an env var.
             // See updated README for instructions on setting up ADC.
             if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
                admin.initializeApp({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
                });
                console.log(`Firebase Admin SDK initialized for local development for project ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.`);
             } else {
                throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set. Cannot initialize Firebase Admin SDK for local development.");
             }
        }
    }
    
    dbAdmin = admin.firestore();
    authAdmin = admin.auth();
    storageAdmin = admin.storage();
} catch (error: any) {
    console.error(JSON.stringify({
        message: "CRITICAL: Firebase Admin SDK initialization failed.",
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
        },
        severity: "CRITICAL"
    }));
    // On failure, dbAdmin, authAdmin, and storageAdmin will remain null.
}

export { dbAdmin, authAdmin, storageAdmin };
