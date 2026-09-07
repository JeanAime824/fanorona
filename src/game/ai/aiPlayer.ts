/**
 * @file aiPlayer.ts
 * Main entry point for the Fanorona AI agent.
 * Dispatches to Easy, Medium, or Hard algorithms.
 * Guarantees legal moves only and non-blocking execution.
 */

import { getLegalMoves } from "../moves/moveGenerator";
import { GameState, Move, Player } from "../types/gameTypes";
import { AI_DIFFICULTY_CONFIGS } from "./difficulty";
import { minimax } from "./minimax";
import { orderMoves } from "./moveOrdering";

export interface AiDecision {
  action: "move" | "end_turn";
  move?: Move;
}

/**
 * Chooses the best move or turn completion for the AI player in the current state.
 */
export function chooseBestMove(state: GameState): AiDecision {
  if (state.status !== "playing") {
    return { action: "end_turn" };
  }

  const legalMoves = getLegalMoves(state);

  // If inside a capture sequence and no legal moves exist, must end turn
  if (state.captureSequence && legalMoves.length === 0) {
    return { action: "end_turn" };
  }

  if (legalMoves.length === 0) {
    return { action: "end_turn" };
  }

  const difficulty = state.difficulty || "medium";
  const aiColor: Player = state.currentPlayer;
  const config = AI_DIFFICULTY_CONFIGS[difficulty];

  // 1. Easy Mode
  if (difficulty === "easy") {
    // If in chain, 50% chance to voluntarily stop after a capture
    if (state.captureSequence && Math.random() < 0.4) {
      return { action: "end_turn" };
    }

    // Sort moves to prefer captures if any
    const sorted = orderMoves(legalMoves);
    // Add mild randomness among top 3 moves
    const topCandidates = sorted.slice(0, Math.min(3, sorted.length));
    const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];
    return { action: "move", move: chosen };
  }

  // 2. Medium Mode (depth 2 alpha-beta)
  if (difficulty === "medium") {
    const result = minimax(
      state,
      config.depth,
      -Infinity,
      Infinity,
      true,
      aiColor,
      0
    );

    if (result.shouldEndTurn && state.captureSequence) {
      return { action: "end_turn" };
    }

    if (result.bestMove) {
      return { action: "move", move: result.bestMove };
    }

    // Fallback: pick first legal move
    return { action: "move", move: legalMoves[0] };
  }

  // 3. Hard Mode (depth 3 alpha-beta with move ordering)
  const hardResult = minimax(
    state,
    config.depth,
    -Infinity,
    Infinity,
    true,
    aiColor,
    0
  );

  if (hardResult.shouldEndTurn && state.captureSequence) {
    return { action: "end_turn" };
  }

  if (hardResult.bestMove) {
    return { action: "move", move: hardResult.bestMove };
  }

  // Ultimate fallback to first legal move
  const ordered = orderMoves(legalMoves);
  return { action: "move", move: ordered[0] };
}
