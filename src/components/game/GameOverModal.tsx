/**
 * @file GameOverModal.tsx
 * Dialog presented upon victory, defeat, or draw.
 */

import { Clock, RefreshCw, Trophy, Users, Zap } from "lucide-react";
import React from "react";
import { GameState } from "../../game/types/gameTypes";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export interface GameOverModalProps {
  gameState: GameState;
  isOpen: boolean;
  onRestart: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState,
  isOpen,
  onRestart,
  onClose,
}) => {
  if (!isOpen || gameState.status !== "game_over") return null;

  const { winner, gameMode, aiPlayerColor, turnNumber, capturedPieces } = gameState;
  const isTimeout = gameState.reason?.toLowerCase().includes("temps écoulé");

  let title = "Fin de la partie";
  let subtitle = "";
  let isWin = false;

  if (winner === "draw") {
    title = "Partie Nulle";
    subtitle = gameState.reason || "Match nul : il ne reste qu'une seule pièce de chaque côté.";
  } else if (gameMode === "ai") {
    if (winner === aiPlayerColor) {
      title = isTimeout ? "Défaite au temps" : "Défaite";
      subtitle = gameState.reason || "L'intelligence artificielle a remporté la partie.";
    } else {
      title = isTimeout ? "Victoire au temps !" : "Victoire !";
      subtitle = gameState.reason || "Félicitations ! Vous avez vaincu l'IA.";
      isWin = true;
    }
  } else {
    title = isTimeout
      ? `Victoire des ${winner === "white" ? "Blancs" : "Noirs"} au temps !`
      : `Victoire des ${winner === "white" ? "Blancs" : "Noirs"} !`;
    subtitle =
      gameState.reason ||
      `Le joueur ${winner === "white" ? "Blanc" : "Noir"} a capturé ou bloqué toutes les pièces adverses.`;
    isWin = true;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" hideCloseButton={false}>
      <div className="text-center py-2">
        {/* Trophy / Icon */}
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-[#141414] border flex items-center justify-center shadow-lg shadow-black/60 ${
            isTimeout
              ? "border-rose-500/50 shadow-rose-500/10"
              : "border-[#D4AF37]/30"
          }`}
        >
          {isTimeout ? (
            <Clock className="w-8 h-8 text-rose-400 animate-pulse" />
          ) : (
            <Trophy
              className={`w-8 h-8 ${
                isWin ? "text-[#D4AF37] animate-bounce" : "text-white/40"
              }`}
            />
          )}
        </div>

        {isTimeout && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
            <Zap className="w-3 h-3 fill-current" />
            <span>Mode Vitesse • Fin au chronomètre</span>
          </div>
        )}

        <h3 className="text-xl font-bold font-serif tracking-wide text-[#E6E6E6] mb-1">
          {title}
        </h3>
        <p className="text-xs text-white/50 mb-6 px-4">{subtitle}</p>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-3.5 rounded-lg bg-[#141414] border border-white/10 text-left">
          <div>
            <div className="text-[10px] uppercase text-white/40 font-semibold tracking-wider">
              Tours joués
            </div>
            <div className="text-lg font-serif font-bold text-[#D4AF37]">
              {turnNumber}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-white/40 font-semibold tracking-wider">
              Total captures
            </div>
            <div className="text-lg font-serif font-bold text-[#D4AF37]">
              {capturedPieces.white + capturedPieces.black} pièces
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={onRestart}
            icon={<RefreshCw className="w-4 h-4" />}
            className="w-full"
          >
            Rejouer une partie
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full"
          >
            Examiner le plateau
          </Button>
        </div>
      </div>
    </Modal>
  );
};
