/**
 * @file useMultiplayer.ts
 * Hook for managing multiplayer features: friends, challenges, and live games.
 * 100% backed by the local authoritative server (Express + Socket.io).
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../services/api";
import { socketService } from "../services/socketService";
import {
  ChallengeInvitation,
  FriendshipRecord,
  MultiplayerGameSession,
  NotificationPayload,
} from "../game/types/multiplayerTypes";
import { GameState } from "../game/types/gameTypes";

export interface UseMultiplayerState {
  friends: FriendshipRecord[];
  pendingFriendRequests: FriendshipRecord[];
  pendingChallenges: ChallengeInvitation[];
  notifications: NotificationPayload[];
  currentGameSession: MultiplayerGameSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseMultiplayerActions {
  sendFriendRequest: (targetUserId: string, targetUserName: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  rejectFriendRequest: (friendshipId: string) => Promise<void>;
  challengeFriend: (
    friendId: string,
    friendName: string,
    friendPhoto: string,
    playerColor: "white" | "black" | "random",
    timeControl: number
  ) => Promise<string>;
  acceptChallenge: (challengeId: string) => Promise<string>;
  rejectChallenge: (challengeId: string, reason?: string) => Promise<void>;
  createLiveGame: (
    opponentId: string,
    opponentName: string,
    opponentPhoto: string,
    playerColor: "white" | "black",
    timeControl: number
  ) => Promise<string>;
  updateLiveGame: (
    gameId: string,
    gameState: GameState,
    currentPlayer: "white" | "black",
    status: string,
    winner?: string,
    timeRemaining?: { white: number; black: number }
  ) => Promise<void>;
  endLiveGame: (
    gameId: string,
    winner: "white" | "black" | "draw" | null,
    reason: string
  ) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshChallenges: () => Promise<void>;
}

export function useMultiplayer(
  userId: string | undefined
): [UseMultiplayerState, UseMultiplayerActions] {
  const [state, setState] = useState<UseMultiplayerState>({
    friends: [],
    pendingFriendRequests: [],
    pendingChallenges: [],
    notifications: [],
    currentGameSession: null,
    isLoading: false,
    error: null,
  });

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Refresh friends from local backend
  const refreshFriends = useCallback(async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.allSettled([
        api.getFriends(),
        api.getFriendRequests(),
      ]);

      const formattedFriends: FriendshipRecord[] = [];
      if (friendsRes.status === "fulfilled" && Array.isArray(friendsRes.value)) {
        friendsRes.value.forEach((item: any) => {
          formattedFriends.push({
            id: item.id || `fr_${item.friend?.id || Math.random()}`,
            userId: userId || "",
            friendId: item.friend?.id || item.friend?.player_id || "",
            status: "accepted",
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.created_at || new Date().toISOString(),
          });
        });
      }

      const formattedRequests: FriendshipRecord[] = [];
      if (requestsRes.status === "fulfilled" && Array.isArray(requestsRes.value)) {
        requestsRes.value.forEach((item: any) => {
          formattedRequests.push({
            id: item.id || `req_${item.from_user?.id || Math.random()}`,
            userId: item.from_user?.id || "",
            friendId: userId || "",
            status: "pending",
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.created_at || new Date().toISOString(),
          });
        });
      }

      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          friends: formattedFriends,
          pendingFriendRequests: formattedRequests,
          error: null,
        }));
      }
    } catch (err: any) {
      console.warn("Erreur chargement amis:", err);
    }
  }, [userId]);

  // Refresh challenges & notifications from local backend
  const refreshChallenges = useCallback(async () => {
    try {
      const notifsRes = await api.getNotifications().catch(() => []);
      if (Array.isArray(notifsRes)) {
        const challenges: ChallengeInvitation[] = [];
        const notifs: NotificationPayload[] = [];

        notifsRes.forEach((n: any) => {
          notifs.push({
            id: n.id,
            userId: userId || "",
            type: n.type === "game_invite" ? "challenge_received" : "friend_request",
            senderId: n.from_user?.id || "",
            senderName: n.from_user?.username || n.title || "Joueur",
            senderPhoto: n.from_user?.avatar_url || "",
            title: n.title || "Notification",
            message: n.message || "",
            actionId: n.data?.game_id || n.data?.invite_id,
            read: n.read || false,
            createdAt: n.created_at || new Date().toISOString(),
          });

          if (n.type === "game_invite" && !n.read) {
            challenges.push({
              id: n.id,
              challengerId: n.from_user?.id || "",
              challengerName: n.from_user?.username || "Ami",
              challengerPhoto: n.from_user?.avatar_url || "",
              challengedPlayerId: userId || "",
              status: "pending",
              playerColor: "random",
              timeControl: n.data?.time_control || 300,
              createdAt: n.created_at || new Date().toISOString(),
              expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
              gameId: n.data?.game_id,
            });
          }
        });

        if (isMountedRef.current) {
          setState((prev) => ({
            ...prev,
            pendingChallenges: challenges,
            notifications: notifs,
            error: null,
          }));
        }
      }
    } catch (err: any) {
      console.warn("Erreur chargement notifications:", err);
    }
  }, [userId]);

  // Listen to real-time socket events
  useEffect(() => {
    if (!userId) return;

    refreshFriends();
    refreshChallenges();

    const unsubNotif = socketService.onNotificationReceived(() => {
      refreshChallenges();
      refreshFriends();
    });

    const unsubInvite = socketService.onGameInvitationReceived(() => {
      refreshChallenges();
    });

    const unsubAccepted = socketService.onChallengeAccepted(({ game_id, opponent }) => {
      refreshChallenges();
      window.dispatchEvent(
        new CustomEvent("start-online-game", {
          detail: {
            gameId: game_id,
            color: "white",
            opponent,
            opponentName: opponent?.username || "Ami",
            opponentIsa: opponent?.isa || 1200,
          },
        })
      );
    });

    const unsubRejected = socketService.onChallengeRejected(() => {
      refreshChallenges();
    });

    return () => {
      unsubNotif?.();
      unsubInvite?.();
      unsubAccepted?.();
      unsubRejected?.();
    };
  }, [userId, refreshFriends, refreshChallenges]);

  // Send friend request
  const handleSendFriendRequest = async (targetUserId: string, targetUserName: string) => {
    try {
      await api.sendFriendRequest({ target_user_id: targetUserId });
      await refreshFriends();
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur envoi demande d'ami",
      }));
    }
  };

  // Accept friend request
  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      await api.acceptFriendRequest(friendshipId);
      await refreshFriends();
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur acceptation demande d'ami",
      }));
    }
  };

  // Reject friend request
  const handleRejectFriendRequest = async (friendshipId: string) => {
    try {
      await api.rejectFriendRequest(friendshipId);
      await refreshFriends();
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur refus demande d'ami",
      }));
    }
  };

  // Challenge a friend
  const handleChallengeFriend = async (
    friendId: string,
    friendName: string,
    friendPhoto: string,
    playerColor: "white" | "black" | "random",
    timeControl: number
  ): Promise<string> => {
    try {
      const res = await api.sendChallenge({
        target_user_id: friendId,
        game_type: "friendly",
        time_control: timeControl,
      });
      await refreshChallenges();
      return res.challenge_id || res.id || `ch_${Date.now()}`;
    } catch (error) {
      throw error;
    }
  };

  // Accept challenge
  const handleAcceptChallenge = async (challengeId: string): Promise<string> => {
    try {
      const res = await api.acceptChallenge(challengeId);
      const gameId = res.game?.id || res.game_id || `game_${Date.now()}`;
      await refreshChallenges();
      return gameId;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur acceptation du défi",
      }));
      throw error;
    }
  };

  // Reject challenge
  const handleRejectChallenge = async (challengeId: string, reason?: string) => {
    try {
      await api.rejectChallenge(challengeId);
      await refreshChallenges();
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur refus du défi",
      }));
    }
  };

  // Create live game
  const handleCreateLiveGame = async (
    opponentId: string,
    opponentName: string,
    opponentPhoto: string,
    playerColor: "white" | "black",
    timeControl: number
  ): Promise<string> => {
    try {
      const res = await api.createGame({
        game_type: "casual",
        time_control: timeControl,
        player_black_id: opponentId,
        player_color: playerColor,
      });
      return res.game?.id || `game_${Date.now()}`;
    } catch (error) {
      throw error;
    }
  };

  // Update live game (Authoritative local server handles moves via Socket.io)
  const handleUpdateLiveGame = async (
    gameId: string,
    gameState: GameState,
    currentPlayer: "white" | "black",
    status: string,
    winner?: string,
    timeRemaining?: { white: number; black: number }
  ) => {
    // No-op: Local server game state is synced authoritatively via socket make_move and end_turn
  };

  // End live game
  const handleEndLiveGame = async (
    gameId: string,
    winner: "white" | "black" | "draw" | null,
    reason: string
  ) => {
    // No-op: Local server game state handles game over via make_move, resign, or time-out
  };

  // Mark notification as read
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
        pendingChallenges: prev.pendingChallenges.filter((c) => c.id !== notificationId),
      }));
    } catch (error) {
      console.error("Erreur lecture notification:", error);
    }
  };

  return [
    state,
    {
      sendFriendRequest: handleSendFriendRequest,
      acceptFriendRequest: handleAcceptFriendRequest,
      rejectFriendRequest: handleRejectFriendRequest,
      challengeFriend: handleChallengeFriend,
      acceptChallenge: handleAcceptChallenge,
      rejectChallenge: handleRejectChallenge,
      createLiveGame: handleCreateLiveGame,
      updateLiveGame: handleUpdateLiveGame,
      endLiveGame: handleEndLiveGame,
      markNotificationAsRead: handleMarkNotificationAsRead,
      refreshFriends,
      refreshChallenges,
    },
  ];
}
