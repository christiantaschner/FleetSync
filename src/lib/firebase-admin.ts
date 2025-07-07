
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Storage } from 'firebase-admin/storage';

let app: App;

// This pattern ensures the SDK is initialized only once across serverless function invocations.
if (!admin.apps.length) {
    try {
        console.log("Firebase Admin SDK: Initializing for the first time...");
        app = admin.initializeApp();
        console.log("Firebase Admin SDK: Initialization successful.");
    } catch (e: any) {
        console.error("Firebase Admin SDK initialization failed:", e.stack);
        // To prevent the app from running in a broken state, it's better to throw.
        throw new Error("CRITICAL: Firebase Admin SDK failed to initialize.");
    }
} else {
    app = admin.apps[0]!;
    console.log("Firebase Admin SDK: Already initialized.");
}

const authAdmin: Auth = admin.auth(app);
const dbAdmin: Firestore = admin.firestore(app);
const storageAdmin: Storage = admin.storage(app);

export { dbAdmin, authAdmin, storageAdmin };
