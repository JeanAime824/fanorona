/**
 * @file GameControlsBar.tsx
 * Quick control toolbar for undo, redo, voluntary resignation, and new game trigger.
 */

import { Flag, PlusCircle, Redo2, Undo2 } from "lucide-react";
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
}

export const GameControlsBar: React.FC<GameControlsBarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResign,
  onNewGame,
  isGameOver,
}) => {
  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-2.5 p-3 bg-[#141210] border border-[#2E241C] rounded-2xl shadow-xl">
      {/* Primary Action: New Game */}
      <Button
        size="sm"
        variant="primary"
        onClick={onNewGame}
        icon={<PlusCircle className="w-4 h-4" />}
      >
        Nouvelle partie
      </Button>

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

        {!isGameOver && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onResign}
            icon={<Flag className="w-4 h-4 text-white/40 hover:text-red-400" />}
            title="Déclarer forfait"
          >
            <span className="hidden md:inline">Abandonner</span>
          </Button>
        )}
      </div>
    </div>
  );
};
