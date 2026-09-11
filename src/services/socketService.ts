/**
 * @file socketService.ts
 * Socket.io client service connecting frontend to the Fanorona Node.js backend.
 */

import { io, Socket } from "socket.io-client";
import { Move, Player } from "../game/types/gameTypes";

const rawSocketUrl =
  ((import.meta as any).env?.VITE_BACKEND_URL as string) ||
  ((import.meta as any).env?.VITE_API_URL as string) ||
  "";

const SOCKET_SERVER_URL = rawSocketUrl
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api\/?$/, "");

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_SERVER_URL, {
        transports: ["websocket", "polling"],
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        console.log("[SocketService] Connected to backend:", this.socket?.id);
      });

      this.socket.on("disconnect", () => {
        console.log("[SocketService] Disconnected from backend");
      });
    }
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public authenticate(token?: string | null, userId?: string) {
    const socket = this.connect();
    socket.emit("authenticate", { token, userId });
  }

  public onChallengeAccepted(callback: (data: { invite_id: string; game_id: string; opponent: any }) => void) {
    const socket = this.connect();
    socket.off("challenge_accepted");
    socket.on("challenge_accepted", callback);
  }

  public onChallengeRejected(callback: (data: { invite_id: string; opponent_name: string }) => void) {
    const socket = this.connect();
    socket.off("challenge_rejected");
    socket.on("challenge_rejected", callback);
  }

  public onGameInvitationReceived(callback: (data: any) => void) {
    const socket = this.connect();
    socket.off("game_invitation_received");
    socket.on("game_invitation_received", callback);
  }

  public onNotificationReceived(callback: (notif: any) => void) {
    const socket = this.connect();
    socket.off("notification_received");
    socket.on("notification_received", callback);
  }

  public createGame(playerId: string, playerName: string, playerColor: Player = "white", timeControl: number = 30) {
    const socket = this.connect();
    socket.emit("create_game", { playerId, playerName, playerColor, timeControl });
  }

  public joinGame(gameId: string, playerId: string, playerName: string) {
    const socket = this.connect();
    socket.emit("join_game", { gameId, playerId, playerName });
  }

  public joinGameRoom(gameId: string, user?: { id?: string; username?: string; isa?: number }) {
    const socket = this.connect();
    socket.emit("join_game_room", { gameId, user });
  }

  public onGameRoomState(callback: (game: any) => void) {
    const socket = this.connect();
    socket.off("game_room_state");
    socket.on("game_room_state", callback);
  }

  public onMoveMade(callback: (data: { move: Move; nextState: any; currentTurn: Player }) => void) {
    const socket = this.connect();
    socket.off("move_made");
    socket.on("move_made", callback);
  }

  public onTurnEnded(callback: (data: { nextState: any; currentTurn: Player }) => void) {
    const socket = this.connect();
    socket.off("turn_ended");
    socket.on("turn_ended", callback);
  }

  public onGameOver(callback: (data: { winner: Player | "draw"; reason?: string }) => void) {
    const socket = this.connect();
    socket.off("game_over");
    socket.on("game_over", callback);
  }

  public onUserPresenceChanged(callback: (data: { userId: string; status: "ONLINE" | "IN_GAME" | "OFFLINE" }) => void) {
    const socket = this.connect();
    socket.off("user_presence_changed");
    socket.on("user_presence_changed", callback);
  }

  public onLobbyUpdated(callback: () => void) {
    const socket = this.connect();
    socket.off("lobby_updated");
    socket.on("lobby_updated", callback);
  }

  public sendPresencePing(userId: string) {
    const socket = this.connect();
    socket.emit("presence_ping", { userId });
  }

  public makeMove(gameId: string, move: Move) {
    const socket = this.connect();
    socket.emit("make_move", { gameId, move });
  }

  public endTurn(gameId: string) {
    const socket = this.connect();
    socket.emit("end_turn", { gameId });
  }

  public resign(gameId: string, player: Player) {
    const socket = this.connect();
    socket.emit("resign", { gameId, player });
  }

  public sendMessage(gameId: string, senderName: string, text: string) {
    const socket = this.connect();
    socket.emit("send_message", { gameId, senderName, text });
  }

  public onGameUpdated(callback: (session: any) => void) {
    const socket = this.connect();
    socket.off("game_updated");
    socket.on("game_updated", callback);
  }

  public onGameCreated(callback: (data: { gameId: string; gameSession: any }) => void) {
    const socket = this.connect();
    socket.off("game_created");
    socket.on("game_created", callback);
  }

  public onChatMessage(callback: (msg: { id: string; senderName: string; text: string; timestamp: number }) => void) {
    const socket = this.connect();
    socket.off("chat_message");
    socket.on("chat_message", callback);
  }

  public async addServerFriend(userId: string, targetUserId: string) {
    const res = await fetch(`${SOCKET_SERVER_URL}/api/friends/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, targetUserId }),
    });
    if (!res.ok) throw new Error("Erreur d'ajout d'ami sur le serveur");
    return res.json();
  }

  public async getServerFriends(userId: string) {
    const res = await fetch(`${SOCKET_SERVER_URL}/api/friends/${userId}`);
    if (!res.ok) return [];
    return res.json();
  }
}

export const socketService = new SocketService();
if (typeof window !== "undefined") {
  (window as any).__fanorona_socket = socketService;
}
