/**
 * @file syncService.ts
 * Firestore database synchronization for user profiles, match statistics, and match history.
 */

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
import { GameSettings, GameStats, GameState } from "../../game/types/gameTypes";
import { OperationType, auth, db, handleFirestoreError } from "./firebase";

export interface CloudGameRecord {
  id: string;
  userId: string;
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

export interface CloudUserStats {
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  totalCaptures: number;
  speedModeEnabled: boolean;
  turnTimeLimit: number;
  theme: string;
  pieceTexture: string;
  playerNameWhite?: string;
  playerNameBlack?: string;
  updatedAt: string;
}

/**
 * Save user profile upon successful Google authentication
 */
export async function syncUserProfile(
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await setDoc(
      doc(db, path),
      {
        id: uid,
        email: email || "unknown@example.com",
        displayName: displayName || "Joueur Fanorona",
        photoURL: photoURL || "",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save or update player's cumulative stats and settings in Firestore: users/{uid}/stats/main
 */
export async function syncStatsAndSettingsToFirestore(
  stats: GameStats,
  settings: GameSettings
): Promise<void> {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const path = `users/${uid}/stats/main`;

  try {
    const data: CloudUserStats = {
      userId: uid,
      gamesPlayed: stats.gamesPlayed,
      gamesWon: stats.gamesWon,
      gamesLost: stats.gamesLost,
      gamesDrawn: stats.gamesDrawn,
      totalCaptures: stats.totalCaptures,
      speedModeEnabled: !!settings.speedModeEnabled,
      turnTimeLimit: settings.turnTimeLimit || 30,
      theme: settings.theme,
      pieceTexture: settings.pieceTexture,
      playerNameWhite: settings.playerNameWhite || "Joueur Blanc",
      playerNameBlack: settings.playerNameBlack || "Joueur Noir",
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, path), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save an individual completed game record to Firestore: users/{uid}/games/{gameId}
 */
export async function saveGameRecordToFirestore(
  gameState: GameState,
  speedModeEnabled: boolean
): Promise<void> {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${uid}/games/${gameId}`;

  try {
    const record: CloudGameRecord = {
      id: gameId,
      userId: uid,
      gameMode: gameState.gameMode,
      winner: gameState.winner || "draw",
      difficulty: gameState.difficulty,
      turnNumber: gameState.turnNumber,
      capturedWhite: gameState.capturedPieces.white,
      capturedBlack: gameState.capturedPieces.black,
      speedMode: speedModeEnabled,
      reason: gameState.reason || "",
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, path), record);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Load cloud user stats & preferences if available
 */
export async function loadUserStatsFromFirestore(): Promise<CloudUserStats | null> {
  if (!auth.currentUser) return null;
  const uid = auth.currentUser.uid;
  const path = `users/${uid}/stats/main`;

  try {
    const docSnap = await getDoc(doc(db, path));
    if (docSnap.exists()) {
      return docSnap.data() as CloudUserStats;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Load recent user match history from Firestore
 */
export async function loadMatchHistoryFromFirestore(
  maxRecords = 20
): Promise<CloudGameRecord[]> {
  if (!auth.currentUser) return [];
  const uid = auth.currentUser.uid;
  const path = `users/${uid}/games`;

  try {
    const q = query(
      collection(db, path),
      orderBy("createdAt", "desc"),
      limit(maxRecords)
    );
    const snap = await getDocs(q);
    const results: CloudGameRecord[] = [];
    snap.forEach((d) => {
      results.push(d.data() as CloudGameRecord);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
