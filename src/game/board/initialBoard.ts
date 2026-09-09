/**
 * @file initialBoard.ts
 * Generates the authentic starting position for Fanoron-tsivy (9x5 board).
 * Exactly 22 White pieces, 22 Black pieces, with center (row 2, col 4) empty.
 */

import { Piece, Player } from "../types/gameTypes";
import { BOARD_COLS, BOARD_ROWS } from "./boardGraph";

/**
 * Creates a unique Piece object.
 */
export function createPiece(player: Player, idSuffix: string): Piece {
  return {
    id: `${player}-${idSuffix}`,
    player,
  };
}

/**
 * Creates the authentic initial board matrix (5 rows x 9 cols).
 * Row 0: 9 Black pieces
 * Row 1: 9 Black pieces
 * Row 2: B, W, B, W, [EMPTY], W, B, W, B
 * Row 3: 9 White pieces
 * Row 4: 9 White pieces
 */
export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  );

  let blackId = 1;
  let whiteId = 1;

  // Rows 0 and 1: All Black
  for (let r = 0; r <= 1; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      board[r][c] = createPiece("black", `b${blackId++}`);
    }
  }

  // Row 2: Middle row pattern (A3 to I3):
  // Col 0 (A3): Black, Col 1 (B3): White, Col 2 (C3): Black, Col 3 (D3): White
  // Center (Col 4 / E3): null (empty)
  // Col 5 (F3): Black, Col 6 (G3): White, Col 7 (H3): Black, Col 8 (I3): White
  const middleRowSetup: (Player | null)[] = [
    "black",
    "white",
    "black",
    "white",
    null,
    "black",
    "white",
    "black",
    "white",
  ];

  for (let c = 0; c < BOARD_COLS; c++) {
    const p = middleRowSetup[c];
    if (p === "black") {
      board[2][c] = createPiece("black", `b${blackId++}`);
    } else if (p === "white") {
      board[2][c] = createPiece("white", `w${whiteId++}`);
    } else {
      board[2][c] = null;
    }
  }

  // Rows 3 and 4: All White
  for (let r = 3; r <= 4; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      board[r][c] = createPiece("white", `w${whiteId++}`);
    }
  }

  return board;
}

/**
 * Creates a deep clone of the board matrix.
 */
export function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
  return board.map((row) =>
    row.map((piece) => (piece ? { ...piece } : null))
  );
}

/**
 * Counts pieces remaining on the board.
 */
export function countPieces(board: (Piece | null)[][]): { white: number; black: number } {
  let white = 0;
  let black = 0;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece) {
        if (piece.player === "white") white++;
        else black++;
      }
    }
  }
  return { white, black };
}
