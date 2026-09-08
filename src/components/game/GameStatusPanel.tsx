/**
 * @file GameStatusPanel.tsx
 * Displays active player, remaining pieces, game progress, and quick action buttons.
 * Styled with an authentic board game club aesthetic.
 */

import { Bot, CheckCircle2, ChevronRight, Clock, User } from "lucide-react";
import React from "react";
import { countPieces } from "../../game/board/initialBoard";
import { GameState } from "../../game/types/gameTypes";
import { formatDifficulty, getStatusInstruction } from "../../utils/formatters";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { TurnTimerBar } from "./TurnTimerBar";

export interface GameStatusPanelProps {
  gameState: GameState;
  isAiThinking: boolean;
  onEndTurn: () => void;
  speedModeEnabled?: boolean;
  turnTimeLimit?: number;
  timeRemaining?: number;
  onToggleSpeedMode?: () => void;
  onSetTurnTimeLimit?: (seconds: number) => void;
}

export const GameStatusPanel: React.FC<GameStatusPanelProps> = ({
  gameState,
  isAiThinking,
  onEndTurn,
  speedModeEnabled = false,
  turnTimeLimit = 30,
  timeRemaining = 30,
  onToggleSpeedMode,
  onSetTurnTimeLimit,
}) => {
  const {
    currentPlayer,
    status,
    winner,
    gameMode,
    difficulty,
    aiPlayerColor,
    captureSequence,
    mandatoryCaptureActive,
    turnNumber,
  } = gameState;

  const pieceCounts = countPieces(gameState.board);
  const isWhite = currentPlayer === "white";
  const inChain = captureSequence !== null;

  // Captured stones differential
  const whiteCaptured = 22 - pieceCounts.white;
  const blackCaptured = 22 - pieceCounts.black;
  const pieceDiff = pieceCounts.white - pieceCounts.black;

  const statusText = getStatusInstruction(
    status,
    winner,
    currentPlayer,
    isAiThinking,
    inChain,
    mandatoryCaptureActive
  );

  return (
    <div className="w-full bg-[#141210] border border-[#2E241C] rounded-2xl p-4 sm:p-5 shadow-2xl shadow-black/80 ring-1 ring-white/5 space-y-4">
      {/* Turn Countdown Timer / Speed Mode Bar (Configurable directly in Game View) */}
      {onToggleSpeedMode && onSetTurnTimeLimit && (
        <TurnTimerBar
          speedModeEnabled={speedModeEnabled}
          turnTimeLimit={turnTimeLimit}
          timeRemaining={timeRemaining}
          activePlayer={currentPlayer}
          isGameOver={status === "game_over"}
          onToggleSpeedMode={onToggleSpeedMode}
          onSetTurnTimeLimit={onSetTurnTimeLimit}
        />
      )}

      {/* Players & Pieces with Tactile Miniature Stones and Live Timer Badges */}
      <div className="grid grid-cols-2 gap-3">
        {/* White Player Card */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${
            isWhite && status === "playing"
              ? "bg-[#1E1914] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-[#D4AF37]/50"
              : "bg-[#100D0A] border-white/5 opacity-75"
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Marble Mini Stone */}
            <div className="w-7 h-7 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.9)] border border-[#E8E8E0] bg-gradient-to-br from-white via-[#FAF8F2] to-[#D5D0C0] flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full border border-[#B0B0A8]/40" />
            </div>
            <div>
              <div className="text-[11px] text-white/50 flex items-center gap-1 font-medium">
                {gameMode === "ai" && aiPlayerColor === "white" ? (
                  <>
                    <Bot className="w-3 h-3 text-[#D4AF37]" /> IA
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 text-white/60" /> Joueur 1
                  </>
                )}
              </div>
              <div className="text-sm font-serif font-bold text-[#EFEBE4] flex items-center gap-1.5 flex-wrap">
                <span>Blancs</span>
                {pieceDiff > 0 && (
                  <span className="text-[10px] font-mono text-[#D4AF37]">
                    +{pieceDiff}
                  </span>
                )}
                {speedModeEnabled && isWhite && status === "playing" && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      timeRemaining <= 5
                        ? "bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse"
                        : timeRemaining <= 10
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40"
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    {timeRemaining}s
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-serif font-bold text-[#D4AF37]">
              {pieceCounts.white}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-white/40 font-medium">
              capturés: {whiteCaptured}
            </div>
          </div>
        </div>

        {/* Black Player Card */}
        <div
          className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between ${
            !isWhite && status === "playing"
              ? "bg-[#1E1914] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-[#D4AF37]/50"
              : "bg-[#100D0A] border-white/5 opacity-75"
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Obsidian Mini Stone */}
            <div className="w-7 h-7 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.95),inset_0_1px_2px_rgba(255,255,255,0.2)] border border-[#33302C] bg-gradient-to-br from-[#38332C] via-[#201D19] to-[#0A0908] flex items-center justify-center shrink-0">
              <div className="w-2 h-2 rounded-full border border-white/10" />
            </div>
            <div>
              <div className="text-[11px] text-white/50 flex items-center gap-1 font-medium">
                {gameMode === "ai" && aiPlayerColor === "black" ? (
                  <>
                    <Bot className="w-3 h-3 text-[#D4AF37]" /> IA
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3 text-white/60" /> Joueur 2
                  </>
                )}
              </div>
              <div className="text-sm font-serif font-bold text-[#EFEBE4] flex items-center gap-1.5 flex-wrap">
                <span>Noirs</span>
                {pieceDiff < 0 && (
                  <span className="text-[10px] font-mono text-[#D4AF37]">
                    +{-pieceDiff}
                  </span>
                )}
                {speedModeEnabled && !isWhite && status === "playing" && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      timeRemaining <= 5
                        ? "bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse"
                        : timeRemaining <= 10
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40"
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    {timeRemaining}s
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-serif font-bold text-[#D4AF37]">
              {pieceCounts.black}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-white/40 font-medium">
              capturés: {blackCaptured}
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: Badges & Status instructions */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="neutral" size="sm">
            Tour {turnNumber}
          </Badge>
          {gameMode === "ai" && (
            <Badge variant="primary" size="sm">
              IA {formatDifficulty(difficulty)}
            </Badge>
          )}
          {mandatoryCaptureActive && !inChain && (
            <Badge variant="warning" size="sm">
              Capture requise
            </Badge>
          )}
          {inChain && (
            <Badge variant="success" size="sm">
              Séquence : +{captureSequence.capturesCount} capture(s)
            </Badge>
          )}
        </div>

        {/* Voluntary End Turn button if in multiple capture chain */}
        {inChain && status === "playing" && (
          <Button
            size="sm"
            variant="primary"
            onClick={onEndTurn}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            Terminer le tour
          </Button>
        )}
      </div>

      {/* Instruction text banner */}
      <div className="p-3 rounded-xl bg-[#1A1612] border border-[#2E241C] text-xs text-white/80 flex items-center gap-2.5">
        <ChevronRight className="w-4 h-4 text-[#D4AF37] shrink-0" />
        <span className="leading-snug">{statusText}</span>
      </div>
    </div>
  );
};
