/**
 * @file FanoronaBoard.tsx
 * Complete responsive Fanorona game board.
 * Combines authentic SVG lattice with interactive pieces, touch targets, and visual feedback.
 */

import { ArrowDownLeft, ArrowUpRight, Crosshair, X } from "lucide-react";
import React, { useMemo } from "react";
import { isSamePosition } from "../../game/board/boardGraph";
import { BoardTheme, GameState, Piece, PieceTexture, Position } from "../../game/types/gameTypes";
import { PendingAmbiguousMove } from "../../hooks/useFanoronaGame";
import { getBoardTheme } from "../../services/theme/boardThemes";
import { BOARD_SVG_HEIGHT, BOARD_SVG_WIDTH, BoardGridSvg, getCoordinates } from "./BoardGridSvg";
import { BoardIntersection } from "./BoardIntersection";
import { PieceStone } from "./PieceStone";

export interface FanoronaBoardProps {
  gameState: GameState;
  targetablePositions: Position[];
  pendingChoice?: PendingAmbiguousMove | null;
  theme?: BoardTheme;
  pieceTexture?: PieceTexture;
  animationsEnabled?: boolean;
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
  pieceTexture,
  animationsEnabled = true,
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

  // Active pieces for smooth positional gliding animations
  const activePieces = useMemo(() => {
    const list: Array<{
      piece: Piece;
      position: Position;
    }> = [];
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const piece = board[r][c];
        if (piece) {
          list.push({ piece, position: { row: r, col: c } });
        }
      }
    }
    return list;
  }, [board]);

  return (
    <div className="relative w-full mx-auto select-none">
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
                    onClick={(clickedPos) => {
                      if (pendingChoice) {
                        if (isApproachCandidate) {
                          onResolveChoice?.("approach");
                          return;
                        }
                        if (isWithdrawalCandidate) {
                          onResolveChoice?.("withdrawal");
                          return;
                        }
                        if (isPendingOrig) {
                          onCancelChoice?.();
                          return;
                        }
                      }
                      onSelectPosition(clickedPos);
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Animated Game Pieces Layer with smooth CSS transitions */}
          <div className="absolute inset-0 pointer-events-none">
            {activePieces.map(({ piece, position }) => {
              const coords = getCoordinates(position);
              const leftPercent = (coords.x / BOARD_SVG_WIDTH) * 100;
              const topPercent = (coords.y / BOARD_SVG_HEIGHT) * 100;
              const isSelected = isSamePosition(selectedPosition, position);
              const inChain =
                captureSequence !== null &&
                isSamePosition(captureSequence.piecePosition, position);
              const isPendingOrig = pendingChoice
                ? isSamePosition(pendingChoice.from, position)
                : false;
              const isApproachCandidate = approachCaptureMap.has(
                `${position.row},${position.col}`
              );
              const isWithdrawalCandidate = withdrawalCaptureMap.has(
                `${position.row},${position.col}`
              );

              return (
                <div
                  key={piece.id}
                  id={`piece-${piece.id}`}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-11 lg:h-11 xl:w-12 xl:h-12 2xl:w-14 2xl:h-14 flex items-center justify-center pointer-events-none ${
                    animationsEnabled
                      ? "transition-[left,top] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      : "transition-none"
                  }`}
                >
                  <PieceStone
                    player={piece.player}
                    isSelected={isSelected || Boolean(isPendingOrig)}
                    isInCaptureSequence={inChain}
                    isCapturableTarget={isApproachCandidate || isWithdrawalCandidate}
                    theme={theme}
                    pieceTexture={pieceTexture}
                  />
                </div>
              );
            })}
          </div>

          {/* Elegant Floating Capture Direction Overlay */}
          {pendingChoice && (
            <div className="absolute inset-0 z-40 bg-black/65 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
              <div className="w-full max-w-md bg-[#181615] border border-[#C8A452]/40 rounded-2xl shadow-2xl p-4 sm:p-5 text-center space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2 text-xs font-serif font-semibold text-[#C8A452] uppercase tracking-wider">
                    <Crosshair className="w-4 h-4 text-[#C8A452]" />
                    <span>Sens de la capture</span>
                  </div>
                  <p className="text-xs text-[#9E9890] max-w-xs mx-auto leading-relaxed">
                    Ce coup permet deux modes de capture. Choisissez la ligne d'adversaires à capturer :
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Option 1: Tomboky (Approche) */}
                  <button
                    type="button"
                    onClick={() => onResolveChoice?.("approach")}
                    className="group p-3 rounded-xl bg-[#141312] hover:bg-[#1E1C1A] border border-[#C8A452]/30 hover:border-[#C8A452] transition-all text-left cursor-pointer flex flex-col justify-between gap-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#C8A452]/15 text-[#C8A452] flex items-center justify-center text-xs">
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                        <span className="font-serif font-bold text-xs sm:text-sm text-[#F5F3EE]">
                          Tomboky
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#C8A452]/20 text-[#C8A452]">
                        +{pendingChoice.approachMove.captures.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#9E9890] leading-snug">
                      Capture par <strong className="text-[#F5F3EE]">approche</strong> (vers l'avant).
                    </div>
                  </button>

                  {/* Option 2: Faly (Retrait) */}
                  <button
                    type="button"
                    onClick={() => onResolveChoice?.("withdrawal")}
                    className="group p-3 rounded-xl bg-[#141312] hover:bg-[#1E1C1A] border border-[#D99B43]/30 hover:border-[#D99B43] transition-all text-left cursor-pointer flex flex-col justify-between gap-2.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#D99B43]/15 text-[#D99B43] flex items-center justify-center text-xs">
                          <ArrowDownLeft className="w-3 h-3" />
                        </span>
                        <span className="font-serif font-bold text-xs sm:text-sm text-[#F5F3EE]">
                          Faly
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#D99B43]/20 text-[#D99B43]">
                        +{pendingChoice.withdrawalMove.captures.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#9E9890] leading-snug">
                      Capture par <strong className="text-[#F5F3EE]">retrait</strong> (vers l'arrière).
                    </div>
                  </button>
                </div>

                {/* Cancel Move Button */}
                <div className="flex items-center justify-center pt-0.5">
                  <button
                    type="button"
                    onClick={onCancelChoice}
                    className="px-3 py-1 rounded-lg text-[11px] text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="w-3 h-3" />
                    <span>Annuler le déplacement</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
