
import * as admin from 'firebase-admin';

let dbAdmin: admin.firestore.Firestore | null = null;
let authAdmin: admin.auth.Auth | null = null;
let storageAdmin: admin.storage.Storage | null = null;

try {
    // In a Google Cloud environment (like App Hosting), initializeApp() with no arguments
    // automatically finds the project's service account credentials. 
    // Being explicit with the Project ID can resolve auth issues in some environments.
    if (admin.apps.length === 0) {
      admin.initializeApp({
        // Use the project ID from the environment variables to be explicit.
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
    
    dbAdmin = admin.firestore();
    authAdmin = admin.auth();
    storageAdmin = admin.storage();
} catch (error: any) {
    console.error(JSON.stringify({
        message: "CRITICAL: Firebase Admin SDK initialization failed.",
        error: {
            message: error.message,
            stack: error.stack,
        },
        severity: "ERROR"
    }));
    // On failure, dbAdmin, authAdmin, and storageAdmin will remain null.
}

export { dbAdmin, authAdmin, storageAdmin };
