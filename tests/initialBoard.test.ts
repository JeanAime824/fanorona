import { describe, expect, it } from "vitest";
import { countPieces, createInitialBoard } from "../src/game/board/initialBoard";
import { createInitialGame } from "../src/game/engine/gameEngine";

describe("Initial Board & Game Setup", () => {
  it("should create a board with exactly 22 White and 22 Black pieces", () => {
    const board = createInitialBoard();
    const counts = countPieces(board);
    expect(counts.white).toBe(22);
    expect(counts.black).toBe(22);
  });

  it("should have exactly 1 empty intersection at the center (2, 4)", () => {
    const board = createInitialBoard();
    expect(board[2][4]).toBeNull();

    // Check all other intersections are occupied
    let emptyCount = 0;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === null) emptyCount++;
      }
    }
    expect(emptyCount).toBe(1);
  });

  it("should place Black pieces on rows 0 and 1, and White pieces on rows 3 and 4", () => {
    const board = createInitialBoard();

    // Row 0 and 1: all Black
    for (let r = 0; r <= 1; r++) {
      for (let c = 0; c < 9; c++) {
        expect(board[r][c]?.player).toBe("black");
      }
    }

    // Row 3 and 4: all White
    for (let r = 3; r <= 4; r++) {
      for (let c = 0; c < 9; c++) {
        expect(board[r][c]?.player).toBe("white");
      }
    }
  });

  it("should have the authentic alternating pattern on row 2", () => {
    const board = createInitialBoard();
    const middleRowPlayers = board[2].map((p) => p?.player || null);
    expect(middleRowPlayers).toEqual([
      "black",
      "white",
      "black",
      "white",
      null, // Center empty (E3)
      "black",
      "white",
      "black",
      "white",
    ]);
  });

  it("should initialize game with White playing first and playing status", () => {
    const game = createInitialGame("pvp");
    expect(game.currentPlayer).toBe("white");
    expect(game.status).toBe("playing");
    expect(game.winner).toBeNull();
    expect(game.turnNumber).toBe(1);
    expect(game.capturedPieces.white).toBe(0);
    expect(game.capturedPieces.black).toBe(0);
  });
});
