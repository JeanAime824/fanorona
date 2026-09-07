/**
 * @file gameTypes.ts
 * Core types and data models for Fanorona (Fanoron-tsivy).
 * Completely independent of React and DOM.
 */

export type Player = "white" | "black";

export interface Position {
  row: number; // 0 to 4
  col: number; // 0 to 8
}

export interface Piece {
  id: string;
  player: Player;
}

export type CaptureType = "approach" | "withdrawal";

export interface Direction {
  row: -1 | 0 | 1;
  col: -1 | 0 | 1;
}

export interface Move {
  from: Position;
  to: Position;
  captures: Position[];
  captureType?: CaptureType;
  direction: Direction;
}

export interface CaptureSequence {
  /** The current position of the piece performing consecutive captures */
  piecePosition: Position;
  /** Positions the piece has already visited in this turn */
  visitedPositions: Position[];
  /** Direction of the immediately preceding step (moving in this same direction is forbidden) */
  lastDirection?: Direction;
  /** Total captures made in this chain so far */
  capturesCount: number;
}

export type GameStatus = "playing" | "game_over" | "draw";

export type GameWinner = Player | "draw" | null;

export type GameMode = "pvp" | "ai";

export type AiDifficulty = "easy" | "medium" | "hard";

export interface MoveHistoryEntry {
  id: string;
  turnNumber: number;
  player: Player;
  from: Position;
  to: Position;
  captures: Position[];
  captureType?: CaptureType;
  notation: string;
  timestamp: number;
  isSubsequentCapture?: boolean;
}

export interface GameState {
  board: (Piece | null)[][]; // 5 rows x 9 cols
  currentPlayer: Player;
  selectedPosition: Position | null;
  legalMoves: Move[];
  captureSequence: CaptureSequence | null;
  moveHistory: MoveHistoryEntry[];
  capturedPieces: {
    white: number; // white pieces captured (taken by black)
    black: number; // black pieces captured (taken by white)
  };
  status: GameStatus;
  winner: GameWinner;
  gameMode: GameMode;
  difficulty: AiDifficulty;
  turnNumber: number;
  aiPlayerColor?: Player;
  mandatoryCaptureActive: boolean;
}

export type BoardTheme =
  | "modern_minimal"
  | "luxury_wood"
  | "zen_bamboo"
  | "malagasy_wood"
  | "slate_contemporary";

export interface GameSettings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  showPossibleMoves: boolean;
  aiDifficulty: AiDifficulty;
  confirmNewGame: boolean;
  theme: BoardTheme;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  aiWins: Record<AiDifficulty, number>;
  totalCaptures: number;
}
