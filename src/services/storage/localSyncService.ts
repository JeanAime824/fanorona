/**
 * @file localSyncService.ts
 * Local persistence layer for match history, statistics, and preferences.
 * 100% self-hosted: operates on localStorage and local backend without Firebase.
 */

import { GameSettings, GameStats, GameState } from "../../game/types/gameTypes";

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

const STORAGE_KEYS = {
  MATCH_HISTORY: "fanorona_local_match_history_v1",
  USER_STATS: "fanorona_local_user_stats_v1",
  USER_PROFILE: "fanorona_custom_user",
};

/**
 * Save user profile locally
 */
export async function syncUserProfile(
  uid: string,
  email: string,
  displayName: string,
  photoURL?: string
): Promise<void> {
  try {
    const profile = {
      id: uid,
      email: email || "local@fanorona.local",
      username: displayName || "Joueur Fanorona",
      displayName: displayName || "Joueur Fanorona",
      avatar_url: photoURL || "",
      photoURL: photoURL || "",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.warn("Erreur sauvegarde profil local:", err);
  }
}

/**
 * Save or update player's cumulative stats and settings locally
 */
export async function syncStatsAndSettings(
  stats: GameStats,
  settings: GameSettings
): Promise<void> {
  try {
    const rawUser = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const userId = rawUser ? JSON.parse(rawUser)?.id || "local_player" : "local_player";

    const data: CloudUserStats = {
      userId,
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

    localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(data));
  } catch (error) {
    console.warn("Erreur synchronisation stats locales:", error);
  }
}

/**
 * Save an individual completed game record to local match history
 */
export async function saveGameRecord(
  gameState: GameState,
  speedModeEnabled: boolean
): Promise<void> {
  try {
    const rawUser = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const userId = rawUser ? JSON.parse(rawUser)?.id || "local_player" : "local_player";
    const gameId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const record: CloudGameRecord = {
      id: gameId,
      userId,
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

    const existing: CloudGameRecord[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY) || "[]"
    );
    existing.unshift(record);
    localStorage.setItem(
      STORAGE_KEYS.MATCH_HISTORY,
      JSON.stringify(existing.slice(0, 50))
    );
  } catch (error) {
    console.warn("Erreur sauvegarde historique local:", error);
  }
}

/**
 * Load local user stats & preferences if available
 */
export async function loadUserStats(): Promise<CloudUserStats | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_STATS);
    if (raw) {
      return JSON.parse(raw) as CloudUserStats;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Load recent local match history
 */
export async function loadMatchHistory(maxRecords = 20): Promise<CloudGameRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
    if (!raw) return [];
    const records = JSON.parse(raw) as CloudGameRecord[];
    return records.slice(0, maxRecords);
  } catch {
    return [];
  }
}

// Compatibility aliases for seamless migration
export const syncStatsAndSettingsToFirestore = syncStatsAndSettings;
export const saveGameRecordToFirestore = saveGameRecord;
export const loadUserStatsFromFirestore = loadUserStats;
export const loadMatchHistoryFromFirestore = loadMatchHistory;
