/**
 * @file useMultiplayer.ts
 * Hook for managing multiplayer features: friends, challenges, and live games.
 */

import { useEffect, useState } from "react";
import {
  acceptChallenge,
  acceptFriendRequest,
  createChallenge,
  createGameSession,
  endGameSession,
  getFriends,
  getPendingChallenges,
  getPendingFriendRequests,
  rejectChallenge,
  rejectFriendRequest,
  sendFriendRequest,
  subscribeToGameSession,
  subscribeToNotifications,
  updateGameSession,
  getUserNotifications,
  markNotificationAsRead,
} from "../services/firebase/multiplayerService";
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

  // Subscribe to notifications and challenges in real-time
  useEffect(() => {
    if (!userId) return;

    const unsubNotifications = subscribeToNotifications(userId, (notifications) => {
      setState((prev) => ({ ...prev, notifications }));
    });

    return () => unsubNotifications();
  }, [userId]);

  // Refresh friends list
  const refreshFriends = async () => {
    if (!userId) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      let friends = (await getFriends(userId)) || [];
      let pendingRequests = (await getPendingFriendRequests(userId)) || [];

      // Fallback/merge with server friends for custom user IDs (usr_...)
      try {
        const serverFriends = await socketService.getServerFriends(userId);
        if (serverFriends && Array.isArray(serverFriends)) {
          const merged = [...friends];
          serverFriends.forEach((sf: any) => {
            const friendId = sf.userId === userId ? sf.friendId : sf.userId;
            if (!merged.some((f) => f.friendId === friendId)) {
              merged.push({
                id: sf.id,
                userId: sf.userId,
                friendId,
                status: sf.status,
                createdAt: sf.createdAt,
                updatedAt: sf.createdAt,
              });
            }
          });
          friends = merged;
        }
      } catch (e) {
        console.warn("Server friends fetch fallback:", e);
      }

      setState((prev) => ({
        ...prev,
        friends,
        pendingFriendRequests: pendingRequests,
        error: null,
      }));
    } catch (error) {
      console.warn("Could not refresh friends list:", error);
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Refresh challenges
  const refreshChallenges = async () => {
    if (!userId) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const challenges = (await getPendingChallenges(userId)) || [];
      setState((prev) => ({
        ...prev,
        pendingChallenges: challenges,
        error: null,
      }));
    } catch (error) {
      console.warn("Could not refresh challenges:", error);
      setState((prev) => ({ ...prev, pendingChallenges: [] }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Send friend request
  const handleSendFriendRequest = async (
    targetUserId: string,
    targetUserName: string
  ) => {
    if (!userId) return;
    try {
      // Always add to backend server first
      try {
        await socketService.addServerFriend(userId, targetUserId);
      } catch (serverErr) {
        console.warn("Backend friend add error:", serverErr);
      }

      // Try Firestore sync if authenticated
      if (!userId.startsWith("usr_")) {
        await sendFriendRequest(userId, targetUserId, targetUserName);
      }

      await refreshFriends();
    } catch (error) {
      console.warn("Friend request fallback applied:", error);
      // Local optimistic friend record
      const newFriend: FriendshipRecord = {
        id: `${userId}_${targetUserId}`,
        userId,
        friendId: targetUserId,
        status: "accepted",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        friends: [...prev.friends.filter((f) => f.friendId !== targetUserId), newFriend],
        error: null,
      }));
    }
  };

  // Accept friend request
  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      await acceptFriendRequest(friendshipId);
      await refreshFriends();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }));
    }
  };

  // Reject friend request
  const handleRejectFriendRequest = async (friendshipId: string) => {
    try {
      await rejectFriendRequest(friendshipId);
      await refreshFriends();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur inconnue",
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
    if (!userId) throw new Error("User not logged in");
    try {
      const challengeId = await createChallenge(
        userId,
        state.notifications[0]?.senderName || "Joueur",
        state.notifications[0]?.senderPhoto || "",
        friendId,
        playerColor,
        timeControl
      );
      await refreshChallenges();
      return challengeId;
    } catch (error) {
      throw error;
    }
  };

  // Accept challenge
  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      const challenge = state.pendingChallenges.find((c) => c.id === challengeId);
      if (!challenge) throw new Error("Challenge not found");

      if (!userId) throw new Error("User not logged in");

      // Create game session
      const playerColor = challenge.playerColor === "random"
        ? Math.random() > 0.5
          ? "white"
          : "black"
        : challenge.playerColor === "white"
          ? "black"
          : "white";

      const gameId = await createGameSession(
        challenge.playerColor === "white" || (challenge.playerColor === "random" && playerColor === "black")
          ? challenge.challengerId
          : userId,
        challenge.playerColor === "white" || (challenge.playerColor === "random" && playerColor === "black")
          ? userId
          : challenge.challengerId,
        challenge.challengerName,
        challenge.challengerName, // This should be the current user's name
        challenge.challengerPhoto,
        challenge.challengerPhoto, // This should be the current user's photo
        challenge.timeControl
      );

      await acceptChallenge(challengeId, gameId);
      await refreshChallenges();
      return gameId;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }));
      throw error;
    }
  };

  // Reject challenge
  const handleRejectChallenge = async (challengeId: string, reason?: string) => {
    try {
      await rejectChallenge(challengeId, reason);
      await refreshChallenges();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Erreur inconnue",
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
    if (!userId) throw new Error("User not logged in");
    try {
      const gameId = await createGameSession(
        playerColor === "white" ? userId : opponentId,
        playerColor === "white" ? opponentId : userId,
        playerColor === "white" ? "Vous" : opponentName,
        playerColor === "white" ? opponentName : "Vous",
        "",
        opponentPhoto,
        timeControl
      );
      return gameId;
    } catch (error) {
      throw error;
    }
  };

  // Update live game
  const handleUpdateLiveGame = async (
    gameId: string,
    gameState: GameState,
    currentPlayer: "white" | "black",
    status: string,
    winner?: string,
    timeRemaining?: { white: number; black: number }
  ) => {
    try {
      await updateGameSession(
        gameId,
        gameState,
        gameState.moveHistory,
        currentPlayer,
        status,
        winner,
        timeRemaining
      );
    } catch (error) {
      console.error("Error updating game session:", error);
    }
  };

  // End live game
  const handleEndLiveGame = async (
    gameId: string,
    winner: "white" | "black" | "draw" | null,
    reason: string
  ) => {
    try {
      await endGameSession(gameId, winner, reason);
    } catch (error) {
      console.error("Error ending game session:", error);
    }
  };

  // Mark notification as read
  const handleMarkNotificationAsRead = async (notificationId: string) => {
    if (!userId) return;
    try {
      await markNotificationAsRead(userId, notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
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
