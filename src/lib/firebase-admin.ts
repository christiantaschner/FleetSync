import * as admin from 'firebase-admin';

let dbAdmin: admin.firestore.Firestore | null = null;
let authAdmin: admin.auth.Auth | null = null;

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
        console.log("Firebase Admin SDK initialized successfully via Application Default Credentials.");
    }
    // If initialization succeeds (or has already succeeded), get the instances.
    dbAdmin = admin.firestore();
    authAdmin = admin.auth();
} catch (error: any) {
    console.error(`
---
CRITICAL: Firebase Admin SDK initialization failed.
---
This is likely because Application Default Credentials (ADC) are not configured correctly for your local environment.
To fix this, run the following command in your terminal and follow the prompts:

    gcloud auth application-default login

---
Error Message: ${error.message}
---
    `);
    // On failure, dbAdmin and authAdmin will remain null.
}

export { dbAdmin, authAdmin };
