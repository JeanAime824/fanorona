/**
 * @file storageService.ts
 * Persistence layer for Fanorona games, user settings, and match statistics.
 * Abstracted via IStorageService for future REST API / Cloud migration.
 */

import { GameSettings, GameState, GameStats } from "../../game/types/gameTypes";

export interface IStorageService {
  saveGame(state: GameState): boolean;
  loadGame(): GameState | null;
  deleteGame(): void;
  saveSettings(settings: GameSettings): void;
  loadSettings(): GameSettings;
  saveStats(stats: GameStats): void;
  loadStats(): GameStats;
}

const STORAGE_KEYS = {
  ACTIVE_GAME: "fanorona_active_game_v1",
  SETTINGS: "fanorona_settings_v1",
  STATS: "fanorona_stats_v1",
};

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  animationsEnabled: true,
  showPossibleMoves: true,
  aiDifficulty: "medium",
  confirmNewGame: true,
  theme: "modern_minimal",
  pieceTexture: "wooden",
  speedModeEnabled: false,
  turnTimeLimit: 30,
  playerNameWhite: "Joueur Blanc",
  playerNameBlack: "Joueur Noir",
};

export const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  gamesDrawn: 0,
  aiWins: {
    easy: 0,
    medium: 0,
    hard: 0,
  },
  totalCaptures: 0,
};

export class LocalStorageService implements IStorageService {
  public saveGame(state: GameState): boolean {
    try {
      if (typeof window === "undefined") return false;
      const serialized = JSON.stringify(state);
      window.localStorage.setItem(STORAGE_KEYS.ACTIVE_GAME, serialized);
      return true;
    } catch (e) {
      console.warn("Unable to save game to localStorage:", e);
      return false;
    }
  }

  public loadGame(): GameState | null {
    try {
      if (typeof window === "undefined") return null;
      const raw = window.localStorage.getItem(STORAGE_KEYS.ACTIVE_GAME);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Validate core shape
      if (
        Array.isArray(parsed.board) &&
        parsed.board.length === 5 &&
        parsed.currentPlayer &&
        parsed.status
      ) {
        return parsed as GameState;
      }
      return null;
    } catch (e) {
      console.warn("Corrupted game save detected in localStorage, resetting:", e);
      this.deleteGame();
      return null;
    }
  }

  public deleteGame(): void {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_GAME);
    } catch (e) {
      console.warn("Failed to clear game save:", e);
    }
  }

  public saveSettings(settings: GameSettings): void {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to persist settings:", e);
    }
  }

  public loadSettings(): GameSettings {
    try {
      if (typeof window === "undefined") return DEFAULT_SETTINGS;
      const raw = window.localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      const validThemes = ["modern_minimal", "luxury_wood", "zen_bamboo", "malagasy_wood", "slate_contemporary"];
      const theme = validThemes.includes(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme;
      const pieceTexture = parsed.pieceTexture === "stone" ? "stone" : "wooden";
      const speedModeEnabled = typeof parsed.speedModeEnabled === "boolean" ? parsed.speedModeEnabled : DEFAULT_SETTINGS.speedModeEnabled;
      const turnTimeLimit = typeof parsed.turnTimeLimit === "number" && parsed.turnTimeLimit > 0 ? parsed.turnTimeLimit : DEFAULT_SETTINGS.turnTimeLimit;
      const playerNameWhite = typeof parsed.playerNameWhite === "string" && parsed.playerNameWhite.trim() ? parsed.playerNameWhite.trim() : DEFAULT_SETTINGS.playerNameWhite;
      const playerNameBlack = typeof parsed.playerNameBlack === "string" && parsed.playerNameBlack.trim() ? parsed.playerNameBlack.trim() : DEFAULT_SETTINGS.playerNameBlack;
      return { ...DEFAULT_SETTINGS, ...parsed, theme, pieceTexture, speedModeEnabled, turnTimeLimit, playerNameWhite, playerNameBlack };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  public saveStats(stats: GameStats): void {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn("Failed to persist stats:", e);
    }
  }

  public loadStats(): GameStats {
    try {
      if (typeof window === "undefined") return DEFAULT_STATS;
      const raw = window.localStorage.getItem(STORAGE_KEYS.STATS);
      if (!raw) return DEFAULT_STATS;
      return { ...DEFAULT_STATS, ...JSON.parse(raw) };
    } catch (e) {
      return DEFAULT_STATS;
    }
  }
}

export const storageService = new LocalStorageService();
