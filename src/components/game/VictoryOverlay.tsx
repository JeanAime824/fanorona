/**
 * @file VictoryOverlay.tsx
 * Celebratory victory overlay featuring rich animations, confetti salvos,
 * personalized winner accolade, strategic statistics, and immediate restart action.
 */

import confetti from "canvas-confetti";
import {
  Award,
  Crown,
  Eye,
  Flame,
  Play,
  RefreshCw,
  Sliders,
  Sparkles,
  Swords,
  Timer,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect } from "react";
import { GameState } from "../../game/types/gameTypes";
import { sound } from "../../services/audio/soundSynthesizer";
import { Button } from "../ui/Button";

export interface VictoryOverlayProps {
  isOpen: boolean;
  gameState: GameState;
  winnerName: string;
  isSpeedMode?: boolean;
  onRestartImmediately: () => void;
  onReviewBoard: () => void;
  onOpenNewGameModal?: () => void;
}

export const VictoryOverlay: React.FC<VictoryOverlayProps> = ({
  isOpen,
  gameState,
  winnerName,
  isSpeedMode = false,
  onRestartImmediately,
  onReviewBoard,
  onOpenNewGameModal,
}) => {
  const { winner, gameMode, aiPlayerColor, turnNumber, capturedPieces, reason } = gameState;

  const isTimeout = Boolean(reason?.toLowerCase().includes("temps écoulé"));
  const isAiWinner = gameMode === "ai" && winner === aiPlayerColor;
  const isHumanWinnerVsAi = gameMode === "ai" && winner !== aiPlayerColor;

  // Trigger sound and confetti fireworks when the overlay mounts or opens
  useEffect(() => {
    if (!isOpen || winner === "draw" || !winner) return;

    // Play triumphant victory sound fanfare
    sound.playVictory();

    // Trigger dual cannon celebratory confetti
    try {
      const colors = ["#D4AF37", "#F59E0B", "#FCD34D", "#FFFFFF", "#78350F", "#E6C280"];

      // First blast
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6, x: 0.5 },
        colors,
        disableForReducedMotion: true,
      });

      // Left cannon salvo
      const timer1 = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.15, y: 0.7 },
          colors,
          disableForReducedMotion: true,
        });
      }, 250);

      // Right cannon salvo
      const timer2 = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.85, y: 0.7 },
          colors,
          disableForReducedMotion: true,
        });
      }, 450);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } catch {
      // Ignore if canvas isn't ready
    }
  }, [isOpen, winner]);

  if (!isOpen || !winner || winner === "draw") return null;

  // Contextual congratulatory texts
  let headline = `Victoire de ${winnerName} !`;
  let congratulation = `Félicitations ${winnerName} ! Vous avez fait preuve d'une vision tactique exceptionnelle sur le grand Fanorona tsivy.`;

  if (isTimeout) {
    headline = `Victoire au temps de ${winnerName} !`;
    congratulation = `Félicitations ${winnerName} ! Votre gestion de la cadence et de la pression temporelle a été déterminante dans cette partie en Mode Vitesse.`;
  } else if (isHumanWinnerVsAi) {
    headline = `Triomphe de ${winnerName} !`;
    congratulation = `Félicitations ${winnerName} ! Vous avez surclassé l'intelligence artificielle grâce à une parfaite anticipation des cascades de capture.`;
  } else if (isAiWinner) {
    headline = `Victoire de l'IA (${winnerName}) !`;
    congratulation = `L'intelligence artificielle a maîtrisé le centre et exécuté une stratégie implacable. Prenez votre revanche dès maintenant !`;
  }

  const winnerColorLabel = winner === "white" ? "Pierres Blanches" : "Pierres Noires";
  const piecesCapturedByWinner =
    winner === "white" ? capturedPieces.white : capturedPieces.black;

  return (
    <div
      id="victory-overlay-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-lg bg-gradient-to-b from-[#1C1814] via-[#15120F] to-[#0E0C0A] border-2 border-[#D4AF37]/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(212,175,55,0.25)] relative overflow-hidden text-center"
      >
        {/* Subtle radial golden background accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -mt-20" />

        {/* Top Trophy Icon with floating animations */}
        <div className="relative mx-auto mb-5 w-20 h-20 sm:w-24 sm:h-24">
          <motion.div
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-full h-full rounded-2xl bg-gradient-to-br from-[#D4AF37] via-[#B8902A] to-[#8C6818] p-0.5 shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center"
          >
            <div className="w-full h-full rounded-2xl bg-[#17130F] flex items-center justify-center border border-[#D4AF37]/40 relative">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-[#F5C542] drop-shadow-[0_2px_10px_rgba(245,197,66,0.6)]" />
              <Crown className="w-5 h-5 text-amber-300 absolute -top-2.5 right-2 filter drop-shadow animate-pulse" />
              <Sparkles className="w-4 h-4 text-white absolute bottom-1.5 left-2 opacity-80" />
            </div>
          </motion.div>
        </div>

        {/* Winner Tag & Speed badge */}
        <div className="flex items-center justify-center gap-2 mb-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm">
            <Award className="w-3.5 h-3.5" />
            {winnerColorLabel}
          </span>
          {isSpeedMode && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Mode Vitesse
            </span>
          )}
        </div>

        {/* Big Winner Name & Congratulations */}
        <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white mb-2 leading-tight">
          {headline}
        </h2>
        <p className="text-sm sm:text-base text-white/80 font-normal leading-relaxed max-w-md mx-auto mb-6 px-2">
          {congratulation}
        </p>

        {/* Reason notice if available */}
        {reason && (
          <div className="mb-6 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white/60 italic max-w-md mx-auto">
            « {reason} »
          </div>
        )}

        {/* Strategic Match Stats Cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-7 p-3 rounded-2xl bg-black/50 border border-white/10 text-center">
          <div className="p-2 rounded-xl bg-white/[0.03]">
            <div className="text-[10px] uppercase font-semibold text-white/40 tracking-wider flex items-center justify-center gap-1 mb-1">
              <Swords className="w-3 h-3 text-[#D4AF37]" />
              Tours
            </div>
            <div className="text-xl font-serif font-bold text-white">
              {turnNumber}
            </div>
            <div className="text-[10px] text-white/40">manœuvres</div>
          </div>

          <div className="p-2 rounded-xl bg-white/[0.03]">
            <div className="text-[10px] uppercase font-semibold text-white/40 tracking-wider flex items-center justify-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              Captures
            </div>
            <div className="text-xl font-serif font-bold text-[#D4AF37]">
              {piecesCapturedByWinner}
            </div>
            <div className="text-[10px] text-white/40">pièces prises</div>
          </div>

          <div className="p-2 rounded-xl bg-white/[0.03]">
            <div className="text-[10px] uppercase font-semibold text-white/40 tracking-wider flex items-center justify-center gap-1 mb-1">
              <Timer className="w-3 h-3 text-[#D4AF37]" />
              Mode
            </div>
            <div className="text-xs font-semibold text-white truncate pt-1">
              {gameMode === "ai" ? "Vs IA" : "Face-à-face"}
            </div>
            <div className="text-[10px] text-white/40">
              {isSpeedMode ? "Cadencé" : "Standard"}
            </div>
          </div>
        </div>

        {/* Action Buttons: Immediate Restart prominently placed */}
        <div className="flex flex-col gap-3">
          <Button
            id="btn-restart-game-immediately"
            variant="primary"
            size="lg"
            onClick={onRestartImmediately}
            icon={<RefreshCw className="w-5 h-5 animate-spin-slow" />}
            className="w-full justify-center text-sm sm:text-base font-bold tracking-wide shadow-lg shadow-[#D4AF37]/30 py-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Recommencer immédiatement
          </Button>

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              id="btn-review-board"
              variant="outline"
              size="md"
              onClick={onReviewBoard}
              icon={<Eye className="w-4 h-4" />}
              className="w-full justify-center text-xs text-white/80 border-white/20 hover:bg-white/10"
            >
              Examiner le plateau
            </Button>

            {onOpenNewGameModal && (
              <Button
                id="btn-new-game-setup"
                variant="ghost"
                size="md"
                onClick={onOpenNewGameModal}
                icon={<Sliders className="w-4 h-4" />}
                className="w-full justify-center text-xs text-white/60 hover:text-white hover:bg-white/10"
              >
                Paramètres du jeu
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
