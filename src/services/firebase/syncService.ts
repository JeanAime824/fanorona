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
 * Save user profile upon successful authentication
 */
export async function syncUserProfile(
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string,
  playerId?: string,
  extra?: { isa?: number; gamesPlayed?: number; winRate?: number; username?: string; status?: string }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const payload: Record<string, any> = {
      id: uid,
      email: email || "unknown@example.com",
      displayName: displayName || "Joueur Fanorona",
      username: extra?.username || displayName || "Joueur Fanorona",
      photoURL: photoURL || "",
      status: extra?.status || "ONLINE",
      updatedAt: new Date().toISOString(),
    };
    if (playerId) payload.player_id = playerId;
    if (typeof extra?.isa === "number") payload.isa = extra.isa;
    if (typeof extra?.gamesPlayed === "number") payload.games_played = extra.gamesPlayed;
    if (typeof extra?.winRate === "number") payload.win_rate = extra.winRate;

    await setDoc(doc(db, path), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Retrieve all registered community players from Cloud Firestore
 */
export async function getFirestoreCommunityUsers(): Promise<any[]> {
  try {
    const usersRef = collection(db, "users");
    const snap = await getDocs(query(usersRef, limit(100)));
    const list: any[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: data.id || docSnap.id,
        username: data.username || data.displayName || "Joueur Fanorona",
        email: data.email || "",
        player_id: data.player_id || (data.id || docSnap.id).substring(0, 6).toUpperCase(),
        isa: data.isa || 1200,
        games_played: data.games_played || 0,
        win_rate: data.win_rate || 0,
        avatar_url: data.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(data.username || data.displayName || data.id || docSnap.id)}`,
        status: data.status || "ONLINE",
        relation_status: "none",
      });
    });
    return list;
  } catch (err) {
    console.warn("[getFirestoreCommunityUsers] Error fetching Firestore users:", err);
    return [];
  }
}

/**
 * Search registered players in Firestore (fallback when backend is unavailable)
 */
export async function searchFirestoreUsers(searchQuery: string): Promise<any[]> {
  try {
    const usersRef = collection(db, "users");
    const snap = await getDocs(query(usersRef, limit(40)));
    const q = searchQuery.trim().toLowerCase();
    const cleanId = searchQuery.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

    const matches: any[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const uname = (data.username || data.displayName || "").toLowerCase();
      const uemail = (data.email || "").toLowerCase();
      const upid = (data.player_id || "").toUpperCase();

      if (!q) {
        matches.push(data);
      } else if (
        (cleanId.length >= 2 && upid.includes(cleanId)) ||
        uname.includes(q) ||
        uemail.includes(q)
      ) {
        matches.push(data);
      }
    });

    return matches.map((u) => ({
      id: u.id,
      username: u.username || u.displayName || "Joueur Fanorona",
      email: u.email || "",
      player_id: u.player_id || u.id.substring(0, 6).toUpperCase(),
      isa: u.isa || 1500,
      games_played: u.games_played || 0,
      win_rate: u.win_rate || 50,
      avatar_url: u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username || u.displayName || u.id)}`,
      relation_status: "none",
    }));
  } catch (err) {
    console.warn("[searchFirestoreUsers] Firestore lookup skipped:", err);
    return [];
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
