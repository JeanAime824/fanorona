/**
 * @file GameControlsBar.tsx
 * Quick control toolbar for undo, redo, voluntary resignation, and new game trigger.
 */

import { Clock, Flag, Handshake, Redo2, Trophy, Undo2, Zap } from "lucide-react";
import React from "react";
import { Button } from "../ui/Button";

export interface GameControlsBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResign: () => void;
  onNewGame?: () => void;
  isGameOver: boolean;
  speedModeEnabled?: boolean;
  turnTimeLimit?: number;
  onToggleSpeedMode?: () => void;
  onShowVictory?: () => void;
  isMultiplayer?: boolean;
  onOfferDraw?: () => void;
}

export const GameControlsBar: React.FC<GameControlsBarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResign,
  onNewGame,
  isGameOver,
  speedModeEnabled = false,
  turnTimeLimit = 30,
  onToggleSpeedMode,
  onShowVictory,
  isMultiplayer = false,
  onOfferDraw,
}) => {
  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 px-3 py-2.5 bg-[#161514] border border-white/[0.06] rounded-lg">
      {/* Undo / Redo Buttons (Hidden or disabled in multiplayer) */}
      {!isMultiplayer && (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={onUndo}
            disabled={!canUndo}
            icon={<Undo2 className="w-3.5 h-3.5" />}
            title="Annuler le coup (Ctrl+Z)"
          >
            <span className="text-xs">Annuler</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onRedo}
            disabled={!canRedo}
            icon={<Redo2 className="w-3.5 h-3.5" />}
            title="Rétablir le coup (Ctrl+Y)"
          >
            <span className="text-xs">Rétablir</span>
          </Button>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Game Timer Display (if speed mode) */}
      {speedModeEnabled && onToggleSpeedMode && !isMultiplayer && (
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.08]">
          <Clock className="w-3 h-3 text-[#C8A452]" />
          <div className="flex flex-col">
            <div className="text-[9px] text-[#9E9890] font-medium tracking-wider uppercase">
              Temps de jeu
            </div>
            <div className="text-xs font-mono font-semibold text-[#F5F3EE]">
              {String(Math.floor(turnTimeLimit / 60)).padStart(2, "0")}:{String(turnTimeLimit % 60).padStart(2, "0")}
            </div>
          </div>
        </div>
      )}

      {/* Offer Draw (Multiplayer) */}
      {isMultiplayer && !isGameOver && onOfferDraw && (
        <button
          type="button"
          onClick={onOfferDraw}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#C8A452] hover:text-[#E8CA72] hover:bg-[#C8A452]/10 transition-colors flex items-center gap-1.5 cursor-pointer border border-[#C8A452]/20"
          title="Proposer une partie nulle"
        >
          <Handshake className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Proposer nulle</span>
        </button>
      )}

      {/* Resign or Results Button */}
      {!isGameOver ? (
        <button
          type="button"
          onClick={onResign}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9E9890] hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="Déclarer forfait"
        >
          <Flag className="w-3.5 h-3.5 opacity-70" />
          <span className="hidden md:inline">Abandonner</span>
        </button>
      ) : (
        onShowVictory && (
          <Button
            size="sm"
            variant="outline"
            onClick={onShowVictory}
            icon={<Trophy className="w-3.5 h-3.5 text-[#C8A452]" />}
            title="Résultats de la partie"
          >
            <span className="hidden sm:inline">Résultats</span>
          </Button>
        )
      )}
    </div>
  );
};
