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
    <div className="w-full space-y-3">
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

      {/* Players: JOUEUR NOIR and JOUEUR BLANC */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* JOUEUR NOIR Card */}
        <div
          className={`relative p-3.5 sm:p-4 rounded-xl border transition-colors ${
            !isWhite && status === "playing"
              ? "bg-[#181615] border-[#C8A452]/40"
              : "bg-[#141312] border-white/[0.05] opacity-80"
          }`}
        >
          {/* Subtle active line indicator */}
          {!isWhite && status === "playing" && (
            <div className="absolute top-0 left-3 right-3 h-[2px] bg-[#C8A452] rounded-full" />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Natural Charcoal Stone Pip */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2B2926] via-[#1A1817] to-[#100F0E] border border-[#3A3734] shadow-sm flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-white/[0.15]" />
              </div>
              <div>
                <div className="text-[10px] text-[#9E9890] flex items-center gap-1 font-medium tracking-wider uppercase">
                  {gameMode === "ai" && aiPlayerColor === "black" ? (
                    <>
                      <Bot className="w-3 h-3 text-[#C8A452]" /> IA
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-[#9E9890]" /> Joueur Noir
                    </>
                  )}
                </div>
                <div className="text-sm font-serif font-semibold text-[#F5F3EE] flex items-center gap-2">
                  <span>Noir</span>
                  {!isWhite && status === "playing" && (
                    <span className="text-[10px] font-sans font-medium px-1.5 py-0.2 rounded bg-[#C8A452]/15 text-[#C8A452]">
                      Au tour
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl sm:text-2xl font-serif font-semibold text-[#F5F3EE]">
                {pieceCounts.black}
              </div>
              <div className="text-[10px] text-[#9E9890]">
                pièces
              </div>
            </div>
          </div>
        </div>

        {/* JOUEUR BLANC Card */}
        <div
          className={`relative p-3.5 sm:p-4 rounded-xl border transition-colors ${
            isWhite && status === "playing"
              ? "bg-[#181615] border-[#C8A452]/40"
              : "bg-[#141312] border-white/[0.05] opacity-80"
          }`}
        >
          {/* Subtle active line indicator */}
          {isWhite && status === "playing" && (
            <div className="absolute top-0 left-3 right-3 h-[2px] bg-[#C8A452] rounded-full" />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Natural Ivory Stone Pip */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FAF9F5] via-[#EDE8DE] to-[#DAD3C5] border border-[#CCC4B4] shadow-sm flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-black/[0.08]" />
              </div>
              <div>
                <div className="text-[10px] text-[#9E9890] flex items-center gap-1 font-medium tracking-wider uppercase">
                  {gameMode === "ai" && aiPlayerColor === "white" ? (
                    <>
                      <Bot className="w-3 h-3 text-[#C8A452]" /> IA
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-[#9E9890]" /> Joueur Blanc
                    </>
                  )}
                </div>
                <div className="text-sm font-serif font-semibold text-[#F5F3EE] flex items-center gap-2">
                  <span>Blanc</span>
                  {isWhite && status === "playing" && (
                    <span className="text-[10px] font-sans font-medium px-1.5 py-0.2 rounded bg-[#C8A452]/15 text-[#C8A452]">
                      Au tour
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl sm:text-2xl font-serif font-semibold text-[#F5F3EE]">
                {pieceCounts.white}
              </div>
              <div className="text-[10px] text-[#9E9890]">
                pièces
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Bar: Round info, instructions & Optional End Turn button */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#141312] border border-white/[0.04] text-xs">
        <div className="flex items-center gap-2 text-[#9E9890]">
          <span className="font-mono text-[11px]">Tour {turnNumber}</span>
          <span className="text-white/[0.15]">•</span>
          <span className="text-[#F5F3EE]/80">{statusText}</span>
        </div>

        {inChain && status === "playing" && (
          <Button
            size="sm"
            variant="primary"
            onClick={onEndTurn}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Terminer le tour
          </Button>
        )}
      </div>
    </div>
  );
};
