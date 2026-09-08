/**
 * @file AuthContext.tsx
 * Firebase Authentication context provider providing Google sign-in, user profile synchronization,
 * cloud match persistence, and Firestore stats tracking.
 */

import {
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { GameSettings, GameStats } from "../game/types/gameTypes";
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from "../services/firebase/firebase";

export interface CloudGameRecord {
  id: string;
  gameMode: string;
  winner: string;
  difficulty: string;
  turnNumber: number;
  capturedWhite: number;
  capturedBlack: number;
  speedMode: boolean;
  reason?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthAvailable: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  saveMatchToCloud: (
    gameMode: string,
    winner: string,
    difficulty: string,
    turnNumber: number,
    capturedWhite: number,
    capturedBlack: number,
    speedMode: boolean,
    reason?: string
  ) => Promise<void>;
  saveStatsToCloud: (stats: GameStats, settings: GameSettings) => Promise<void>;
  fetchRecentCloudGames: () => Promise<CloudGameRecord[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Synchronize user profile into Firestore
        const userDocPath = `users/${firebaseUser.uid}`;
        try {
          await setDoc(
            doc(db, userDocPath),
            {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || "Joueur Fanorona",
              photoURL: firebaseUser.photoURL || "",
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn("Could not sync user profile to Firestore:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Process redirect sign in result on startup
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.warn("Redirect sign-in result error:", err);
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.warn("Popup sign in failed or blocked, falling back to redirect:", error);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError) {
        console.error("Erreur lors de la connexion Google par redirection:", redirectError);
        throw redirectError;
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      throw error;
    }
  };

  /**
   * Save finished match record to Firestore subcollection: users/{uid}/games/{gameId}
   */
  const saveMatchToCloud = async (
    gameMode: string,
    winner: string,
    difficulty: string,
    turnNumber: number,
    capturedWhite: number,
    capturedBlack: number,
    speedMode: boolean,
    reason?: string
  ) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const path = `users/${uid}/games/${gameId}`;

    try {
      await setDoc(doc(db, path), {
        id: gameId,
        userId: uid,
        gameMode,
        winner,
        difficulty,
        turnNumber,
        capturedWhite,
        capturedBlack,
        speedMode,
        reason: reason || "",
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  /**
   * Save player stats and preferences to Firestore: users/{uid}/stats/main
   */
  const saveStatsToCloud = async (stats: GameStats, settings: GameSettings) => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/stats/main`;

    try {
      await setDoc(
        doc(db, path),
        {
          userId: uid,
          gamesPlayed: stats.gamesPlayed,
          gamesWon: stats.gamesWon,
          gamesLost: stats.gamesLost,
          gamesDrawn: stats.gamesDrawn,
          totalCaptures: stats.totalCaptures,
          speedModeEnabled: settings.speedModeEnabled,
          turnTimeLimit: settings.turnTimeLimit,
          theme: settings.theme,
          pieceTexture: settings.pieceTexture,
          playerNameWhite: settings.playerNameWhite || "Joueur Blanc",
          playerNameBlack: settings.playerNameBlack || "Joueur Noir",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  /**
   * Fetch recent games played by user from Firestore
   */
  const fetchRecentCloudGames = async (): Promise<CloudGameRecord[]> => {
    if (!auth.currentUser) return [];
    const uid = auth.currentUser.uid;
    const path = `users/${uid}/games`;

    try {
      const q = query(collection(db, path), orderBy("createdAt", "desc"), limit(10));
      const snapshot = await getDocs(q);
      const records: CloudGameRecord[] = [];
      snapshot.forEach((d) => {
        records.push(d.data() as CloudGameRecord);
      });
      return records;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthAvailable: true,
        signInWithGoogle,
        logout,
        saveMatchToCloud,
        saveStatsToCloud,
        fetchRecentCloudGames,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
