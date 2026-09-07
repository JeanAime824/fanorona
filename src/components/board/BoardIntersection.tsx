/**
 * @file BoardIntersection.tsx
 * Interactive node on the Fanorona board with high-speed input response.
 * Positions pieces and click targets with full touch and keyboard accessibility.
 */

import { AnimatePresence } from "motion/react";
import React from "react";
import { toAlgebraic } from "../../game/board/boardGraph";
import { BoardTheme, Piece, Position } from "../../game/types/gameTypes";
import { sound } from "../../services/audio/soundSynthesizer";
import { getBoardTheme } from "../../services/theme/boardThemes";
import { BOARD_SVG_HEIGHT, BOARD_SVG_WIDTH, getCoordinates } from "./BoardGridSvg";
import { PieceStone } from "./PieceStone";

export interface BoardIntersectionProps {
  position: Position;
  piece: Piece | null;
  isSelected: boolean;
  isTargetable: boolean;
  hasCaptureMove: boolean;
  isInCaptureSequence: boolean;
  isCapturableTarget: boolean;
  isPendingCaptureSide?: "approach" | "withdrawal" | null;
  isPendingDestination?: boolean;
  isPendingOrigin?: boolean;
  theme?: BoardTheme;
  onClick: (pos: Position) => void;
}

export const BoardIntersection: React.FC<BoardIntersectionProps> = React.memo(({
  position,
  piece,
  isSelected,
  isTargetable,
  hasCaptureMove,
  isInCaptureSequence,
  isCapturableTarget,
  isPendingCaptureSide,
  isPendingDestination,
  isPendingOrigin,
  theme,
  onClick,
}) => {
  const themeDef = getBoardTheme(theme);
  const coords = getCoordinates(position);
  const leftPercent = (coords.x / BOARD_SVG_WIDTH) * 100;
  const topPercent = (coords.y / BOARD_SVG_HEIGHT) * 100;

  const algebraic = toAlgebraic(position);
  let ariaDescription = `Intersection ${algebraic}`;
  if (isPendingCaptureSide) {
    ariaDescription += `, cible de capture (${isPendingCaptureSide === "approach" ? "devant" : "derrière"}), cliquer pour chasser ce côté`;
  } else if (piece) {
    ariaDescription += `, pièce ${piece.player === "white" ? "blanche" : "noire"}`;
    if (isSelected || isPendingOrigin) ariaDescription += ", sélectionnée";
  } else if (isTargetable) {
    ariaDescription += hasCaptureMove ? ", destination de capture" : ", destination possible";
  } else {
    ariaDescription += ", vide";
  }

  const isClickable =
    isPendingCaptureSide ||
    isPendingDestination ||
    isPendingOrigin ||
    isTargetable ||
    Boolean(piece);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onClick(position);
  };

  const handlePointerDown = () => {
    // Warm up audio pipeline on user touch/click for instantaneous zero-latency feedback
    sound.warmUp();
  };

  return (
    <button
      type="button"
      id={`intersection-${position.row}-${position.col}`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      aria-label={ariaDescription}
      className={`absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 2xl:w-24 2xl:h-24 flex items-center justify-center rounded-full touch-manipulation select-none focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
        isPendingCaptureSide
          ? "cursor-pointer z-30 scale-105 active:scale-95 transition-transform duration-75"
          : isClickable
          ? "cursor-pointer z-10 active:scale-95 transition-transform duration-75"
          : "cursor-default z-0 pointer-events-none"
      }`}
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
      }}
    >
      {/* Pending Destination Landing Spot Marker */}
      {isPendingDestination && (
        <div className="relative flex items-center justify-center pointer-events-none">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-full border-2 border-dashed ${themeDef.indicators.captureDestinationRing} flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(212,175,55,0.7)]`}>
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded-full ${themeDef.indicators.captureDestinationDot}`} />
          </div>
        </div>
      )}

      {/* Target Destination Indicator */}
      {isTargetable && !isPendingDestination && (
        <div className="relative flex items-center justify-center pointer-events-none">
          {hasCaptureMove ? (
            // Capturing move destination: glowing ring with inner jewel
            <div className={`relative w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-11 lg:h-11 xl:w-13 xl:h-13 rounded-full border-2 ${themeDef.indicators.captureDestinationRing} flex items-center justify-center animate-pulse`}>
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 rounded-full ${themeDef.indicators.captureDestinationDot}`} />
            </div>
          ) : (
            // Non-capturing (paika) destination: soft beacon
            <div className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-full border ${themeDef.indicators.paikaDestinationRing} flex items-center justify-center`}>
              <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${themeDef.indicators.paikaDestinationDot}`} />
            </div>
          )}
        </div>
      )}

      {/* Game Piece with Smooth Exit/Entrance */}
      <AnimatePresence mode="wait">
        {piece && (
          <div
            key={`stone-${piece.id}`}
            className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 pointer-events-none flex items-center justify-center"
          >
            <PieceStone
              player={piece.player}
              isSelected={isSelected || Boolean(isPendingOrigin)}
              isInCaptureSequence={isInCaptureSequence}
              isCapturableTarget={isCapturableTarget || Boolean(isPendingCaptureSide)}
              theme={theme}
            />

            {/* Pending Capture Choice Candidate Floating Indicator */}
            {isPendingCaptureSide && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Pulsing ring aura */}
                <div className={`absolute w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 lg:w-18 lg:h-18 xl:w-22 xl:h-22 rounded-full border-2 ${themeDef.indicators.captureDestinationRing} animate-pulse`} />
                {/* Badge */}
                <div className={`absolute -top-3.5 sm:-top-4 md:-top-5 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md ${themeDef.indicators.choiceBadgeBg} ${themeDef.indicators.choiceBadgeText} text-[9px] sm:text-[10px] md:text-xs font-serif font-bold tracking-tight shadow-[0_2px_8px_rgba(0,0,0,0.9)] flex items-center gap-1 whitespace-nowrap animate-bounce`}>
                  <span>🎯 Chasser</span>
                </div>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </button>
  );
});
