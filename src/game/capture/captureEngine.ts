/**
 * @file captureEngine.ts
 * Implements Fanorona's capture mechanics:
 * 1. Capture by Approach (tomboky)
 * 2. Capture by Withdrawal / Retreat (faly)
 * 
 * In Fanorona, capturing is linear along the direction of the move.
 * An unbroken line of opponent pieces along that direction is captured.
 */

import { areNeighbors, getDirection, isValidPosition } from "../board/boardGraph";
import { Direction, Piece, Player, Position } from "../types/gameTypes";

/**
 * Calculates pieces captured by Approach (tomboky).
 * Moving from 'from' to 'to' in direction D.
 * Pieces captured are consecutive opponent pieces immediately in front of 'to' along direction D.
 */
export function getApproachCapture(
  board: (Piece | null)[][],
  from: Position,
  to: Position,
  player: Player
): Position[] {
  const dir = getDirection(from, to);
  if (!dir) return [];

  const opponent: Player = player === "white" ? "black" : "white";
  const capturedPositions: Position[] = [];

  // Start immediately in front of 'to' in direction dir
  let currRow = to.row + dir.row;
  let currCol = to.col + dir.col;

  while (isValidPosition({ row: currRow, col: currCol })) {
    const piece = board[currRow][currCol];
    if (!piece || piece.player !== opponent) {
      // Line is broken by empty space or friendly piece
      break;
    }

    // Verify graph connectivity along the line of capture
    const prevPos: Position = { row: currRow - dir.row, col: currCol - dir.col };
    const currPos: Position = { row: currRow, col: currCol };
    if (!areNeighbors(prevPos, currPos)) {
      break;
    }

    capturedPositions.push(currPos);
    currRow += dir.row;
    currCol += dir.col;
  }

  return capturedPositions;
}

/**
 * Calculates pieces captured by Withdrawal / Retreat (faly).
 * Moving from 'from' to 'to' in direction D.
 * Pieces captured are consecutive opponent pieces immediately behind 'from' along direction -D.
 */
export function getWithdrawalCapture(
  board: (Piece | null)[][],
  from: Position,
  to: Position,
  player: Player
): Position[] {
  const dir = getDirection(from, to);
  if (!dir) return [];

  const opponent: Player = player === "white" ? "black" : "white";
  const capturedPositions: Position[] = [];

  // Start immediately behind 'from' in direction -dir
  let currRow = from.row - dir.row;
  let currCol = from.col - dir.col;

  while (isValidPosition({ row: currRow, col: currCol })) {
    const piece = board[currRow][currCol];
    if (!piece || piece.player !== opponent) {
      // Line is broken by empty space or friendly piece
      break;
    }

    // Verify graph connectivity along the line of capture
    const nextPos: Position = { row: currRow + dir.row, col: currCol + dir.col };
    const currPos: Position = { row: currRow, col: currCol };
    if (!areNeighbors(currPos, nextPos)) {
      break;
    }

    capturedPositions.push(currPos);
    currRow -= dir.row;
    currCol -= dir.col;
  }

  return capturedPositions;
}

/**
 * Analyzes both approach and withdrawal opportunities for a step.
 */
export function getCapturesForStep(
  board: (Piece | null)[][],
  from: Position,
  to: Position,
  player: Player
): { approach: Position[]; withdrawal: Position[]; direction: Direction | null } {
  const dir = getDirection(from, to);
  if (!dir) {
    return { approach: [], withdrawal: [], direction: null };
  }

  const approach = getApproachCapture(board, from, to, player);
  const withdrawal = getWithdrawalCapture(board, from, to, player);

  return { approach, withdrawal, direction: dir };
}
