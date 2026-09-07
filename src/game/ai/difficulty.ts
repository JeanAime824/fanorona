/**
 * @file difficulty.ts
 * AI difficulty configuration parameters.
 */

import { AiDifficulty } from "../types/gameTypes";

export interface AiConfig {
  name: string;
  depth: number;
  randomness: number; // 0 (deterministic) to 1 (high randomness)
  evaluatePosition: boolean;
  useAlphaBeta: boolean;
}

export const AI_DIFFICULTY_CONFIGS: Record<AiDifficulty, AiConfig> = {
  easy: {
    name: "Facile",
    depth: 1,
    randomness: 0.35,
    evaluatePosition: false,
    useAlphaBeta: false,
  },
  medium: {
    name: "Moyen",
    depth: 2,
    randomness: 0.1,
    evaluatePosition: true,
    useAlphaBeta: true,
  },
  hard: {
    name: "Difficile",
    depth: 3,
    randomness: 0.0,
    evaluatePosition: true,
    useAlphaBeta: true,
  },
};
