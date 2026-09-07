/**
 * @file boardGraph.ts
 * Defines the 9x5 graph lattice of traditional Fanoron-tsivy.
 * Exactly 45 intersections with horizontal, vertical, and alternating diagonal links.
 */

import { Direction, Position } from "../types/gameTypes";

export const BOARD_ROWS = 5;
export const BOARD_COLS = 9;
export const TOTAL_INTERSECTIONS = BOARD_ROWS * BOARD_COLS; // 45

/**
 * Checks if a coordinate is within the 9x5 Fanorona board limits.
 */
export function isValidPosition(pos: Position): boolean {
  return (
    Number.isInteger(pos.row) &&
    Number.isInteger(pos.col) &&
    pos.row >= 0 &&
    pos.row < BOARD_ROWS &&
    pos.col >= 0 &&
    pos.col < BOARD_COLS
  );
}

/**
 * In traditional Fanorona, "strong" intersections have diagonal lines.
 * This occurs precisely when (row + col) % 2 === 0.
 */
export function hasDiagonalConnections(pos: Position): boolean {
  if (!isValidPosition(pos)) return false;
  return (pos.row + pos.col) % 2 === 0;
}

/**
 * Standard 8 directions (4 orthogonal, 4 diagonal).
 */
const ORTHOGONAL_DIRECTIONS: Direction[] = [
  { row: -1, col: 0 }, // North
  { row: 1, col: 0 },  // South
  { row: 0, col: -1 }, // West
  { row: 0, col: 1 },  // East
];

const DIAGONAL_DIRECTIONS: Direction[] = [
  { row: -1, col: -1 }, // North-West
  { row: -1, col: 1 },  // North-East
  { row: 1, col: -1 },  // South-West
  { row: 1, col: 1 },   // South-East
];

/**
 * Returns all valid directions a piece at the given position can traverse.
 * 8 directions for strong intersections, 4 orthogonal directions for weak intersections.
 */
export function getAllowedDirections(pos: Position): Direction[] {
  if (!isValidPosition(pos)) return [];
  if (hasDiagonalConnections(pos)) {
    return [...ORTHOGONAL_DIRECTIONS, ...DIAGONAL_DIRECTIONS];
  }
  return [...ORTHOGONAL_DIRECTIONS];
}

/**
 * Precomputed adjacency list for maximum performance and fast AI searches.
 */
const ADJACENCY_MAP: Map<string, Position[]> = new Map();
const DIRECTIONS_MAP: Map<string, Direction[]> = new Map();

for (let r = 0; r < BOARD_ROWS; r++) {
  for (let c = 0; c < BOARD_COLS; c++) {
    const pos: Position = { row: r, col: c };
    const key = `${r},${c}`;
    const dirs = getAllowedDirections(pos);
    DIRECTIONS_MAP.set(key, dirs);

    const neighbors: Position[] = [];
    for (const d of dirs) {
      const neighbor: Position = { row: r + d.row, col: c + d.col };
      if (isValidPosition(neighbor)) {
        neighbors.push(neighbor);
      }
    }
    ADJACENCY_MAP.set(key, neighbors);
  }
}

/**
 * Returns all immediately connected adjacent positions on the board graph.
 */
export function getNeighbors(pos: Position): Position[] {
  if (!isValidPosition(pos)) return [];
  const key = `${pos.row},${pos.col}`;
  return ADJACENCY_MAP.get(key) || [];
}

/**
 * Returns all directions originating from this position that lead to a valid board neighbor.
 */
export function getValidDirectionsForPosition(pos: Position): Direction[] {
  if (!isValidPosition(pos)) return [];
  const key = `${pos.row},${pos.col}`;
  return DIRECTIONS_MAP.get(key) || [];
}

/**
 * Returns true if posA and posB are directly connected by an existing board line.
 */
export function areNeighbors(posA: Position, posB: Position): boolean {
  if (!isValidPosition(posA) || !isValidPosition(posB)) return false;
  const dRow = posB.row - posA.row;
  const dCol = posB.col - posA.col;

  // Must be 1 step away
  if (Math.abs(dRow) > 1 || Math.abs(dCol) > 1) return false;
  if (dRow === 0 && dCol === 0) return false;

  // If diagonal, posA must have diagonal connections
  if (dRow !== 0 && dCol !== 0) {
    return hasDiagonalConnections(posA);
  }

  return true;
}

/**
 * Returns the direction vector from posA to immediately adjacent neighbor posB.
 */
export function getDirection(from: Position, to: Position): Direction | null {
  if (!areNeighbors(from, to)) return null;
  return {
    row: (to.row - from.row) as -1 | 0 | 1,
    col: (to.col - from.col) as -1 | 0 | 1,
  };
}

/**
 * Checks equality between two positions.
 */
export function isSamePosition(a: Position | null, b: Position | null): boolean {
  if (!a || !b) return false;
  return a.row === b.row && a.col === b.col;
}

/**
 * Returns algebraic chess-like notation for Fanorona (e.g. E3 is center).
 * Columns: A through I (col 0 to 8).
 * Rows: 1 through 5 (row 0 to 4, top to bottom or bottom to top).
 * By convention: row 0 is 5 (top) down to row 4 is 1 (bottom).
 */
const COL_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

export function toAlgebraic(pos: Position): string {
  if (!isValidPosition(pos)) return "??";
  const colLetter = COL_LETTERS[pos.col];
  const rowNumber = 5 - pos.row; // row 4 -> 1, row 0 -> 5
  return `${colLetter}${rowNumber}`;
}

export function fromAlgebraic(notation: string): Position | null {
  if (notation.length < 2) return null;
  const colLetter = notation[0].toUpperCase();
  const rowNum = parseInt(notation.substring(1), 10);
  const colIndex = COL_LETTERS.indexOf(colLetter);
  if (colIndex === -1 || isNaN(rowNum) || rowNum < 1 || rowNum > 5) return null;
  return {
    row: 5 - rowNum,
    col: colIndex,
  };
}
