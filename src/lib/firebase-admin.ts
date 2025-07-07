
import * as admin from 'firebase-admin';

let dbAdmin: admin.firestore.Firestore | null = null;
let authAdmin: admin.auth.Auth | null = null;

try {
    if (!admin.apps.length) {
        // Use the parameter-less initializeApp() which is the recommended way
        // for Google Cloud environments like App Hosting. It automatically
        // uses the service account credentials provided by the environment.
        admin.initializeApp();
        console.log("Firebase Admin SDK initialized automatically.");
    }
    // If initialization succeeds (or has already succeeded), get the instances.
    dbAdmin = admin.firestore();
    authAdmin = admin.auth();
} catch (error: any) {
    console.error(`
---
CRITICAL: Firebase Admin SDK initialization failed.
---
This can happen if the server environment is not configured with the necessary permissions.
---
Error Message: ${error.message}
---
    `);
    // On failure, dbAdmin and authAdmin will remain null.
}

export { dbAdmin, authAdmin };
