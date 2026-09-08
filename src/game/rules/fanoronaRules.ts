/**
 * @file fanoronaRules.ts
 * Rules validation, end-of-game checks, and rule documentation constants.
 */

import { countPieces } from "../board/initialBoard";
import { getAllCaptures, getAllPaikaMoves, getLegalMoves } from "../moves/moveGenerator";
import { GameState, GameStatus, GameWinner, Piece, Player } from "../types/gameTypes";

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
    "Dernière pièce adverse bloquée : s'il ne reste qu'une seule pièce de l'autre côté et qu'elle n'a plus où aller, l'adversaire gagne immédiatement la partie.",
    "Blocage complet (pat) : si le joueur actif ne dispose d'aucun mouvement légal, il perd la partie.",
    "Partie nulle (Match nul) : lorsqu'il ne reste qu'une seule pièce mobile de chaque côté.",
    "Abandon de la partie par un joueur."
  ]
};

/**
 * Checks whether a given player has any available moves (capture or paika) on the board.
 */
export function hasAnyAvailableMove(board: (Piece | null)[][], player: Player): boolean {
  if (getAllCaptures(board, player).length > 0) return true;
  if (getAllPaikaMoves(board, player).length > 0) return true;
  return false;
}

/**
 * Checks whether the game has reached a terminal state (win, loss, draw).
 */
export function checkGameStatus(state: GameState): {
  status: GameStatus;
  winner: GameWinner;
  reason?: string;
} {
  const { white, black } = countPieces(state.board);

  // 1. Total elimination
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

  // 2. Specific rule: If only 1 piece remains on one side and it has nowhere to go,
  // the opponent wins immediately!
  const whiteHasMoves = hasAnyAvailableMove(state.board, "white");
  const blackHasMoves = hasAnyAvailableMove(state.board, "black");

  // Check 1 vs 1 case first
  if (white === 1 && black === 1) {
    if (!whiteHasMoves && !blackHasMoves) {
      const winner: Player = state.currentPlayer === "white" ? "black" : "white";
      return {
        status: "game_over",
        winner,
        reason: `Les deux dernières pièces sont bloquées. Le joueur actif (${state.currentPlayer === "white" ? "Blanc" : "Noir"}) ne peut pas jouer.`,
      };
    }
    if (!whiteHasMoves) {
      return {
        status: "game_over",
        winner: "black",
        reason: "La dernière pièce blanche n'a plus où aller (bloquée) : victoire des Noirs !",
      };
    }
    if (!blackHasMoves) {
      return {
        status: "game_over",
        winner: "white",
        reason: "La dernière pièce noire n'a plus où aller (bloquée) : victoire des Blancs !",
      };
    }
    return {
      status: "game_over",
      winner: "draw",
      reason: "Partie nulle : il ne reste qu'une seule pièce mobile de chaque côté.",
    };
  }

  // When Black has only 1 piece left and it cannot move anywhere
  if (black === 1 && !blackHasMoves) {
    return {
      status: "game_over",
      winner: "white",
      reason: "Il ne reste qu'une seule pièce noire et elle n'a plus où aller (bloquée) : victoire des Blancs !",
    };
  }

  // When White has only 1 piece left and it cannot move anywhere
  if (white === 1 && !whiteHasMoves) {
    return {
      status: "game_over",
      winner: "black",
      reason: "Il ne reste qu'une seule pièce blanche et elle n'a plus où aller (bloquée) : victoire des Noirs !",
    };
  }

  // 3. Stalemate / Blocking check for the current player
  // In Fanorona, a player with no legal moves on their turn loses.
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
