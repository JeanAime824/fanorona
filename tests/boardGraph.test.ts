import { describe, expect, it } from "vitest";
import {
  BOARD_COLS,
  BOARD_ROWS,
  TOTAL_INTERSECTIONS,
  fromAlgebraic,
  getNeighbors,
  hasDiagonalConnections,
  isValidPosition,
  toAlgebraic,
} from "../src/game/board/boardGraph";

describe("Board Graph - Fanoron-tsivy Lattice", () => {
  it("should have exactly 45 intersections (9 cols x 5 rows)", () => {
    expect(BOARD_ROWS).toBe(5);
    expect(BOARD_COLS).toBe(9);
    expect(TOTAL_INTERSECTIONS).toBe(45);
  });

  it("should correctly identify strong intersections with diagonal connections", () => {
    // (row + col) % 2 === 0 has diagonals
    expect(hasDiagonalConnections({ row: 0, col: 0 })).toBe(true);
    expect(hasDiagonalConnections({ row: 0, col: 1 })).toBe(false);
    expect(hasDiagonalConnections({ row: 2, col: 4 })).toBe(true); // Center
    expect(hasDiagonalConnections({ row: 1, col: 1 })).toBe(true);
    expect(hasDiagonalConnections({ row: 1, col: 2 })).toBe(false);
  });

  it("should return 8 neighbors for internal strong intersections", () => {
    // Center intersection (2, 4) is strong: 4 orthogonal + 4 diagonal = 8 neighbors
    const centerNeighbors = getNeighbors({ row: 2, col: 4 });
    expect(centerNeighbors.length).toBe(8);

    // Adjacent weak intersection (2, 3): 4 orthogonal neighbors only
    const weakNeighbors = getNeighbors({ row: 2, col: 3 });
    expect(weakNeighbors.length).toBe(4);
  });

  it("should correctly bound edge and corner intersections", () => {
    // Corner (0,0) is strong: 2 orthogonal (right, down) + 1 diagonal (down-right) = 3 neighbors
    const corner00 = getNeighbors({ row: 0, col: 0 });
    expect(corner00.length).toBe(3);

    // Edge (0, 1) is weak: 3 orthogonal (left, right, down) = 3 neighbors
    const edge01 = getNeighbors({ row: 0, col: 1 });
    expect(edge01.length).toBe(3);
  });

  it("should validate positions within board boundaries", () => {
    expect(isValidPosition({ row: 0, col: 0 })).toBe(true);
    expect(isValidPosition({ row: 4, col: 8 })).toBe(true);
    expect(isValidPosition({ row: 5, col: 4 })).toBe(false);
    expect(isValidPosition({ row: 2, col: 9 })).toBe(false);
    expect(isValidPosition({ row: -1, col: 2 })).toBe(false);
  });

  it("should correctly convert to and from algebraic notation", () => {
    expect(toAlgebraic({ row: 2, col: 4 })).toBe("E3"); // Center
    expect(toAlgebraic({ row: 0, col: 0 })).toBe("A5"); // Top-left
    expect(toAlgebraic({ row: 4, col: 8 })).toBe("I1"); // Bottom-right

    const parsedCenter = fromAlgebraic("E3");
    expect(parsedCenter).toEqual({ row: 2, col: 4 });

    const parsedTopLeft = fromAlgebraic("A5");
    expect(parsedTopLeft).toEqual({ row: 0, col: 0 });
  });
});
