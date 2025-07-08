
import * as admin from 'firebase-admin';

let dbAdmin: admin.firestore.Firestore | null = null;
let authAdmin: admin.auth.Auth | null = null;
let storageAdmin: admin.storage.Storage | null = null;

try {
    // In a Google Cloud environment (like App Hosting), initializeApp() with no arguments
    // automatically finds the project's service account credentials. This is the most robust method.
    // The check for admin.apps.length is removed as it's mainly for local dev hot-reloading.
    if (admin.apps.length === 0) {
      admin.initializeApp();
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
