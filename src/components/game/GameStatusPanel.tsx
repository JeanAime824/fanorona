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
    <div className="w-full space-y-2.5">
      {/* Speed Mode Bar if active */}
      {speedModeEnabled && onToggleSpeedMode && onSetTurnTimeLimit && (
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

      {/* Players: Two compact cards side by side */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* JOUEUR NOIR Card */}
        <div
          className={`relative px-3 py-2.5 rounded-lg border transition-colors ${
            !isWhite && status === "playing"
              ? "bg-[#181615] border-[#C8A452]/40 ring-1 ring-[#C8A452]/20"
              : "bg-[#141312] border-white/[0.05] opacity-75"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Natural Charcoal Stone Pip */}
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#2B2926] via-[#1A1817] to-[#100F0E] border border-[#3A3734] shadow-sm flex items-center justify-center shrink-0">
                <div className="w-1 h-1 rounded-full bg-white/[0.15]" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-[#9E9890] font-medium tracking-wider uppercase">
                  {gameMode === "ai" && aiPlayerColor === "black" ? "IA" : "NOIR"}
                </div>
                <div className="text-xs font-serif font-semibold text-[#F5F3EE]">
                  {gameMode === "ai" && aiPlayerColor === "black" ? "IA" : "Noir"}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-lg font-serif font-semibold text-[#F5F3EE]">
                {pieceCounts.black}
              </div>
              <div className="text-[9px] text-[#9E9890]">
                pièces
              </div>
            </div>
          </div>

          {/* Active indicator */}
          {!isWhite && status === "playing" && (
            <div className="absolute top-1/2 -right-1.5 w-2.5 h-2.5 rounded-full bg-[#C8A452] shadow-lg shadow-[#C8A452]/40 transform -translate-y-1/2" />
          )}
        </div>

        {/* JOUEUR BLANC Card */}
        <div
          className={`relative px-3 py-2.5 rounded-lg border transition-colors ${
            isWhite && status === "playing"
              ? "bg-[#181615] border-[#C8A452]/40 ring-1 ring-[#C8A452]/20"
              : "bg-[#141312] border-white/[0.05] opacity-75"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Natural Ivory Stone Pip */}
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#FAF9F5] via-[#EDE8DE] to-[#DAD3C5] border border-[#CCC4B4] shadow-sm flex items-center justify-center shrink-0">
                <div className="w-1 h-1 rounded-full bg-black/[0.08]" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-[#9E9890] font-medium tracking-wider uppercase">
                  {gameMode === "ai" && aiPlayerColor === "white" ? "IA" : "BLANC"}
                </div>
                <div className="text-xs font-serif font-semibold text-[#F5F3EE]">
                  {gameMode === "ai" && aiPlayerColor === "white" ? "IA" : "Blanc"}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-lg font-serif font-semibold text-[#F5F3EE]">
                {pieceCounts.white}
              </div>
              <div className="text-[9px] text-[#9E9890]">
                pièces
              </div>
            </div>
          </div>

          {/* Active indicator */}
          {isWhite && status === "playing" && (
            <div className="absolute top-1/2 -right-1.5 w-2.5 h-2.5 rounded-full bg-[#C8A452] shadow-lg shadow-[#C8A452]/40 transform -translate-y-1/2" />
          )}
        </div>
      </div>

      {/* Status Bar: Round info & instructions */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#141312] border border-white/[0.04] text-xs">
        <div className="flex items-center gap-2 text-[#9E9890]">
          <span className="font-mono text-[10px] font-semibold">Tour {turnNumber}</span>
          <span className="text-white/[0.15]">•</span>
          <span className="text-[#F5F3EE]/75 text-[11px]">{statusText}</span>
        </div>

        {inChain && status === "playing" && (
          <Button
            size="sm"
            variant="primary"
            onClick={onEndTurn}
            icon={<CheckCircle2 className="w-3 h-3" />}
          >
            Terminer
          </Button>
        )}
      </div>
    </div>
  );
};
