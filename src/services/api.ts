/**
 * @file api.ts
 * REST API client for Fanorona backend.
 * Handles JWT token injection, auto-refresh, and error normalization.
 */

import {
  UserProfile,
  UserSearchResult,
  RatingHistoryEntry,
  NotificationItem,
  FriendRequestItem,
  FriendshipItem,
  UserStatistics,
} from "../game/types/userTypes";

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || "").replace(/\/$/, "");

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

export const api = {
  // Auth
  async register(data: { username: string; email: string; password?: string; avatar_url?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Échec de l'inscription");
    if (json.token) {
      localStorage.setItem("fanorona_jwt_token", json.token);
      localStorage.setItem("fanorona_refresh_token", json.refresh || json.token);
    }
    return json;
  },

  async login(data: { username?: string; email?: string; password?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Identifiants invalides");
    if (json.token) {
      localStorage.setItem("fanorona_jwt_token", json.token);
      localStorage.setItem("fanorona_refresh_token", json.refresh || json.token);
    }
    return json;
  },

  async logout() {
    const res = await fetch(`${API_BASE_URL}/api/auth/logout/`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getMe(): Promise<UserProfile | null> {
    const token = localStorage.getItem("fanorona_jwt_token");
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/api/auth/me/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("fanorona_jwt_token");
      }
      return null;
    }
    return res.json();
  },

  async updateProfile(data: { username?: string; avatar_url?: string }): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/api/profile/me/`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Impossible de mettre à jour le profil");
    return json;
  },

  // Users & Search
  async searchUsers(query: string): Promise<UserSearchResult[]> {
    const res = await fetch(`${API_BASE_URL}/api/users/search/?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getPublicProfile(playerId: string): Promise<UserSearchResult | null> {
    const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(playerId)}/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },

  // Leaderboard
  async getLeaderboard(): Promise<(UserProfile & { rank: number })[]> {
    const res = await fetch(`${API_BASE_URL}/api/leaderboard/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  // Stats & Rating History
  async getStatistics(): Promise<UserStatistics | null> {
    const res = await fetch(`${API_BASE_URL}/api/statistics/me/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async getRatingHistory(): Promise<RatingHistoryEntry[]> {
    const res = await fetch(`${API_BASE_URL}/api/rating-history/me/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  // Friends
  async getFriends(): Promise<{ id: string; friend: UserProfile; created_at: string }[]> {
    const res = await fetch(`${API_BASE_URL}/api/friends/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getFriendRequests(): Promise<{
    received: { id: string; sender: UserProfile; created_at: string }[];
    sent: { id: string; receiver: UserProfile; created_at: string }[];
  }> {
    const res = await fetch(`${API_BASE_URL}/api/friends/requests/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { received: [], sent: [] };
    return res.json();
  },

  async sendFriendRequest(params: { target_user_id?: string; player_id?: string }) {
    const res = await fetch(`${API_BASE_URL}/api/friends/request/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Impossible d'envoyer la demande");
    return json;
  },

  async acceptFriendRequest(requestId: string) {
    const res = await fetch(`${API_BASE_URL}/api/friends/${requestId}/accept/`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Impossible d'accepter");
    return json;
  },

  async rejectFriendRequest(requestId: string) {
    const res = await fetch(`${API_BASE_URL}/api/friends/${requestId}/reject/`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async cancelFriendRequest(requestId: string) {
    const res = await fetch(`${API_BASE_URL}/api/friends/${requestId}/cancel/`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async deleteFriend(friendshipOrUserId: string) {
    const res = await fetch(`${API_BASE_URL}/api/friends/${friendshipOrUserId}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE_URL}/api/notifications/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async markNotificationAsRead(id: string) {
    const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read/`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async markAllNotificationsAsRead() {
    const res = await fetch(`${API_BASE_URL}/api/notifications/read-all/`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Games
  async createGame(params: {
    game_type: "casual" | "ranked";
    time_control: number;
    player_color?: "white" | "black";
    player_name?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/api/games/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Impossible de créer la partie");
    return json;
  },

  async getGame(idOrCode: string) {
    const res = await fetch(`${API_BASE_URL}/api/games/${idOrCode}/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async joinGame(idOrCode: string, playerName?: string) {
    const res = await fetch(`${API_BASE_URL}/api/games/${idOrCode}/join/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ player_name: playerName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Impossible de rejoindre la partie");
    return json;
  },

  async getGameMoves(idOrCode: string) {
    const res = await fetch(`${API_BASE_URL}/api/games/${idOrCode}/moves/`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },
};
