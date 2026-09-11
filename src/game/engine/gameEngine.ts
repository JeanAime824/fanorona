/**
 * @file gameEngine.ts
 * Pure, immutable Fanorona game engine.
 * Fully decoupled from React, DOM, Tailwind, animations, and audio.
 * Receives a GameState, executes moves, and returns a new GameState.
 */

import { toAlgebraic } from "../board/boardGraph";
import { cloneBoard, countPieces, createInitialBoard } from "../board/initialBoard";
import { getLegalMoves } from "../moves/moveGenerator";
import { checkGameStatus } from "../rules/fanoronaRules";
import {
  AiDifficulty,
  CaptureSequence,
  GameMode,
  GameState,
  Move,
  MoveHistoryEntry,
  Player,
  Position,
} from "../types/gameTypes";

/**
 * Creates a fresh, authentic initial Fanorona game state.
 */
export function createInitialGame(
  gameMode: GameMode = "pvp",
  difficulty: AiDifficulty = "medium",
  aiPlayerColor: Player = "black",
  multiplayerGameId?: string
): GameState {
  const board = createInitialBoard();
  const initialPlayer: Player = "white";

  const state: GameState = {
    board,
    currentPlayer: initialPlayer,
    selectedPosition: null,
    legalMoves: [],
    captureSequence: null,
    moveHistory: [],
    capturedPieces: {
      white: 0,
      black: 0,
    },
    status: "playing",
    winner: null,
    gameMode,
    difficulty,
    turnNumber: 1,
    aiPlayerColor: gameMode === "ai" ? aiPlayerColor : undefined,
    multiplayerGameId,
    mandatoryCaptureActive: false,
  };

  state.legalMoves = getLegalMoves(state);
  state.mandatoryCaptureActive = state.legalMoves.some(
    (m) => m.captures && m.captures.length > 0
  );

  return state;
}

/**
 * Formats a move into human-readable Fanorona notation.
 * e.g. "E3 → E4 (Appr. 2p)" or "B2 → C3 (Éloign. 1p)" or "D2 → D3"
 */
export function formatMoveNotation(move: Move): string {
  const fromStr = toAlgebraic(move.from);
  const toStr = toAlgebraic(move.to);
  if (move.captures.length > 0) {
    const typeLabel = move.captureType === "approach" ? "Appr." : "Éloign.";
    return `${fromStr} → ${toStr} (${typeLabel} +${move.captures.length})`;
  }
  return `${fromStr} → ${toStr}`;
}

/**
 * Applies a move to the current GameState, returning a new immutable GameState.
 */
