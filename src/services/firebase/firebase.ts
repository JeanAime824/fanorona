/**
 * @file firebase.ts
 * Firebase App, Auth, and Firestore initialization with configuration from firebase-applet-config.json.
 */

import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDocFromServer,
  getFirestore,
} from "firebase/firestore";
import jsonConfig from "../../../firebase-applet-config.json";

// Construct active configuration dynamically (Env Vars take priority over JSON config)
const env = (import.meta as any).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || jsonConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || jsonConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || jsonConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || jsonConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || jsonConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || jsonConfig.appId,
  firestoreDatabaseId: jsonConfig.firestoreDatabaseId,
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore with custom databaseId from firebaseConfig
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider configured for popups
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Operation Types for Firestore Error Reporting
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Hardened error handler required by Firebase skill.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate initial connection to Firestore on app startup
 */
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error: any) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.error("Please check your Firebase configuration.");
    } else if (
      error?.message?.includes("Database '(default)' not found") ||
      error?.code === "not-found"
    ) {
      console.warn(
        `[Firebase] Base de données Firestore '(default)' non provisionnée dans le projet '${firebaseConfig.projectId}'. ` +
        `Rendez-vous dans la console Firebase pour créer la base Firestore.`
      );
    }
  }
}

// Call test connection
testConnection();
