
import * as admin from 'firebase-admin';

let dbAdmin: admin.firestore.Firestore | null = null;
let authAdmin: admin.auth.Auth | null = null;
let storageAdmin: admin.storage.Storage | null = null;

try {
    if (admin.apps.length === 0) {
        // In a deployed Google Cloud environment (like App Hosting), the SDK
        // will automatically find the project's service account credentials.
        if (process.env.NODE_ENV === 'production') {
            admin.initializeApp();
            console.log('Firebase Admin SDK initialized for production.');
        } else {
            // For local development, we check for a service account key file.
            // This is more robust than relying on Application Default Credentials (ADC)
            // which might not be configured on a developer's machine.
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                });
                console.log('Firebase Admin SDK initialized for local development with service account.');
            } else {
                 // Fallback to ADC if the specific variable isn't set
                admin.initializeApp();
                console.warn('WARNING: GOOGLE_APPLICATION_CREDENTIALS env var not set. Falling back to Application Default Credentials for local development.');
            }
        }
    }
    
    dbAdmin = admin.firestore();
    authAdmin = admin.auth();
    storageAdmin = admin.storage();
} catch (error: any) {
    console.error(JSON.stringify({
        message: "CRITICAL: Firebase Admin SDK initialization failed.",
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
        },
        severity: "CRITICAL"
    }));
    // On failure, dbAdmin, authAdmin, and storageAdmin will remain null.
}

export { dbAdmin, authAdmin, storageAdmin };
