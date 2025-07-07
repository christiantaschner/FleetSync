
import * as admin from 'firebase-admin';

console.log("firebase_admin.ts: Start of file execution.");

let dbAdmin: admin.firestore.Firestore | null = null;
let authAdmin: admin.auth.Auth | null = null;
let storageAdmin: admin.storage.Storage | null = null;

try {
    console.log("firebase_admin.ts: Checking if admin app is already initialized.");
    if (admin.apps.length === 0) {
        console.log("firebase_admin.ts: Initializing Firebase Admin SDK with default credentials...");
        // In a Google Cloud environment (like App Hosting), initializeApp() with no arguments
        // automatically finds the project's service account credentials. This is the most robust method.
        admin.initializeApp();
        console.log("firebase_admin.ts: Firebase Admin SDK initialized successfully.");
    } else {
        console.log("firebase_admin.ts: Firebase Admin SDK already initialized.");
    }
    dbAdmin = admin.firestore();
    authAdmin = admin.auth();
    storageAdmin = admin.storage();
    console.log("firebase_admin.ts: Firestore, Auth, and Storage Admin instances obtained.");
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

console.log("firebase_admin.ts: End of file execution.");

export { dbAdmin, authAdmin, storageAdmin };
