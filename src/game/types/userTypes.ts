/**
 * @file userTypes.ts
 * Type declarations for Users, Isa ratings, Friendships, and Notifications.
 */

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  player_id: string; // Exactly 6 digits (e.g. "849201")
  isa: number; // Initial 1200 Isa rating
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  last_activity?: string;
  status?: "ONLINE" | "IN_GAME" | "OFFLINE";
}

export type RelationStatus = "none" | "pending_sent" | "pending_received" | "friends";

export interface UserSearchResult extends UserProfile {
  relation_status: RelationStatus;
  friend_request_id?: string;
}

export interface RatingHistoryEntry {
  id: string;
  game_id?: string;
  opponent_name?: string;
  old_rating: number;
  new_rating: number;
  rating_change: number;
  reason: string;
  created_at: string;
}

export type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "GAME_INVITATION"
  | "GAME_STARTED"
  | "GAME_FINISHED"
  | "YOUR_TURN"
  | "RATING_CHANGED"
  | "SYSTEM";

export interface NotificationItem {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface FriendRequestItem {
  id: string;
  sender: UserProfile;
  receiver: UserProfile;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  updated_at?: string;
}

export interface ChallengeItem {
  id: string;
  sender_id: string;
  sender: UserProfile;
  receiver_id: string;
  receiver: UserProfile;
  time_control: number; // in seconds (60, 180, 300, 600, etc.)
  game_type: "ranked" | "casual";
  player_color: "white" | "black" | "random";
  game_id: string;
  game_code: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
  created_at: string;
  updated_at?: string;
}

export interface FriendshipItem {
  id: string;
  user: UserProfile;
  friend: UserProfile;
  status: "ONLINE" | "IN_GAME" | "OFFLINE";
  created_at: string;
}

export interface UserStatistics {
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  current_isa: number;
}
