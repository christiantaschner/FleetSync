
import * as admin from 'firebase-admin';

let dbAdmin: admin.firestore.Firestore | null = null;
let authAdmin: admin.auth.Auth | null = null;
let storageAdmin: admin.storage.Storage | null = null;

try {
    // In a Google Cloud environment (like App Hosting), initializeApp() with no arguments
    // should automatically find the project's service account credentials. 
    // Being explicit can resolve auth issues in some environments.
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
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
