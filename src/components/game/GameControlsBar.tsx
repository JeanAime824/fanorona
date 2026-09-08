/**
 * @file GameControlsBar.tsx
 * Quick control toolbar for undo, redo, voluntary resignation, and new game trigger.
 */

import { Flag, PlusCircle, Redo2, Trophy, Undo2, Zap } from "lucide-react";
import React from "react";
import { Button } from "../ui/Button";

export interface GameControlsBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResign: () => void;
  onNewGame: () => void;
  isGameOver: boolean;
  speedModeEnabled?: boolean;
  turnTimeLimit?: number;
  onToggleSpeedMode?: () => void;
  onShowVictory?: () => void;
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
}) => {
  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-2.5 p-3 bg-[#141210] border border-[#2E241C] rounded-2xl shadow-xl">
      {/* Primary Actions: New Game & Speed Mode toggle */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={onNewGame}
          icon={<PlusCircle className="w-4 h-4" />}
        >
          Nouvelle partie
        </Button>

        {onToggleSpeedMode && (
          <button
            type="button"
            onClick={onToggleSpeedMode}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              speedModeEnabled
                ? "bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] shadow-sm shadow-[#D4AF37]/10"
                : "bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 border border-white/10"
            }`}
            title={speedModeEnabled ? `Mode Vitesse actif (${turnTimeLimit}s par coup)` : "Activer le Mode Vitesse"}
          >
            <Zap className={`w-3.5 h-3.5 ${speedModeEnabled ? "fill-current text-[#D4AF37]" : ""}`} />
            <span className="hidden sm:inline">
              {speedModeEnabled ? `Vitesse (${turnTimeLimit}s)` : "Vitesse"}
            </span>
          </button>
        )}
      </div>

      {/* Secondary Controls: Undo, Redo, Resign */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onUndo}
          disabled={!canUndo}
          icon={<Undo2 className="w-4 h-4" />}
          title="Annuler le dernier coup (Ctrl+Z)"
        >
          <span className="hidden sm:inline">Annuler</span>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={onRedo}
          disabled={!canRedo}
          icon={<Redo2 className="w-4 h-4" />}
          title="Rétablir le coup (Ctrl+Y)"
        >
          <span className="hidden sm:inline">Rétablir</span>
        </Button>

        {!isGameOver ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onResign}
            icon={<Flag className="w-4 h-4 text-white/40 hover:text-red-400" />}
            title="Déclarer forfait"
          >
            <span className="hidden md:inline">Abandonner</span>
          </Button>
        ) : (
          onShowVictory && (
            <Button
              size="sm"
              variant="outline"
              onClick={onShowVictory}
              icon={<Trophy className="w-4 h-4 text-[#D4AF37]" />}
              className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10"
              title="Afficher les résultats de fin de partie"
            >
              <span className="hidden sm:inline">Résultats</span>
            </Button>
          )
        )}
      </div>
    </div>
  );
};
