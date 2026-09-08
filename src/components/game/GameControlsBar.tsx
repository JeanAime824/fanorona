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
    <div className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#161514] border border-white/[0.06] rounded-xl">
      {/* Primary Action: + Nouvelle partie & Speed mode secondary toggle */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          onClick={onNewGame}
          icon={<PlusCircle className="w-3.5 h-3.5" />}
        >
          Nouvelle partie
        </Button>

        {onToggleSpeedMode && (
          <button
            type="button"
            onClick={onToggleSpeedMode}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              speedModeEnabled
                ? "bg-[#C8A452]/15 text-[#C8A452] border border-[#C8A452]/30"
                : "text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04] border border-transparent"
            }`}
            title={speedModeEnabled ? `Mode Vitesse actif (${turnTimeLimit}s)` : "Activer le chronomètre"}
          >
            <Zap className={`w-3 h-3 ${speedModeEnabled ? "text-[#C8A452]" : "text-[#9E9890]"}`} />
            <span className="hidden sm:inline">
              {speedModeEnabled ? `${turnTimeLimit}s` : "Vitesse"}
            </span>
          </button>
        )}
      </div>

      {/* Secondary Actions: Undo, Redo, and Resign */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onUndo}
          disabled={!canUndo}
          icon={<Undo2 className="w-3.5 h-3.5" />}
          title="Annuler le coup (Ctrl+Z)"
        >
          <span className="hidden sm:inline">Annuler</span>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={onRedo}
          disabled={!canRedo}
          icon={<Redo2 className="w-3.5 h-3.5" />}
          title="Rétablir le coup (Ctrl+Y)"
        >
          <span className="hidden sm:inline">Rétablir</span>
        </Button>

        {!isGameOver ? (
          <button
            type="button"
            onClick={onResign}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9E9890] hover:text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer ml-1"
            title="Déclarer forfait"
          >
            <Flag className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
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
    </div>
  );
};
