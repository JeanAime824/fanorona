/**
 * @file fanoronaRules.ts
 * Rules validation, end-of-game checks, and rule documentation constants.
 */

import { countPieces } from "../board/initialBoard";
import { getLegalMoves } from "../moves/moveGenerator";
import { GameState, GameStatus, GameWinner, Player } from "../types/gameTypes";

export const FANORONA_RULES_DOC = {
  variant: "Fanoron-tsivy (Standard Traditionnel de Madagascar)",
  board: "9 colonnes × 5 lignes, soit 45 intersections reliées par lignes orthogonales et diagonales (intersections fortes)",
  pieces: "22 pièces blanches et 22 pièces noires (44 pièces au total, intersection centrale vide)",
  turnOrder: "Les Blancs jouent en premier",
  movement: "Déplacement d'une intersection vers une intersection libre immédiatement voisine le long d'une ligne tracée",
  captureApproach: "Tomboky : la pièce s'approche d'une ou plusieurs pièces adverses alignées. Toutes les pièces adverses ininterrompues dans cette direction sont capturées.",
  captureWithdrawal: "Faly : la pièce s'éloigne d'une ou plusieurs pièces adverses alignées. Toutes les pièces adverses ininterrompues dans le sens opposé au déplacement sont capturées.",
  simultaneousChoice: "Si un déplacement permet à la fois une capture par approche et par éloignement, le joueur doit choisir l'un des deux effets (les deux ne sont pas cumulables).",
  mandatoryCapture: "Priorité absolue aux captures : si une capture est possible sur le plateau, aucun déplacement simple (paika) n'est autorisé.",
  multipleCaptures: [
    "Après une capture, la même pièce peut enchaîner d'autres captures au cours du même tour.",
    "La pièce ne peut pas revenir sur une intersection déjà visitée lors du tour en cours.",
    "La pièce ne peut pas effectuer deux pas successifs dans la même direction (changement de direction obligatoire).",
    "Sur le tout premier coup de la partie (Tour 1 Blanc), seule une capture simple est autorisée (variante standard évitant un déséquilibre initial prématuré).",
    "Poursuivre la séquence de capture est facultatif : le joueur peut décider de terminer son tour à tout moment.",
    "Si aucune capture supplémentaire légale n'est possible, le tour prend fin automatiquement."
  ],
  victoryConditions: [
    "Capture de toutes les pièces adverses (adversaire réduit à 0 pièce).",
    "Blocage complet : si le joueur actif ne dispose d'aucun mouvement légal (pat), il perd la partie.",
    "Partie nulle (Match nul) : lorsqu'il ne reste qu'une seule pièce de chaque côté.",
    "Abandon de la partie par un joueur."
  ]
};

/**
 * Checks whether the game has reached a terminal state (win, loss, draw).
 */
export function checkGameStatus(state: GameState): {
  status: GameStatus;
  winner: GameWinner;
  reason?: string;
} {
  const { white, black } = countPieces(state.board);

  // 1. Elimination
  if (white === 0) {
    return {
      status: "game_over",
      winner: "black",
      reason: "Toutes les pièces blanches ont été capturées.",
    };
  }

  if (black === 0) {
    return {
      status: "game_over",
      winner: "white",
      reason: "Toutes les pièces noires ont été capturées.",
    };
  }

  // 2. Draw: exactly 1 piece remaining on each side
  if (white === 1 && black === 1) {
    return {
      status: "game_over",
      winner: "draw",
      reason: "Partie nulle : il ne reste qu'une seule pièce de chaque côté.",
    };
  }

  // 2. Stalemate / Blocking check
  // In Fanorona, a player with no legal moves loses.
  const legalMoves = getLegalMoves(state);
  if (legalMoves.length === 0 && !state.captureSequence) {
    const winner: Player = state.currentPlayer === "white" ? "black" : "white";
    return {
      status: "game_over",
      winner,
      reason: `Le joueur ${state.currentPlayer === "white" ? "Blanc" : "Noir"} n'a aucun mouvement légal possible (blocage).`,
    };
  }

  return {
    status: "playing",
    winner: null,
  };
}
