/**
 * @file AuthContext.tsx
 * Authentication context for Fanorona.
 * Supports JWT authentication (backend authority), 6-character Player ID,
 * session persistence, offline fallback, and cloud synchronization.
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase/firebase";
import { GameSettings, GameStats } from "../game/types/gameTypes";
import { UserProfile } from "../game/types/userTypes";
import { api } from "../services/api";
import { socketService } from "../services/socketService";
import { syncUserProfile } from "../services/firebase/syncService";

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

export interface PlatformUser extends UserProfile {
  uid: string; // Compatibility alias for id
  displayName: string; // Compatibility alias for username
  photoURL: string; // Compatibility alias for avatar_url
}

interface AuthContextType {
  user: PlatformUser | null;
  loading: boolean;
  isAuthAvailable: boolean;
  login: (usernameOrEmail: string, password?: string) => Promise<void>;
  register: (username: string, email: string, password?: string, avatarUrl?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithUsername: (username: string) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { username?: string; avatar_url?: string }) => Promise<void>;
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

function normalizeUser(p: UserProfile): PlatformUser {
  return {
    ...p,
    uid: p.id,
    displayName: p.username,
    photoURL: p.avatar_url || "",
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize socket authentication when user changes
  useEffect(() => {
    if (user) {
      try {
        const token = localStorage.getItem("fanorona_jwt_token");
        socketService.authenticate(token, user.id, user);
      } catch (err) {
        console.warn("Socket auth sync:", err);
      }
    }
  }, [user]);

  const applyUser = (norm: PlatformUser) => {
    setUser(norm);
    localStorage.setItem("fanorona_custom_user", JSON.stringify(norm));
    // Synchronize to REST Backend Server so user is registered in memory and visible in search
    api.syncUser(norm).catch((err) => console.warn("Backend sync warning:", err));
    // Synchronize to Cloud Firestore so all players are visible across browsers and devices
    syncUserProfile(
      norm.id,
      norm.email,
      norm.username,
      norm.avatar_url,
      norm.player_id,
      {
        isa: norm.isa,
        gamesPlayed: norm.games_played,
        winRate: norm.win_rate,
        username: norm.username,
        status: "ONLINE",
      }
    ).catch((err) => console.warn("Firestore sync warning:", err));
  };

  // Process Google Sign-In Redirect Result on mount
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user && result.user.email) {
          const res = await api.loginWithGoogle({
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName || undefined,
            photoURL: result.user.photoURL || undefined,
          });
          if (res.user) {
            const norm = normalizeUser(res.user);
            applyUser(norm);
          }
        }
      })
      .catch((err) => {
        console.warn("Redirect result error:", err);
      });
  }, []);

  // Load user session on mount
  const refreshProfile = async () => {
    try {
      const me = await api.getMe();
      if (me) {
        const norm = normalizeUser(me);
        applyUser(norm);
      } else {
        // Fallback to local storage if offline
        const saved = localStorage.getItem("fanorona_custom_user");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setUser(parsed);
            applyUser(parsed);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    } catch {
      const saved = localStorage.getItem("fanorona_custom_user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser(parsed);
          applyUser(parsed);
        } catch {
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (usernameOrEmail: string, password?: string) => {
    const res = await api.login({
      username: usernameOrEmail.includes("@") ? undefined : usernameOrEmail,
      email: usernameOrEmail.includes("@") ? usernameOrEmail : undefined,
      password: password || "Fanorona2026!",
    });
    if (res.user) {
      const norm = normalizeUser(res.user);
      applyUser(norm);
    }
  };

  const register = async (username: string, email: string, password?: string, avatarUrl?: string) => {
    const res = await api.register({
      username,
      email,
      password: password || "Fanorona2026!",
      avatar_url: avatarUrl,
    });
    if (res.user) {
      const norm = normalizeUser(res.user);
      applyUser(norm);
    }
  };

  const signInWithUsername = async (username: string) => {
    // Quick login / register with username
    try {
      await login(username, "Fanorona2026!");
    } catch {
      await register(
        username,
        `${username.toLowerCase().replace(/[^a-z0-9]/g, "")}@fanorona.local`,
        "Fanorona2026!"
      );
    }
  };

  const signInWithGoogle = async () => {
    try {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        if (!firebaseUser || !firebaseUser.email) {
          throw new Error("Adresse email introuvable dans le compte Google.");
        }

        const res = await api.loginWithGoogle({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
        });

        if (res.user) {
          const norm = normalizeUser(res.user);
          applyUser(norm);
        }
      } catch (popupErr: any) {
        // If popup is blocked by third-party cookie/storage partitioning or browser security, fallback automatically to redirect
        if (
          popupErr?.code === "auth/popup-blocked" ||
          popupErr?.code === "auth/internal-error" ||
          popupErr?.message?.includes("partition")
        ) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupErr;
      }
    } catch (err: any) {
      console.error("[Google Sign-In Error]", err);
      if (err?.code === "auth/popup-closed-by-user") {
        throw new Error("Connexion annulée par l'utilisateur.");
      }
      if (err?.code === "auth/cancelled-popup-request") {
        return;
      }
      if (err?.code === "auth/unauthorized-domain" || err?.message?.includes("auth/unauthorized-domain")) {
        const currentDomain = window.location.hostname;
        throw new Error(
          `Domaine non autorisé dans Firebase Auth (${currentDomain}). Veuillez ajouter "${currentDomain}" dans la console Firebase -> Authentication -> Paramètres -> Domaines autorisés.`
        );
      }
      throw new Error(err?.message || "Impossible de se connecter avec Google. Veuillez réessayer.");
    }
  };

  const signInAsGuest = async () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const randomPid = Math.floor(100000 + Math.random() * 900000).toString();
    const guestUser: PlatformUser = {
      id: `gst_${Date.now()}_${randomSuffix}`,
      uid: `gst_${Date.now()}_${randomSuffix}`,
      username: `Invité_${randomSuffix}`,
      displayName: `Invité_${randomSuffix}`,
      email: `invite_${randomSuffix}@fanorona.local`,
      player_id: randomPid,
      isa: 100,
      games_played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      win_rate: 0,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=Invite_${randomSuffix}`,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=Invite_${randomSuffix}`,
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      status: "ONLINE",
    };
    const guestToken = `gst_token_${guestUser.id}`;
    localStorage.setItem("fanorona_jwt_token", guestToken);
    localStorage.setItem("fanorona_refresh_token", guestToken);
    localStorage.setItem("fanorona_custom_user", JSON.stringify(guestUser));
    setUser(guestUser);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Offline fallback
    }
    localStorage.removeItem("fanorona_jwt_token");
    localStorage.removeItem("fanorona_refresh_token");
    localStorage.removeItem("fanorona_custom_user");
    setUser(null);
  };

  const updateProfile = async (data: { username?: string; avatar_url?: string }) => {
    const updated = await api.updateProfile(data);
    const norm = normalizeUser(updated);
    setUser(norm);
    localStorage.setItem("fanorona_custom_user", JSON.stringify(norm));
  };

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
    try {
      const matchRecord: CloudGameRecord = {
        id: `match_${Date.now()}`,
        gameMode,
        winner,
        difficulty,
        turnNumber,
        capturedWhite,
        capturedBlack,
        speedMode,
        reason,
        createdAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem("fanorona_cloud_matches") || "[]");
      existing.unshift(matchRecord);
      localStorage.setItem("fanorona_cloud_matches", JSON.stringify(existing.slice(0, 50)));
    } catch (err) {
      console.warn("Could not record match locally:", err);
    }
  };

  const saveStatsToCloud = async (stats: GameStats, settings: GameSettings) => {
    localStorage.setItem("fanorona_user_stats", JSON.stringify(stats));
    localStorage.setItem("fanorona_game_settings", JSON.stringify(settings));
  };

  const fetchRecentCloudGames = async (): Promise<CloudGameRecord[]> => {
    try {
      const existing = JSON.parse(localStorage.getItem("fanorona_cloud_matches") || "[]");
      return existing;
    } catch {
      return [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthAvailable: true,
        login,
        register,
        signInWithGoogle,
        signInWithUsername,
        signInAsGuest,
        logout,
        refreshProfile,
        updateProfile,
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
