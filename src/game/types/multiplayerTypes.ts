/**
 * @file multiplayerTypes.ts
 * Types and interfaces for multiplayer features, friends, and challenges.
 */

export type ChallengeStatus = "pending" | "accepted" | "rejected" | "expired";
export type GameVisibility = "private" | "public";

export interface FanarionaUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  updatedAt: string;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    gamesDrawn: number;
    averageRating: number;
  };
  preferences?: {
    allowChallenges: boolean;
    allowFriendRequests: boolean;
  };
}

export interface FriendshipRecord {
  id: string;
  userId: string;
  friendId: string;
  status: "pending" | "accepted" | "blocked";
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeInvitation {
  id: string;
  challengerId: string;
  challengerName: string;
  challengerPhoto: string;
  challengedPlayerId: string;
  status: ChallengeStatus;
  playerColor?: "white" | "black" | "random";
  timeControl: number; // seconds
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  gameId?: string;
  reason?: string;
}

export interface MultiplayerGameSession {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string;
  whitePlayerName: string;
  blackPlayerName: string;
  whitePlayerPhoto: string;
  blackPlayerPhoto: string;
  status: "waiting" | "playing" | "game_over" | "abandoned";
  gameState: any; // Serialized GameState
  moveHistory: any[];
  currentPlayer: "white" | "black";
  winner: "white" | "black" | "draw" | null;
  visibility: GameVisibility;
  timeControl: number;
  whiteTimeRemaining?: number;
  blackTimeRemaining?: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  reason?: string; // "checkmate", "resignation", "timeout", "draw"
}

export interface OnlinePlayerStatus {
  userId: string;
  displayName: string;
  photoURL: string;
  isOnline: boolean;
  lastSeen: string;
  currentActivity?: "playing" | "idle";
}

export interface NotificationPayload {
  id: string;
  userId: string;
  type: "challenge_received" | "challenge_accepted" | "challenge_rejected" | "game_started" | "game_ended" | "friend_request" | "friend_accepted";
  senderId: string;
  senderName: string;
  senderPhoto: string;
  title: string;
  message: string;
  actionId?: string; // challengeId or friendshipId
  read: boolean;
  createdAt: string;
}
