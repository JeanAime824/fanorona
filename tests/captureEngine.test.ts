import { describe, expect, it } from "vitest";
import { BOARD_COLS, BOARD_ROWS } from "../src/game/board/boardGraph";
import { createPiece } from "../src/game/board/initialBoard";
import { getApproachCapture, getWithdrawalCapture } from "../src/game/capture/captureEngine";
import { Piece } from "../src/game/types/gameTypes";

function createEmptyBoard(): (Piece | null)[][] {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  );
}

describe("Capture Engine - Approach & Withdrawal", () => {
  it("should capture an enemy piece by Approach (tomboky)", () => {
    const board = createEmptyBoard();
    // White at (2, 2) moves to (2, 3) towards Black at (2, 4)
    board[2][2] = createPiece("white", "w1");
    board[2][4] = createPiece("black", "b1");

    const captures = getApproachCapture(
      board,
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      "white"
    );

    expect(captures).toEqual([{ row: 2, col: 4 }]);
  });

  it("should capture an unbroken line of multiple enemy pieces by Approach", () => {
    const board = createEmptyBoard();
    // White at (2, 1) moves to (2, 2) towards Blacks at (2, 3), (2, 4), (2, 5)
    board[2][1] = createPiece("white", "w1");
    board[2][3] = createPiece("black", "b1");
    board[2][4] = createPiece("black", "b2");
    board[2][5] = createPiece("black", "b3");

    const captures = getApproachCapture(
      board,
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      "white"
    );

    expect(captures).toHaveLength(3);
    expect(captures).toEqual([
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ]);
  });

  it("should capture an enemy piece by Withdrawal (faly)", () => {
    const board = createEmptyBoard();
    // Black at (2, 2). White at (2, 3) moves away to (2, 4).
    board[2][2] = createPiece("black", "b1");
    board[2][3] = createPiece("white", "w1");

    const captures = getWithdrawalCapture(
      board,
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      "white"
    );

    expect(captures).toEqual([{ row: 2, col: 2 }]);
  });

  it("should capture a line of multiple enemy pieces by Withdrawal", () => {
    const board = createEmptyBoard();
    // Blacks at (2, 0), (2, 1), (2, 2). White at (2, 3) moves away to (2, 4).
    board[2][0] = createPiece("black", "b0");
    board[2][1] = createPiece("black", "b1");
    board[2][2] = createPiece("black", "b2");
    board[2][3] = createPiece("white", "w1");

    const captures = getWithdrawalCapture(
      board,
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      "white"
    );

    expect(captures).toHaveLength(3);
    expect(captures).toEqual([
      { row: 2, col: 2 },
      { row: 2, col: 1 },
      { row: 2, col: 0 },
    ]);
  });

  it("should correctly handle diagonal approach capture along valid diagonal line", () => {
    const board = createEmptyBoard();
    // (0,0) is strong. (1,1) is strong. (2,2) has Black.
    board[0][0] = createPiece("white", "w1");
    board[2][2] = createPiece("black", "b1");

    const captures = getApproachCapture(
      board,
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      "white"
    );

    expect(captures).toEqual([{ row: 2, col: 2 }]);
  });

  it("should detect both approach and withdrawal when moving between opposing pieces", () => {
    const board = createEmptyBoard();
    // Black at (2, 1) and Black at (2, 4). White at (2, 2) moves to (2, 3).
    // Moving 2,2 -> 2,3 approaches Black at 2,4 AND withdraws from Black at 2,1.
    board[2][1] = createPiece("black", "b1");
    board[2][2] = createPiece("white", "w1");
    board[2][4] = createPiece("black", "b2");

    const approach = getApproachCapture(
      board,
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      "white"
    );
    const withdrawal = getWithdrawalCapture(
      board,
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      "white"
    );

    expect(approach).toEqual([{ row: 2, col: 4 }]);
    expect(withdrawal).toEqual([{ row: 2, col: 1 }]);
  });
});
