/**
 * @file formatters.ts
 * Text, status message, and statistic formatters.
 */

import { AiDifficulty, GameMode, GameStatus, GameWinner, Player } from "../game/types/gameTypes";

export function formatPlayerName(
  player: Player,
  gameMode: GameMode,
  aiPlayerColor?: Player
): string {
  if (gameMode === "ai") {
    if (player === aiPlayerColor) {
      return player === "white" ? "IA (Blancs)" : "IA (Noirs)";
    }
    return player === "white" ? "Vous (Blancs)" : "Vous (Noirs)";
  }
  return player === "white" ? "Joueur Blanc" : "Joueur Noir";
}

export function formatDifficulty(diff: AiDifficulty): string {
  switch (diff) {
    case "easy":
      return "Facile";
    case "medium":
      return "Moyen";
    case "hard":
      return "Difficile";
  }
}

export function getStatusInstruction(
  status: GameStatus,
  winner: GameWinner,
  currentPlayer: Player,
  isAiThinking: boolean,
  inCaptureSequence: boolean,
  mandatoryCapture: boolean
): string {
  if (status === "game_over") {
    if (winner === "white") return "Partie terminée : Les Blancs l'emportent !";
    if (winner === "black") return "Partie terminée : Les Noirs l'emportent !";
    return "Partie terminée : Match nul !";
  }

  if (isAiThinking) {
    return "L'IA analyse le plateau...";
  }

  if (inCaptureSequence) {
    return "Enchaînement actif : continuez la capture ou cliquez sur « Terminer le tour ».";
  }

  if (mandatoryCapture) {
    return "Capture obligatoire : sélectionnez une pièce pouvant capturer.";
  }

  return `Au tour du joueur ${currentPlayer === "white" ? "Blanc" : "Noir"} : sélectionnez une pièce à déplacer.`;
}
