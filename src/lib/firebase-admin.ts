
import * as admin from 'firebase-admin';

// This pattern ensures the SDK is initialized only once.
if (!admin.apps.length) {
    try {
        console.log("Firebase Admin SDK: Initializing...");
        admin.initializeApp();
        console.log("Firebase Admin SDK: Initialization successful.");
    } catch (e: any) {
        console.error("Firebase Admin SDK initialization failed:", e.stack);
    }
}

const dbAdmin = admin.firestore();
const authAdmin = admin.auth();

export { dbAdmin, authAdmin };
