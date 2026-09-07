/**
 * @file moveGenerator.ts
 * Generates all legal moves for a player in a given GameState.
 * Enforces mandatory captures, approach/withdrawal differentiation,
 * and combo chain constraints (non-repetition of intersections, direction change).
 */

import { areNeighbors, getDirection, getNeighbors, isSamePosition, isValidPosition } from "../board/boardGraph";
import { getCapturesForStep } from "../capture/captureEngine";
import { Direction, GameState, Move, Piece, Player, Position } from "../types/gameTypes";

/**
 * Returns all legal moves for the current player in the current state.
 * If fromPos is specified, filters only legal moves originating from that position.
 */
export function getLegalMoves(state: GameState, fromPos?: Position): Move[] {
  if (state.status !== "playing") return [];

  // If a multiple capture sequence is active, only the active piece may move
  if (state.captureSequence) {
    const moves = getContinuationCaptures(state);
    if (fromPos) {
      return moves.filter((m) => isSamePosition(m.from, fromPos));
    }
    return moves;
  }

  // Normal turn start: check for mandatory captures
  const allCaptures = getAllCaptures(state.board, state.currentPlayer);

  let resultMoves: Move[] = [];
  if (allCaptures.length > 0) {
    // Captures are mandatory in Fanorona!
    resultMoves = allCaptures;
  } else {
    // If no captures are available, normal paika (non-capturing) moves are legal
    resultMoves = getAllPaikaMoves(state.board, state.currentPlayer);
  }

  if (fromPos) {
    return resultMoves.filter((m) => isSamePosition(m.from, fromPos));
  }
  return resultMoves;
}

/**
 * Generates valid continuation captures for an ongoing capture sequence.
 */
export function getContinuationCaptures(state: GameState): Move[] {
  if (!state.captureSequence) return [];

  const { piecePosition, visitedPositions, lastDirection } = state.captureSequence;
  const player = state.currentPlayer;
  const piece = state.board[piecePosition.row][piecePosition.col];

  if (!piece || piece.player !== player) return [];

  const neighbors = getNeighbors(piecePosition);
  const moves: Move[] = [];

  for (const to of neighbors) {
    // Destination must be empty
    if (state.board[to.row][to.col] !== null) continue;

    // RULE 1: Cannot revisit any position already visited in this turn
    const alreadyVisited = visitedPositions.some((v) => isSamePosition(v, to));
    if (alreadyVisited) continue;

    const dir = getDirection(piecePosition, to);
    if (!dir) continue;

    // RULE 2: Cannot move in the exact same direction as the immediately preceding step
    if (
      lastDirection &&
      dir.row === lastDirection.row &&
      dir.col === lastDirection.col
    ) {
      continue;
    }

    // RULE 3: Continuations MUST be capturing moves
    const { approach, withdrawal } = getCapturesForStep(state.board, piecePosition, to, player);

    if (approach.length > 0) {
      moves.push({
        from: piecePosition,
        to,
        captures: approach,
        captureType: "approach",
        direction: dir,
      });
    }

    if (withdrawal.length > 0) {
      moves.push({
        from: piecePosition,
        to,
        captures: withdrawal,
        captureType: "withdrawal",
        direction: dir,
      });
    }
  }

  return moves;
}

/**
 * Finds all possible capture moves for all pieces of a player on the board.
 */
export function getAllCaptures(board: (Piece | null)[][], player: Player): Move[] {
  const captures: Move[] = [];

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const piece = board[r][c];
      if (!piece || piece.player !== player) continue;

      const from: Position = { row: r, col: c };
      const neighbors = getNeighbors(from);

      for (const to of neighbors) {
        // Must move to an empty intersection
        if (board[to.row][to.col] !== null) continue;

        const { approach, withdrawal, direction } = getCapturesForStep(board, from, to, player);
        if (!direction) continue;

        if (approach.length > 0) {
          captures.push({
            from,
            to,
            captures: approach,
            captureType: "approach",
            direction,
          });
        }

        if (withdrawal.length > 0) {
          captures.push({
            from,
            to,
            captures: withdrawal,
            captureType: "withdrawal",
            direction,
          });
        }
      }
    }
  }

  return captures;
}

/**
 * Finds all paika (non-capturing) moves for all pieces of a player.
 */
export function getAllPaikaMoves(board: (Piece | null)[][], player: Player): Move[] {
  const paikaMoves: Move[] = [];

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const piece = board[r][c];
      if (!piece || piece.player !== player) continue;

      const from: Position = { row: r, col: c };
      const neighbors = getNeighbors(from);

      for (const to of neighbors) {
        if (board[to.row][to.col] === null) {
          const dir = getDirection(from, to);
          if (dir) {
            paikaMoves.push({
              from,
              to,
              captures: [],
              direction: dir,
            });
          }
        }
      }
    }
  }

  return paikaMoves;
}

/**
 * Checks whether mandatory captures exist for the given player.
 */
export function hasMandatoryCapture(board: (Piece | null)[][], player: Player): boolean {
  return getAllCaptures(board, player).length > 0;
}

/**
 * Validates whether a proposed move is in the list of legal moves.
 */
export function isLegalMove(state: GameState, move: Move): boolean {
  const legalMoves = getLegalMoves(state);
  return legalMoves.some(
    (m) =>
      isSamePosition(m.from, move.from) &&
      isSamePosition(m.to, move.to) &&
      m.captureType === move.captureType
  );
}
