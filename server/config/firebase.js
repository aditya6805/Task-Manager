import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Initialize Firebase Admin SDK
 * Reads serviceAccountKey.json and initializes Firebase Admin
 * @returns {void}
 */
export const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log("✓ Firebase already initialized");
      return;
    }

    // Prefer env-based credentials for deployment; fall back to local file for development
    let serviceAccount;
    const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (envServiceAccount) {
      serviceAccount = JSON.parse(envServiceAccount);
    } else {
      const serviceAccountKeyPath = path.join(
        __dirname,
        "serviceAccountKey.json",
      );

      if (!fs.existsSync(serviceAccountKeyPath)) {
        throw new Error(
          `Service account key not found at ${serviceAccountKeyPath}. Set FIREBASE_SERVICE_ACCOUNT for deployment environments.`,
        );
      }

      serviceAccount = JSON.parse(
        fs.readFileSync(serviceAccountKeyPath, "utf-8"),
      );
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✓ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Firebase initialization error:", error.message);
    throw error;
  }
};

/**
 * Get Firebase Admin instance
 * @returns {admin.app.App}
 */
export const getFirebaseAdmin = () => {
  if (admin.apps.length === 0) {
    throw new Error("Firebase Admin SDK not initialized");
  }
  return admin;
};

/**
 * Verify Firebase ID token
 * @param {string} token - Firebase ID token
 * @returns {Promise<admin.auth.DecodedIdToken>}
 */
export const verifyIdToken = async (token) => {
  try {
    if (admin.apps.length === 0) {
      throw new Error("Firebase Admin SDK not initialized");
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("❌ Token verification error:", error.message);
    throw new Error("Invalid or expired token");
  }
};
