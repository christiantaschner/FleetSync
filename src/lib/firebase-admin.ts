
import * as admin from 'firebase-admin';

// This pattern ensures the SDK is initialized only once. It initializes the
// default app if no apps exist, which is the most common and robust pattern
// for serverless environments where module loading can be complex.
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Get the services from the default app instance.
export const dbAdmin = admin.firestore();
export const authAdmin = admin.auth();
export const storageAdmin = admin.storage();
