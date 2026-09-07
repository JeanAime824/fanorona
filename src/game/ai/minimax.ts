/**
 * @file minimax.ts
 * Minimax algorithm with Alpha-Beta pruning and capture chain resolution.
 */

import { applyMove, endTurn } from "../engine/gameEngine";
import { getLegalMoves } from "../moves/moveGenerator";
import { GameState, Move, Player } from "../types/gameTypes";
import { evaluateBoard } from "./evaluation";
import { orderMoves } from "./moveOrdering";

export interface SearchResult {
  bestMove: Move | null;
  score: number;
  shouldEndTurn?: boolean;
}

/**
 * Minimax search with Alpha-Beta pruning.
 */
export function minimax(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: Player,
  chainDepth: number = 0
): { score: number; bestMove: Move | null; shouldEndTurn?: boolean } {
  // Terminal state or depth limit reached
  if (state.status === "game_over" || depth <= 0 || chainDepth > 4) {
    return {
      score: evaluateBoard(state, aiColor),
      bestMove: null,
    };
  }

  const legalMoves = orderMoves(getLegalMoves(state));

  // If in a multiple capture chain, ending turn is an explicit option
  const canVoluntarilyEnd = state.captureSequence !== null;

  if (legalMoves.length === 0) {
    if (canVoluntarilyEnd) {
      const turnEndedState = endTurn(state);
      return {
        score: evaluateBoard(turnEndedState, aiColor),
        bestMove: null,
        shouldEndTurn: true,
      };
    }
    return {
      score: evaluateBoard(state, aiColor),
      bestMove: null,
    };
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    let bestMove: Move | null = legalMoves[0] || null;
    let shouldEndTurn = false;

    // Check evaluate ending turn if in chain
    if (canVoluntarilyEnd) {
      const turnEndedState = endTurn(state);
      const evalEnd = minimax(
        turnEndedState,
        depth - 1,
        alpha,
        beta,
        false,
        aiColor,
        0
      ).score;
      if (evalEnd > maxEval) {
        maxEval = evalEnd;
        bestMove = null;
        shouldEndTurn = true;
      }
      alpha = Math.max(alpha, evalEnd);
    }

    for (const move of legalMoves) {
      const nextState = applyMove(state, move);
      const isStillMyTurn = nextState.currentPlayer === state.currentPlayer;

      const evalScore = minimax(
        nextState,
        isStillMyTurn ? depth : depth - 1,
        alpha,
        beta,
        isStillMyTurn,
        aiColor,
        isStillMyTurn ? chainDepth + 1 : 0
      ).score;

      if (evalScore > maxEval) {
        maxEval = evalScore;
        bestMove = move;
        shouldEndTurn = false;
      }

      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }

    return { score: maxEval, bestMove, shouldEndTurn };
  } else {
    let minEval = Infinity;
    let bestMove: Move | null = legalMoves[0] || null;
    let shouldEndTurn = false;

    if (canVoluntarilyEnd) {
      const turnEndedState = endTurn(state);
      const evalEnd = minimax(
        turnEndedState,
        depth - 1,
        alpha,
        beta,
        true,
        aiColor,
        0
      ).score;
      if (evalEnd < minEval) {
        minEval = evalEnd;
        bestMove = null;
        shouldEndTurn = true;
      }
      beta = Math.min(beta, evalEnd);
    }

    for (const move of legalMoves) {
      const nextState = applyMove(state, move);
      const isStillMyTurn = nextState.currentPlayer === state.currentPlayer;

      const evalScore = minimax(
        nextState,
        isStillMyTurn ? depth : depth - 1,
        alpha,
        beta,
        !isStillMyTurn,
        aiColor,
        isStillMyTurn ? chainDepth + 1 : 0
      ).score;

      if (evalScore < minEval) {
        minEval = evalScore;
        bestMove = move;
        shouldEndTurn = false;
      }

      beta = Math.min(beta, evalScore);
      if (beta <= alpha) {
        break; // Alpha-beta cutoff
      }
    }

    return { score: minEval, bestMove, shouldEndTurn };
  }
}
