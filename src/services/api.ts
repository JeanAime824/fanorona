/**
 * @file api.ts
 * REST API client for Fanorona backend.
 * Handles JWT token injection, safe JSON parsing, automatic transient retry,
 * and graceful error normalization.
 */

import {
  UserProfile,
  UserSearchResult,
  RatingHistoryEntry,
  NotificationItem,
  UserStatistics,
} from "../game/types/userTypes";

const rawApiUrl =
  ((import.meta as any).env?.VITE_BACKEND_URL as string) ||
  ((import.meta as any).env?.VITE_API_URL as string) ||
  "";

// Strips trailing slashes and redundant /api suffixes if user configured it
const API_BASE_URL = rawApiUrl
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api\/?$/, "");

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("fanorona_jwt_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Safely parse JSON from a fetch Response.
 * Protects against `JSON.parse: unexpected character at line 1 column 1`
 * when servers return HTML (500, 404, or proxy warm-up errors).
 */
async function safeFetchJson<T = any>(
  res: Response,
  fallbackError = "Erreur de communication avec le serveur"
): Promise<T> {
  const text = await res.text();
  let json: any = null;

  if (text && text.trim().length > 0) {
    try {
      json = JSON.parse(text);
    } catch {
      // Received HTML or plain-text response (e.g. 404, 502, or error stack)
      if (res.status === 404) {
        throw new Error("Le serveur démarre ou l'URL est temporairement indisponible (404). Veuillez réessayer.");
      }
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error("Le serveur est en cours de préchauffage. Veuillez patienter un instant et réessayer.");
      }
      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status}) : Impossible de traiter la requête.`);
      }
      throw new Error("Réponse inattendue du serveur.");
    }
  } else {
    json = {};
  }

  if (!res.ok) {
    throw new Error(json?.error || json?.message || fallbackError);
  }

  return json as T;
}

/**
 * Executes a fetch request with automatic 1-second retry on transient reverse-proxy 404/502/503.
 */
async function resilientFetch(url: string, options?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok && (res.status === 404 || res.status === 502 || res.status === 503)) {
      // Wait 800ms and retry once in case server was restarting
      await new Promise((r) => setTimeout(r, 800));
      return await fetch(url, options);
    }
    return res;
  } catch {
    // Retry once on initial connection drop
    await new Promise((r) => setTimeout(r, 1000));
    return await fetch(url, options);
  }
}

function normalizeUserPayload(raw: any, fallbackName: string, fallbackEmail?: string): UserProfile {
  const u = raw.user || raw;
  const uid = u.id || u.uid || `usr_${Date.now()}`;
  const uname = u.username || u.displayName || fallbackName;
  const uemail = u.email || fallbackEmail || `${uname.toLowerCase().replace(/[^a-z0-9]/g, "")}@fanorona.local`;
  const pid =
    u.player_id || Math.floor(100000 + Math.random() * 900000).toString();
  const avatar = u.avatar_url || u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(uname)}`;

  return {
    id: uid,
    username: uname,
    email: uemail,
    player_id: pid,
    isa: typeof u.isa === "number" ? Math.max(100, u.isa) : 1200,
    games_played: typeof u.games_played === "number" ? u.games_played : 0,
    wins: typeof u.wins === "number" ? u.wins : 0,
    losses: typeof u.losses === "number" ? u.losses : 0,
    draws: typeof u.draws === "number" ? u.draws : 0,
    win_rate: typeof u.win_rate === "number" ? u.win_rate : 0,
    avatar_url: avatar,
    created_at: u.created_at || u.createdAt || new Date().toISOString(),
    last_activity: u.last_activity || new Date().toISOString(),
    status: u.status || "ONLINE",
  };
}

