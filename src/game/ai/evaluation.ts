/**
 * @file evaluation.ts
 * Evaluation heuristics for Fanorona board states.
 * Considers material balance, board position weights (strong vs weak intersections),
 * central dominance, mobility, and terminal victory.
 */

import { hasDiagonalConnections } from "../board/boardGraph";
import { countPieces } from "../board/initialBoard";
import { getLegalMoves } from "../moves/moveGenerator";
import { GameState, Player } from "../types/gameTypes";

/**
 * Positional weight map for the 5x9 Fanorona board.
 * In Fanorona, intersections with diagonals (strong intersections) are tactically superior,
 * and central intersections command greater control of the board.
 */
const POSITION_WEIGHTS: number[][] = [
  [12, 4, 14, 6, 16, 6, 14, 4, 12],
  [ 4, 15, 8, 18, 10, 18, 8, 15, 4],
  [14, 8, 22, 12, 30, 12, 22, 8, 14],
  [ 4, 15, 8, 18, 10, 18, 8, 15, 4],
  [12, 4, 14, 6, 16, 6, 14, 4, 12],
];

/**
 * Evaluates the game state from the perspective of a given player.
 * Positive values favor the evaluating player; negative values favor the opponent.
 */
export function evaluateBoard(state: GameState, player: Player): number {
  const opponent: Player = player === "white" ? "black" : "white";

  // 1. Terminal victory checks
  if (state.status === "game_over") {
    if (state.winner === player) return 100000;
    if (state.winner === opponent) return -100000;
    return 0;
  }

  // 2. Material balance (100 points per piece)
  const pieceCounts = countPieces(state.board);
  const myPieces = player === "white" ? pieceCounts.white : pieceCounts.black;
  const oppPieces = opponent === "white" ? pieceCounts.white : pieceCounts.black;

  if (oppPieces === 0) return 100000;
  if (myPieces === 0) return -100000;

  const materialScore = (myPieces - oppPieces) * 120;

  // 3. Positional control and intersection strength
  let positionalScore = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 9; c++) {
      const piece = state.board[r][c];
      if (piece) {
        const weight = POSITION_WEIGHTS[r][c];
        if (piece.player === player) {
          positionalScore += weight;
        } else {
          positionalScore -= weight;
        }
      }
    }
  }

  // 4. Mobility score (number of legal moves available)
  // Higher mobility prevents stalemate and creates tactical opportunities
  const myMovesCount = state.currentPlayer === player ? state.legalMoves.length : 10;
  const mobilityScore = myMovesCount * 4;

  return materialScore + positionalScore + mobilityScore;
}
