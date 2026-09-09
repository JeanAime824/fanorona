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

  public createGame(playerId: string, playerName: string, playerColor: Player = "white", timeControl: number = 30) {
    const socket = this.connect();
    socket.emit("create_game", { playerId, playerName, playerColor, timeControl });
  }

  public joinGame(gameId: string, playerId: string, playerName: string) {
    const socket = this.connect();
    socket.emit("join_game", { gameId, playerId, playerName });
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
