/**
 * @file gameTransport.ts
 * Prepares abstractions for future online multiplayer and remote transport
 * (WebSocket / WebRTC / Peer-to-peer / Server) without coupling the core engine.
 */

import { GameState, Move, Player } from "../types/gameTypes";

export interface GameTransportMessage {
  type: "move" | "end_turn" | "resign" | "sync_state" | "chat";
  payload: unknown;
  timestamp: number;
  sender: Player;
}

export interface GameTransport {
  /**
   * Connect to transport channel or room
   */
  connect(roomId: string, player: Player): Promise<boolean>;

  /**
   * Transmit a move to remote opponent
   */
  sendMove(move: Move): void;

  /**
   * Transmit voluntary turn end
   */
  sendEndTurn(): void;

  /**
   * Transmit resignation
   */
  sendResign(): void;

  /**
   * Register move receiver listener
   */
  onReceiveMove(handler: (move: Move) => void): void;

  /**
   * Register turn end listener
   */
  onReceiveEndTurn(handler: () => void): void;

  /**
   * Register state sync listener
   */
  onReceiveStateSync(handler: (state: GameState) => void): void;

  /**
   * Disconnect transport
   */
  disconnect(): void;
}

/**
 * Local loopback transport implementation for current offline single-device mode.
 */
export class LocalLoopbackTransport implements GameTransport {
  async connect(): Promise<boolean> {
    return true;
  }
  sendMove(): void {}
  sendEndTurn(): void {}
  sendResign(): void {}
  onReceiveMove(): void {}
  onReceiveEndTurn(): void {}
  onReceiveStateSync(): void {}
  disconnect(): void {}
}