export function applyMove(state: GameState, move: Move): GameState {
  if (state.status !== "playing") {
    return state;
  }

  const board = cloneBoard(state.board);
  const movingPiece = board[move.from.row][move.from.col];

  if (!movingPiece || movingPiece.player !== state.currentPlayer) {
    throw new Error(
      `Invalid move: No piece belonging to ${state.currentPlayer} at (${move.from.row}, ${move.from.col})`
    );
  }

  // 1. Move piece
  board[move.to.row][move.to.col] = movingPiece;
  board[move.from.row][move.from.col] = null;

  // 2. Process captures
  const capturedPieces = { ...state.capturedPieces };
  const opponent: Player = state.currentPlayer === "white" ? "black" : "white";

  if (move.captures && move.captures.length > 0) {
    for (const capPos of move.captures) {
      board[capPos.row][capPos.col] = null;
    }
    capturedPieces[opponent] += move.captures.length;
  }

  // 3. Record move history entry
  const isSubsequent = state.captureSequence !== null;
  const historyEntry: MoveHistoryEntry = {
    id: `move-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    turnNumber: state.turnNumber,
    player: state.currentPlayer,
    from: move.from,
    to: move.to,
    captures: [...move.captures],
    captureType: move.captureType,
    notation: formatMoveNotation(move),
    timestamp: Date.now(),
    isSubsequentCapture: isSubsequent,
  };

  const newHistory = [...state.moveHistory, historyEntry];

  // 4. Handle turn flow and capture sequences
  let nextCaptureSequence: CaptureSequence | null = null;
  let nextPlayer: Player = state.currentPlayer;
  let nextTurnNumber: number = state.turnNumber;

  const wasCapture = move.captures.length > 0;
  const isMoveOne = state.turnNumber === 1 && state.currentPlayer === "white" && state.moveHistory.length === 0;

  if (wasCapture && !isMoveOne) {
    // Check if continuation captures are available for this piece
    const visitedPositions: Position[] = state.captureSequence
      ? [...state.captureSequence.visitedPositions, move.to]
      : [move.from, move.to];

    const tentativeSequence: CaptureSequence = {
      piecePosition: move.to,
      visitedPositions,
      lastDirection: move.direction,
      capturesCount: (state.captureSequence?.capturesCount || 0) + move.captures.length,
    };

    // Construct tentative state to test for continuation captures
    const tentativeState: GameState = {
      ...state,
      board,
      captureSequence: tentativeSequence,
      selectedPosition: move.to,
    };

    const nextLegalCaptures = getLegalMoves(tentativeState);

    if (nextLegalCaptures.length > 0) {
      // Continuation captures are available! Keep turn active with captureSequence
      nextCaptureSequence = tentativeSequence;
      nextPlayer = state.currentPlayer;
    } else {
      // No further captures possible: sequence automatically ends
      nextCaptureSequence = null;
      nextPlayer = opponent;
      if (nextPlayer === "white") {
        nextTurnNumber++;
      }
    }
  } else {
    // Normal paika move or move 1 single capture: turn ends
    nextCaptureSequence = null;
    nextPlayer = opponent;
    if (nextPlayer === "white") {
      nextTurnNumber++;
    }
  }

  // 5. Construct resulting state
  let nextState: GameState = {
    ...state,
    board,
    currentPlayer: nextPlayer,
    selectedPosition: nextCaptureSequence ? nextCaptureSequence.piecePosition : null,
    captureSequence: nextCaptureSequence,
    moveHistory: newHistory,
    capturedPieces,
    turnNumber: nextTurnNumber,
  };

  // 6. Check victory / terminal condition
  if (nextCaptureSequence) {
    const { white, black } = countPieces(board);
    if (white === 0 || black === 0) {
      const statusCheck = checkGameStatus(nextState);
      nextState.status = statusCheck.status;
      nextState.winner = statusCheck.winner;
      nextState.reason = statusCheck.reason;
    } else {
      nextState.status = "playing";
      nextState.winner = null;
      nextState.reason = undefined;
    }
  } else {
    const statusCheck = checkGameStatus(nextState);
    nextState.status = statusCheck.status;
    nextState.winner = statusCheck.winner;
    nextState.reason = statusCheck.reason;
  }

  // 7. Calculate new legal moves
  if (nextState.status === "game_over") {
    nextState.legalMoves = [];
    nextState.mandatoryCaptureActive = false;
  } else {
    nextState.legalMoves = getLegalMoves(nextState);
    nextState.mandatoryCaptureActive = nextState.legalMoves.some(
      (m) => m.captures && m.captures.length > 0
    );
  }

  return nextState;
}

/**
 * Voluntarily ends the current turn when inside a multiple capture sequence.
 * Players in Fanorona are allowed to stop capturing and pass their remaining turn.
 */
export function endTurn(state: GameState): GameState {
  if (state.status !== "playing" || !state.captureSequence) {
    return state;
  }

  const nextPlayer: Player = state.currentPlayer === "white" ? "black" : "white";
  const nextTurnNumber = nextPlayer === "white" ? state.turnNumber + 1 : state.turnNumber;

  let nextState: GameState = {
    ...state,
    currentPlayer: nextPlayer,
    selectedPosition: null,
    captureSequence: null,
    turnNumber: nextTurnNumber,
  };

  const statusCheck = checkGameStatus(nextState);
  nextState.status = statusCheck.status;
  nextState.winner = statusCheck.winner;
  nextState.reason = statusCheck.reason;

  if (nextState.status === "game_over") {
    nextState.legalMoves = [];
    nextState.mandatoryCaptureActive = false;
  } else {
    nextState.legalMoves = getLegalMoves(nextState);
    nextState.mandatoryCaptureActive = nextState.legalMoves.some(
      (m) => m.captures && m.captures.length > 0
    );
  }

  return nextState;
}

/**
 * Allows a player to resign (abandon) the match.
 */
export function resignGame(state: GameState, resigningPlayer: Player): GameState {
  const winner: Player = resigningPlayer === "white" ? "black" : "white";
  return {
    ...state,
    status: "game_over",
    winner,
    legalMoves: [],
    selectedPosition: null,
  };
}
