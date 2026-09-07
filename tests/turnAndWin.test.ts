import { describe, expect, it } from "vitest";
import { BOARD_COLS, BOARD_ROWS } from "../src/game/board/boardGraph";
import { createPiece } from "../src/game/board/initialBoard";
import { applyMove, resignGame } from "../src/game/engine/gameEngine";
import { checkGameStatus } from "../src/game/rules/fanoronaRules";
import { GameState, Move, Piece } from "../src/game/types/gameTypes";

function createEmptyBoard(): (Piece | null)[][] {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  );
}

describe("Turn Flow, Victory Conditions & Resignation", () => {
  it("should switch player on regular paika move", () => {
    const board = createEmptyBoard();
    // Isolated White piece at (2, 2)
    board[2][2] = createPiece("white", "w1");
    // Isolated Black piece at (0, 0)
    board[0][0] = createPiece("black", "b1");

    const state: GameState = {
      board,
      currentPlayer: "white",
      selectedPosition: null,
      legalMoves: [],
      captureSequence: null,
      moveHistory: [],
      capturedPieces: { white: 0, black: 0 },
      status: "playing",
      winner: null,
      gameMode: "pvp",
      difficulty: "medium",
      turnNumber: 1,
      mandatoryCaptureActive: false,
    };

    const paikaMove: Move = {
      from: { row: 2, col: 2 },
      to: { row: 2, col: 3 },
      captures: [],
      direction: { row: 0, col: 1 },
    };

    const nextState = applyMove(state, paikaMove);
    expect(nextState.currentPlayer).toBe("black");
  });

  it("should declare winner when opponent has 0 pieces remaining", () => {
    const board = createEmptyBoard();
    board[2][2] = createPiece("white", "w1");
    // No black pieces on board
    const state: GameState = {
      board,
      currentPlayer: "black",
      selectedPosition: null,
      legalMoves: [],
      captureSequence: null,
      moveHistory: [],
      capturedPieces: { white: 0, black: 22 },
      status: "playing",
      winner: null,
      gameMode: "pvp",
      difficulty: "medium",
      turnNumber: 15,
      mandatoryCaptureActive: false,
    };

    const result = checkGameStatus(state);
    expect(result.status).toBe("game_over");
    expect(result.winner).toBe("white");
  });

  it("should declare winner when active player is completely blocked (no legal moves)", () => {
    const board = createEmptyBoard();
    // Corner (0, 0) White surrounded by Blacks at (0, 1), (1, 0), (1, 1)
    board[0][0] = createPiece("white", "w1");
    board[0][1] = createPiece("black", "b1");
    board[1][0] = createPiece("black", "b2");
    board[1][1] = createPiece("black", "b3");

    const state: GameState = {
      board,
      currentPlayer: "white",
      selectedPosition: null,
      legalMoves: [],
      captureSequence: null,
      moveHistory: [],
      capturedPieces: { white: 0, black: 0 },
      status: "playing",
      winner: null,
      gameMode: "pvp",
      difficulty: "medium",
      turnNumber: 5,
      mandatoryCaptureActive: false,
    };

    const result = checkGameStatus(state);
    expect(result.status).toBe("game_over");
    expect(result.winner).toBe("black");
  });

  it("should handle voluntary resignation", () => {
    const board = createEmptyBoard();
    board[2][2] = createPiece("white", "w1");
    board[2][4] = createPiece("black", "b1");

    const state: GameState = {
      board,
      currentPlayer: "white",
      selectedPosition: null,
      legalMoves: [],
      captureSequence: null,
      moveHistory: [],
      capturedPieces: { white: 0, black: 0 },
      status: "playing",
      winner: null,
      gameMode: "pvp",
      difficulty: "medium",
      turnNumber: 3,
      mandatoryCaptureActive: false,
    };

    const resignedState = resignGame(state, "white");
    expect(resignedState.status).toBe("game_over");
    expect(resignedState.winner).toBe("black");
  });
});
