/**
 * @file historyManager.ts
 * Manages game snapshots for robust Undo/Redo functionality.
 * Supports single-ply undo (2-player) and dual-ply undo (vs AI).
 */

import { GameState } from "../types/gameTypes";

export class HistoryManager {
  private past: GameState[] = [];
  private future: GameState[] = [];

  constructor(initialState?: GameState) {
    if (initialState) {
      this.past = [];
      this.future = [];
    }
  }

  /**
   * Pushes a new state to the past stack and clears future (redo) stack.
   */
  public pushState(currentState: GameState): void {
    this.past.push(currentState);
    this.future = [];
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Performs an Undo operation.
   * In AI mode, if the last move was made by the AI, unwinds back to the human player's turn.
   */
  public undo(currentState: GameState): GameState | null {
    if (!this.canUndo()) return null;

    // Save current to redo stack
    this.future.unshift(currentState);
    const previousState = this.past.pop()!;

    // If against AI and previous state is still during AI turn or resulted from human turn,
    // we can revert an additional step if needed so user is on their own turn.
    if (
      currentState.gameMode === "ai" &&
      previousState.currentPlayer === currentState.aiPlayerColor &&
      this.past.length > 0
    ) {
      this.future.unshift(previousState);
      return this.past.pop()!;
    }

    return previousState;
  }

  /**
   * Performs a Redo operation.
   */
  public redo(currentState: GameState): GameState | null {
    if (!this.canRedo()) return null;

    this.past.push(currentState);
    const nextState = this.future.shift()!;
    return nextState;
  }

  public reset(): void {
    this.past = [];
    this.future = [];
  }
}
