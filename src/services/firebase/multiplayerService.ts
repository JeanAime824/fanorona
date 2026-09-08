/**
 * @file multiplayerService.ts
 * Firestore service for multiplayer features: friends, challenges, and live game sync.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "./firebase";
import {
  ChallengeInvitation,
  MultiplayerGameSession,
  FriendshipRecord,
  NotificationPayload,
  FanarionaUser,
} from "../../game/types/multiplayerTypes";

/**
 * FRIENDS MANAGEMENT
 */

/**
 * Send a friend request to another player
 */
export async function sendFriendRequest(
  userId: string,
  targetUserId: string,
  targetUserName: string
): Promise<void> {
  const friendshipId = `${userId}_${targetUserId}`;
  const path = `friendships/${friendshipId}`;

  try {
    await setDoc(doc(db, path), {
      id: friendshipId,
      userId,
      friendId: targetUserId,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create notification
    await createNotification(
      targetUserId,
      "friend_request",
      userId,
      targetUserName,
      "",
      "Demande d'ami",
      `${targetUserName} vous a envoyé une demande d'ami`,
      friendshipId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(
  friendshipId: string
): Promise<void> {
  const path = `friendships/${friendshipId}`;

  try {
    await updateDoc(doc(db, path), {
      status: "accepted",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(
  friendshipId: string
): Promise<void> {
  const path = `friendships/${friendshipId}`;

  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Get list of friends (accepted friendships)
 */
export async function getFriends(userId: string): Promise<FriendshipRecord[]> {
  const path = "friendships";

  try {
    const q = query(
      collection(db, path),
      where("userId", "==", userId),
      where("status", "==", "accepted")
    );
    const snapshot = await getDocs(q);
    const friends: FriendshipRecord[] = [];
    snapshot.forEach((d) => {
      friends.push(d.data() as FriendshipRecord);
    });
    return friends;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingFriendRequests(
  userId: string
): Promise<FriendshipRecord[]> {
  const path = "friendships";

  try {
    const q = query(
      collection(db, path),
      where("friendId", "==", userId),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    const requests: FriendshipRecord[] = [];
    snapshot.forEach((d) => {
      requests.push(d.data() as FriendshipRecord);
    });
    return requests;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * CHALLENGES & INVITATIONS
 */

/**
 * Create a challenge invitation
 */
export async function createChallenge(
  challengerId: string,
  challengerName: string,
  challengerPhoto: string,
  targetPlayerId: string,
  playerColor: "white" | "black" | "random",
  timeControl: number
): Promise<string> {
  const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `challenges/${challengeId}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    await setDoc(doc(db, path), {
      id: challengeId,
      challengerId,
      challengerName,
      challengerPhoto,
      challengedPlayerId: targetPlayerId,
      status: "pending",
      playerColor,
      timeControl,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    // Create notification
    await createNotification(
      targetPlayerId,
      "challenge_received",
      challengerId,
      challengerName,
      challengerPhoto,
      "Défi de partie",
      `${challengerName} vous défie au Fanorona!`,
      challengeId
    );

    return challengeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Accept a challenge invitation
 */
export async function acceptChallenge(
  challengeId: string,
  gameId: string
): Promise<void> {
  const path = `challenges/${challengeId}`;

  try {
    await updateDoc(doc(db, path), {
      status: "accepted",
      acceptedAt: new Date().toISOString(),
      gameId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Reject a challenge
 */
export async function rejectChallenge(
  challengeId: string,
  reason?: string
): Promise<void> {
  const path = `challenges/${challengeId}`;

  try {
    await updateDoc(doc(db, path), {
      status: "rejected",
      reason: reason || "",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Get pending challenges for a player
 */
export async function getPendingChallenges(
  userId: string
): Promise<ChallengeInvitation[]> {
  const path = "challenges";

  try {
    const q = query(
      collection(db, path),
      where("challengedPlayerId", "==", userId),
      where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    const challenges: ChallengeInvitation[] = [];
    snapshot.forEach((d) => {
      challenges.push(d.data() as ChallengeInvitation);
    });
    return challenges;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * MULTIPLAYER GAME SESSIONS
 */

/**
 * Create a new multiplayer game session
 */
export async function createGameSession(
  whitePlayerId: string,
  blackPlayerId: string,
  whitePlayerName: string,
  blackPlayerName: string,
  whitePlayerPhoto: string,
  blackPlayerPhoto: string,
  timeControl: number,
  visibility: "private" | "public" = "private"
): Promise<string> {
  const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `games/${gameId}`;

  try {
    await setDoc(doc(db, path), {
      id: gameId,
      whitePlayerId,
      blackPlayerId,
      whitePlayerName,
      blackPlayerName,
      whitePlayerPhoto,
      blackPlayerPhoto,
      status: "waiting",
      currentPlayer: "white",
      winner: null,
      visibility,
      timeControl,
      whiteTimeRemaining: timeControl * 60, // convert to seconds
      blackTimeRemaining: timeControl * 60,
      gameState: null,
      moveHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return gameId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update game state in Firestore (real-time sync)
 */
export async function updateGameSession(
  gameId: string,
  gameState: any,
  moveHistory: any[],
  currentPlayer: "white" | "black",
  status: string,
  winner?: string,
  timeRemaining?: { white: number; black: number }
): Promise<void> {
  const path = `games/${gameId}`;

  try {
    await updateDoc(doc(db, path), {
      gameState,
      moveHistory,
      currentPlayer,
      status,
      winner: winner || null,
      whiteTimeRemaining: timeRemaining?.white || undefined,
      blackTimeRemaining: timeRemaining?.black || undefined,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Subscribe to real-time game updates
 */
export function subscribeToGameSession(
  gameId: string,
  callback: (session: MultiplayerGameSession | null) => void
): () => void {
  const path = `games/${gameId}`;

  try {
    const unsubscribe = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as MultiplayerGameSession);
      } else {
        callback(null);
      }
    });
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * End a game session
 */
export async function endGameSession(
  gameId: string,
  winner: "white" | "black" | "draw" | null,
  reason: string
): Promise<void> {
  const path = `games/${gameId}`;

  try {
    await updateDoc(doc(db, path), {
      status: "game_over",
      winner,
      reason,
      endedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * NOTIFICATIONS
 */

/**
 * Create a notification
 */
async function createNotification(
  userId: string,
  type: string,
  senderId: string,
  senderName: string,
  senderPhoto: string,
  title: string,
  message: string,
  actionId?: string
): Promise<void> {
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `users/${userId}/notifications/${notificationId}`;

  try {
    await setDoc(doc(db, path), {
      id: notificationId,
      userId,
      type,
      senderId,
      senderName,
      senderPhoto,
      title,
      message,
      actionId: actionId || "",
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn("Could not create notification:", error);
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string
): Promise<NotificationPayload[]> {
  const path = `users/${userId}/notifications`;

  try {
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const notifications: NotificationPayload[] = [];
    snapshot.forEach((d) => {
      notifications.push(d.data() as NotificationPayload);
    });
    return notifications;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Subscribe to notifications in real-time
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: NotificationPayload[]) => void
): () => void {
  const path = `users/${userId}/notifications`;

  try {
    const q = query(collection(db, path), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications: NotificationPayload[] = [];
      snapshot.forEach((d) => {
        notifications.push(d.data() as NotificationPayload);
      });
      callback(notifications);
    });
    return unsubscribe;
  } catch (error) {
    console.warn("Could not subscribe to notifications:", error);
    return () => {};
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<void> {
  const path = `users/${userId}/notifications/${notificationId}`;

  try {
    await updateDoc(doc(db, path), {
      read: true,
    });
  } catch (error) {
    console.warn("Could not mark notification as read:", error);
  }
}