export const api = {
  // Auth
  async register(data: { username: string; email: string; password?: string; avatar_url?: string }) {
    let res: Response;
    try {
      res = await resilientFetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // If remote backend returns 404 on /register (e.g. Render server running older build), fallback gracefully to /login
      if (res.status === 404) {
        res = await resilientFetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: data.username,
            email: data.email,
            password: data.password,
            photoURL: data.avatar_url,
          }),
        });
      }
    } catch {
      throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion internet.");
    }

    const rawJson = await safeFetchJson<any>(res, "Échec de l'inscription");
    const normalizedUser = normalizeUserPayload(rawJson, data.username, data.email);
    const token = rawJson.token || `token_${normalizedUser.id}`;

    localStorage.setItem("fanorona_jwt_token", token);
    localStorage.setItem("fanorona_refresh_token", rawJson.refresh || token);

    return {
      message: rawJson.message || "Inscription réussie !",
      token,
      refresh: rawJson.refresh || token,
      user: normalizedUser,
    };
  },

  async login(data: { username?: string; email?: string; password?: string }) {
    let res: Response;
    try {
      res = await resilientFetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion.");
    }

    const rawJson = await safeFetchJson<any>(res, "Identifiants invalides");
    const normalizedUser = normalizeUserPayload(rawJson, data.username || "Joueur", data.email);
    const token = rawJson.token || `token_${normalizedUser.id}`;

    localStorage.setItem("fanorona_jwt_token", token);
    localStorage.setItem("fanorona_refresh_token", rawJson.refresh || token);

    return {
      message: rawJson.message || "Connexion réussie !",
      token,
      refresh: rawJson.refresh || token,
      user: normalizedUser,
    };
  },

  async logout() {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      return await safeFetchJson(res, "Erreur lors de la déconnexion");
    } catch {
      return { success: true };
    }
  },

  async getMe(): Promise<UserProfile | null> {
    const token = localStorage.getItem("fanorona_jwt_token");
    if (!token) return null;
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("fanorona_jwt_token");
        }
        return null;
      }
      return await safeFetchJson<UserProfile>(res);
    } catch {
      return null;
    }
  },

  async updateProfile(data: { username?: string; avatar_url?: string }): Promise<UserProfile> {
    const res = await resilientFetch(`${API_BASE_URL}/api/profile/me`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return safeFetchJson<UserProfile>(res, "Impossible de mettre à jour le profil");
  },

  // Users & Search
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      return await safeFetchJson<UserSearchResult[]>(res);
    } catch {
      return [];
    }
  },

  async getPublicProfile(playerId: string): Promise<UserSearchResult | null> {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/users/${encodeURIComponent(playerId)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      return await safeFetchJson<UserSearchResult>(res);
    } catch {
      return null;
    }
  },

  // Leaderboard
  async getLeaderboard(): Promise<(UserProfile & { rank: number })[]> {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/leaderboard`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      return await safeFetchJson<(UserProfile & { rank: number })[]>(res);
    } catch {
      return [];
    }
  },

  // Stats & Rating History
  async getStatistics(): Promise<UserStatistics | null> {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/statistics/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      return await safeFetchJson<UserStatistics>(res);
    } catch {
      return null;
    }
  },

  async getRatingHistory(): Promise<RatingHistoryEntry[]> {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/rating-history/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      return await safeFetchJson<RatingHistoryEntry[]>(res);
    } catch {
      return [];
    }
  },

  // Friends
  async getFriends(): Promise<{ id: string; friend: UserProfile; created_at: string }[]> {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/friends`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      return await safeFetchJson(res);
    } catch {
      return [];
    }
  },

  async getFriendRequests(): Promise<{
    received: { id: string; sender: UserProfile; created_at: string }[];
    sent: { id: string; receiver: UserProfile; created_at: string }[];
  }> {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/friends/requests`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return { received: [], sent: [] };
      return await safeFetchJson(res);
    } catch {
      return { received: [], sent: [] };
    }
  },

  async sendFriendRequest(params: { target_user_id?: string; player_id?: string }) {
    const res = await resilientFetch(`${API_BASE_URL}/api/friends/request`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return safeFetchJson(res, "Impossible d'envoyer la demande");
  },

  async acceptFriendRequest(requestId: string) {
    const res = await resilientFetch(`${API_BASE_URL}/api/friends/${requestId}/accept`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return safeFetchJson(res, "Impossible d'accepter");
  },

  async rejectFriendRequest(requestId: string) {
    const res = await resilientFetch(`${API_BASE_URL}/api/friends/${requestId}/reject`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return safeFetchJson(res, "Impossible de refuser");
  },

  async cancelFriendRequest(requestId: string) {
    const res = await resilientFetch(`${API_BASE_URL}/api/friends/${requestId}/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return safeFetchJson(res, "Impossible d'annuler");
  },

  async deleteFriend(friendshipOrUserId: string) {
    const res = await resilientFetch(`${API_BASE_URL}/api/friends/${friendshipOrUserId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return safeFetchJson(res, "Impossible de supprimer cet ami");
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/notifications`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      return await safeFetchJson<NotificationItem[]>(res);
    } catch {
      return [];
    }
  },

  async markNotificationAsRead(id: string) {
    const res = await resilientFetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return safeFetchJson(res);
  },

  async markAllNotificationsAsRead() {
    const res = await resilientFetch(`${API_BASE_URL}/api/notifications/read-all`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return safeFetchJson(res);
  },

  // Games
  async createGame(params: {
    game_type: "casual" | "ranked";
    time_control: number;
    player_color?: "white" | "black";
    player_name?: string;
  }) {
    const res = await resilientFetch(`${API_BASE_URL}/api/games`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return safeFetchJson(res, "Impossible de créer la partie");
  },

  async getGame(idOrCode: string) {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/games/${idOrCode}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      return await safeFetchJson(res);
    } catch {
      return null;
    }
  },

  async joinGame(idOrCode: string, playerName?: string) {
    const res = await resilientFetch(`${API_BASE_URL}/api/games/${idOrCode}/join`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ player_name: playerName }),
    });
    return safeFetchJson(res, "Impossible de rejoindre la partie");
  },

  async getGameMoves(idOrCode: string) {
    try {
      const res = await resilientFetch(`${API_BASE_URL}/api/games/${idOrCode}/moves`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return [];
      return await safeFetchJson(res);
    } catch {
      return [];
    }
  },

  async quickMatch(timeControl = 300) {
    const res = await resilientFetch(`${API_BASE_URL}/api/games/quick-match`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ time_control: timeControl }),
    });
    return safeFetchJson(res, "Impossible de rechercher une partie");
  },
};
