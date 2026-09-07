import { describe, expect, it } from "vitest";
import { BOARD_COLS, BOARD_ROWS } from "../src/game/board/boardGraph";
import { createPiece } from "../src/game/board/initialBoard";
import { applyMove, endTurn } from "../src/game/engine/gameEngine";
import { getLegalMoves } from "../src/game/moves/moveGenerator";
import { GameState, Move, Piece } from "../src/game/types/gameTypes";

function createEmptyBoard(): (Piece | null)[][] {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  );
}

describe("Multiple Capture Chains & Direction / Revisited Rules", () => {
  it("should enter capture sequence when further captures exist", () => {
    const board = createEmptyBoard();
    // White at (2, 2)
    // Black at (2, 4): can be approached by moving (2,2) -> (2,3)
    // Black at (0, 3): can then be captured by moving (2,3) -> (1,3)
    board[2][2] = createPiece("white", "w1");
    board[2][4] = createPiece("black", "b1");
    board[0][3] = createPiece("black", "b2");

    let state: GameState = {
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
      turnNumber: 2, // Non-first turn to allow chain
      mandatoryCaptureActive: true,
    };

    const firstMove: Move = {
      from: { row: 2, col: 2 },
      to: { row: 2, col: 3 },
      captures: [{ row: 2, col: 4 }],
      captureType: "approach",
      direction: { row: 0, col: 1 },
    };

    state = applyMove(state, firstMove);

    // Turn should still be White because another capture is possible!
    expect(state.currentPlayer).toBe("white");
    expect(state.captureSequence).not.toBeNull();
    expect(state.captureSequence?.piecePosition).toEqual({ row: 2, col: 3 });
    expect(state.capturedPieces.black).toBe(1);

    // Legal moves in capture sequence should only be continuation captures from (2, 3)
    const nextMoves = getLegalMoves(state);
    expect(nextMoves.length).toBeGreaterThan(0);
    expect(nextMoves[0].from).toEqual({ row: 2, col: 3 });

    // The move should be approach towards (0, 3) by moving to (1, 3)
    const secondMove = nextMoves.find(
      (m) => m.to.row === 1 && m.to.col === 3
    );
    expect(secondMove).toBeDefined();

    // Execute second capture
    state = applyMove(state, secondMove!);
    expect(state.capturedPieces.black).toBe(2);
  });

  it("should forbid moving in the exact same direction during a capture chain", () => {
    const board = createEmptyBoard();
    // White at (2, 0)
    // Black at (2, 2) (approached by moving 2,0 -> 2,1)
    // Black at (2, 4) (in same direction East)
    // Black at (0, 1) (capturable by moving North 2,1 -> 1,1)
    board[2][0] = createPiece("white", "w1");
    board[2][2] = createPiece("black", "b1");
    board[2][4] = createPiece("black", "b2");
    board[0][1] = createPiece("black", "b3");

    let state: GameState = {
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
      mandatoryCaptureActive: true,
    };

    // First move: White moves (2,0) -> (2,1) approaching (2,2)
    const move1: Move = {
      from: { row: 2, col: 0 },
      to: { row: 2, col: 1 },
      captures: [{ row: 2, col: 2 }],
      captureType: "approach",
      direction: { row: 0, col: 1 }, // East
    };

    state = applyMove(state, move1);

    // Sequence should be active because moving North to (1,1) approaches Black at (0,1)
    expect(state.captureSequence).not.toBeNull();
    expect(state.currentPlayer).toBe("white");

    // In continuation moves, moving East again (2,1) -> (2,2) is forbidden by the "different direction" rule!
    const continuationMoves = getLegalMoves(state);
    const sameDirectionMove = continuationMoves.find(
      (m) => m.direction.row === 0 && m.direction.col === 1
    );
    expect(sameDirectionMove).toBeUndefined();

    // But the North move should be valid!
    const northMove = continuationMoves.find(
      (m) => m.direction.row === -1 && m.direction.col === 0
    );
    expect(northMove).toBeDefined();
  });

  it("should allow voluntary turn end (endTurn) during capture chain", () => {
    const board = createEmptyBoard();
    board[2][2] = createPiece("white", "w1");
    board[2][4] = createPiece("black", "b1");
    board[0][3] = createPiece("black", "b2");

    let state: GameState = {
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
      turnNumber: 2,
      mandatoryCaptureActive: true,
    };

    const firstMove: Move = {
      from: { row: 2, col: 2 },
      to: { row: 2, col: 3 },
      captures: [{ row: 2, col: 4 }],
      captureType: "approach",
      direction: { row: 0, col: 1 },
    };

    state = applyMove(state, firstMove);
    expect(state.captureSequence).not.toBeNull();

    // Player voluntarily ends turn
    state = endTurn(state);
    expect(state.captureSequence).toBeNull();
    expect(state.currentPlayer).toBe("black");
  });
});
