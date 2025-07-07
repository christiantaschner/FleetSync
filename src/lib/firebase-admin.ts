
import * as admin from 'firebase-admin';

let dbAdmin: admin.firestore.Firestore | null = null;
let authAdmin: admin.auth.Auth | null = null;
let initError: Error | null = null;
let isInitialized = false;

function initializeAdmin() {
    if (isInitialized) return;

    try {
        if (!admin.apps.length) {
            console.log("Firebase Admin SDK: No apps found. Initializing...");
            admin.initializeApp();
            console.log("Firebase Admin SDK: Initialization successful.");
        } else {
            console.log(`Firebase Admin SDK: ${admin.apps.length} app(s) already exist.`);
        }
        dbAdmin = admin.firestore();
        authAdmin = admin.auth();
    } catch (e) {
        initError = e as Error;
        console.error("--- FIREBASE ADMIN SDK INITIALIZATION FAILED ---");
        console.error(initError);
        console.error("--------------------------------------------");
    }
    isInitialized = true;
}

export function getDbAdmin(): admin.firestore.Firestore {
    if (!isInitialized) {
        initializeAdmin();
    }
    if (initError) {
        throw new Error(`Firebase Admin SDK failed to initialize and dbAdmin is not available. Original error: ${initError.message}`);
    }
    if (!dbAdmin) {
        throw new Error("dbAdmin is not available. The Admin SDK might not have been initialized correctly, but no error was thrown.");
    }
    return dbAdmin;
}

export function getAuthAdmin(): admin.auth.Auth {
    if (!isInitialized) {
        initializeAdmin();
    }
    if (initError) {
        throw new Error(`Firebase Admin SDK failed to initialize and authAdmin is not available. Original error: ${initError.message}`);
    }
     if (!authAdmin) {
        throw new Error("authAdmin is not available. The Admin SDK might not have been initialized correctly, but no error was thrown.");
    }
    return authAdmin;
}
