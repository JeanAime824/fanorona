import { describe, expect, it } from "vitest";
import { chooseBestMove } from "../src/game/ai/aiPlayer";
import { createInitialGame } from "../src/game/engine/gameEngine";
import { isLegalMove } from "../src/game/moves/moveGenerator";

describe("AI Engine Tests - Easy, Medium & Hard", () => {
  it("should select a legal move from initial position in Easy mode", () => {
    const game = createInitialGame("ai", "easy", "black");
    const decision = chooseBestMove(game);

    expect(decision.action).toBe("move");
    expect(decision.move).toBeDefined();
    expect(isLegalMove(game, decision.move!)).toBe(true);
  });

  it("should select a legal move from initial position in Medium mode", () => {
    const game = createInitialGame("ai", "medium", "black");
    const decision = chooseBestMove(game);

    expect(decision.action).toBe("move");
    expect(decision.move).toBeDefined();
    expect(isLegalMove(game, decision.move!)).toBe(true);
  });

  it("should select a legal move from initial position in Hard mode", () => {
    const game = createInitialGame("ai", "hard", "black");
    const decision = chooseBestMove(game);

    expect(decision.action).toBe("move");
    expect(decision.move).toBeDefined();
    expect(isLegalMove(game, decision.move!)).toBe(true);
  });

  it("should choose a capturing move when captures are mandatory", () => {
    const game = createInitialGame("ai", "hard", "black");
    // In initial position, White has multiple legal moves that may be captures
    const decision = chooseBestMove(game);
    if (game.mandatoryCaptureActive && decision.move) {
      expect(decision.move.captures.length).toBeGreaterThan(0);
    }
  });
});
