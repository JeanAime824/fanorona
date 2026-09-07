/**
 * @file FanoronaBoard.tsx
 * Complete responsive Fanorona game board.
 * Combines authentic SVG lattice with interactive pieces, touch targets, and visual feedback.
 */

import { ArrowDownLeft, ArrowUpRight, Crosshair, X } from "lucide-react";
import React, { useMemo } from "react";
import { isSamePosition } from "../../game/board/boardGraph";
import { BoardTheme, GameState, Position } from "../../game/types/gameTypes";
import { PendingAmbiguousMove } from "../../hooks/useFanoronaGame";
import { getBoardTheme } from "../../services/theme/boardThemes";
import { BoardGridSvg } from "./BoardGridSvg";
import { BoardIntersection } from "./BoardIntersection";

export interface FanoronaBoardProps {
  gameState: GameState;
  targetablePositions: Position[];
  pendingChoice?: PendingAmbiguousMove | null;
  theme?: BoardTheme;
  onSelectPosition: (pos: Position) => void;
  onResolveChoice?: (type: "approach" | "withdrawal") => void;
  onCancelChoice?: () => void;
  showCoordinates?: boolean;
}

export const FanoronaBoard: React.FC<FanoronaBoardProps> = ({
  gameState,
  targetablePositions,
  pendingChoice,
  theme,
  onSelectPosition,
  onResolveChoice,
  onCancelChoice,
}) => {
  const themeDef = getBoardTheme(theme);
  const { board, selectedPosition, captureSequence, legalMoves } = gameState;

  // Track candidate capture positions when player is choosing capture side
  const approachCaptureMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!pendingChoice) return map;
    pendingChoice.approachMove.captures.forEach((pos, idx) => {
      map.set(`${pos.row},${pos.col}`, idx);
    });
    return map;
  }, [pendingChoice]);

  const withdrawalCaptureMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!pendingChoice) return map;
    pendingChoice.withdrawalMove.captures.forEach((pos, idx) => {
      map.set(`${pos.row},${pos.col}`, idx);
    });
    return map;
  }, [pendingChoice]);

  // Determine which targetable moves produce captures
  const captureTargets = useMemo(() => {
    const set = new Set<string>();
    const activeFrom = captureSequence
      ? captureSequence.piecePosition
      : selectedPosition;

    if (!activeFrom) return set;

    legalMoves.forEach((m) => {
      if (isSamePosition(m.from, activeFrom) && m.captures.length > 0) {
        set.add(`${m.to.row},${m.to.col}`);
      }
    });
    return set;
  }, [legalMoves, captureSequence, selectedPosition]);

  return (
    <div className="relative w-full mx-auto select-none">
      {/* Interactive Selection Banner: Choosing Which Side to Hunt */}
      {pendingChoice && (
        <div className="mb-3 p-3 sm:p-3.5 rounded-2xl bg-[#141210]/95 border border-[#D4AF37]/50 shadow-[0_12px_32px_rgba(0,0,0,0.85)] backdrop-blur-md flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37]">
              <Crosshair className="w-3.5 h-3.5 animate-spin-slow" />
            </span>
            <div>
              <div className="font-serif font-bold text-[#D4AF37] uppercase tracking-wider text-[11px] sm:text-xs">
                Chasser de quel côté ?
              </div>
              <div className="text-white/60 text-[11px]">
                Cliquez directement sur les pièces cibles du plateau ou choisissez ci-contre :
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onResolveChoice?.("approach")}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37] text-xs font-serif font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer flex items-center gap-2 shadow-[0_2px_8px_rgba(212,175,55,0.25)] hover:scale-105 active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>
                Devant (+{pendingChoice.approachMove.captures.length}{" "}
                {pendingChoice.approachMove.captures.length > 1 ? "pièces" : "pièce"})
              </span>
            </button>
            <button
              type="button"
              onClick={() => onResolveChoice?.("withdrawal")}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37] text-xs font-serif font-bold text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all cursor-pointer flex items-center gap-2 shadow-[0_2px_8px_rgba(212,175,55,0.25)] hover:scale-105 active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>
                Derrière (+{pendingChoice.withdrawalMove.captures.length}{" "}
                {pendingChoice.withdrawalMove.captures.length > 1 ? "pièces" : "pièce"})
              </span>
            </button>
            <button
              type="button"
              onClick={onCancelChoice}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
              title="Annuler"
              aria-label="Annuler"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Board Frame with Selected Theme Finish */}
      <div
        className={`relative w-full rounded-2xl sm:rounded-3xl p-3 sm:p-5 transition-all duration-300 ${themeDef.frameClass}`}
      >
        {/* Playing Field Surface */}
        <div
          className={`relative w-full aspect-[920/440] rounded-xl overflow-hidden transition-all duration-300 ${themeDef.surfaceClass} ${themeDef.innerBevelClass}`}
          style={themeDef.surfaceStyle}
        >
          {/* SVG Lattice Lines & Theme Texture */}
          <BoardGridSvg theme={theme} />

          {/* 45 Interactive Intersection Nodes */}
          <div className="absolute inset-0">
            {board.map((row, r) =>
              row.map((piece, c) => {
                const pos: Position = { row: r, col: c };
                const isSelected = isSamePosition(selectedPosition, pos);
                const isTargetable = targetablePositions.some((tp) =>
                  isSamePosition(tp, pos)
                );
                const hasCapture = captureTargets.has(`${r},${c}`);
                const inChain =
                  captureSequence !== null &&
                  isSamePosition(captureSequence.piecePosition, pos);

                const isApproachCandidate = approachCaptureMap.has(`${r},${c}`);
                const isWithdrawalCandidate = withdrawalCaptureMap.has(`${r},${c}`);
                const isPendingDest = pendingChoice
                  ? isSamePosition(pendingChoice.to, pos)
                  : false;
                const isPendingOrig = pendingChoice
                  ? isSamePosition(pendingChoice.from, pos)
                  : false;

                return (
                  <BoardIntersection
                    key={`cell-${r}-${c}`}
                    position={pos}
                    piece={piece}
                    isSelected={isSelected}
                    isTargetable={isTargetable}
                    hasCaptureMove={hasCapture}
                    isInCaptureSequence={inChain}
                    isCapturableTarget={false}
                    isPendingCaptureSide={
                      isApproachCandidate
                        ? "approach"
                        : isWithdrawalCandidate
                        ? "withdrawal"
                        : null
                    }
                    isPendingDestination={isPendingDest}
                    isPendingOrigin={isPendingOrig}
                    theme={theme}
                    onClick={onSelectPosition}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
