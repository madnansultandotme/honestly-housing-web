import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

// Only initialize if we have valid credentials (not during build time)
const hasValidCredentials = 
  process.env.FIREBASE_ADMIN_PROJECT_ID && 
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 
  process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (hasValidCredentials) {
  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    adminApp = getApps()[0];
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);
} else {
  // Create stub objects for build time
  adminApp = {} as App;
  adminAuth = {} as Auth;
  adminDb = {} as Firestore;
  adminStorage = {} as Storage;
}

// Export
export { adminApp, adminAuth, adminDb, adminStorage };

// Helper to check if admin is initialized
export function isAdminInitialized(): boolean {
  return !!hasValidCredentials;
}
