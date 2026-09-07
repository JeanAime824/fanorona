/**
 * @file moveOrdering.ts
 * Sorts moves so that promising candidates (captures, high piece yield, center moves)
 * are examined first in Alpha-Beta minimax, dramatically pruning the search tree.
 */

import { Move } from "../types/gameTypes";

/**
 * Sorts moves in descending order of tactical promise.
 */
export function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    // 1. Prioritize moves with more captures
    const aCaptures = a.captures ? a.captures.length : 0;
    const bCaptures = b.captures ? b.captures.length : 0;
    if (aCaptures !== bCaptures) {
      return bCaptures - aCaptures;
    }

    // 2. Prioritize moves towards the center (row 2, col 4)
    const aDistToCenter = Math.abs(a.to.row - 2) + Math.abs(a.to.col - 4);
    const bDistToCenter = Math.abs(b.to.row - 2) + Math.abs(b.to.col - 4);
    return aDistToCenter - bDistToCenter;
  });
}
