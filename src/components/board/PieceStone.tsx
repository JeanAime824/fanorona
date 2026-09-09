/**
 * @file PieceStone.tsx
 * High-craft tactile stone Fanorona game pieces with spring physics.
 * White pieces: Hand-polished Malagasy white marble / quartz stone.
 * Black pieces: Matte satin volcanic basalt / obsidian stone.
 */

import { motion } from "motion/react";
import React from "react";
import { BoardTheme, PieceTexture, Player } from "../../game/types/gameTypes";
import { getBoardTheme } from "../../services/theme/boardThemes";

export interface PieceStoneProps {
  player: Player;
  isSelected?: boolean;
  isInCaptureSequence?: boolean;
  isCapturableTarget?: boolean;
  theme?: BoardTheme;
  pieceTexture?: PieceTexture;
}

export const PieceStone: React.FC<PieceStoneProps> = ({
  player,
  isSelected = false,
  isInCaptureSequence = false,
  isCapturableTarget = false,
}) => {
  const isWhite = player === "white";

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{
        scale: isSelected ? 1.08 : 1,
        y: isSelected ? -3 : 0,
        opacity: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
      className="relative w-full h-full rounded-full select-none flex items-center justify-center"
    >
      {/* Soft Contact Shadow */}
      <div
        className={`absolute inset-0.5 rounded-full blur-[2px] pointer-events-none -z-10 transition-all ${
          isSelected
            ? "bg-black/80 translate-y-1.5 scale-105"
            : "bg-black/60 translate-y-1 scale-95"
        }`}
      />

      {/* Selected Piece Ring - Terracotta Clay #C45A3C Accent */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1.16, opacity: 1 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          className="absolute -inset-1 rounded-full border-2 border-[#C45A3C] pointer-events-none"
        />
      )}

      {/* Multiple Capture Continuation Indicator */}
      {isInCaptureSequence && (
        <div className="absolute -inset-1.5 rounded-full border border-[#C8A452]/70 animate-pulse pointer-events-none" />
      )}

      {/* Capturable Target Indication */}
      {isCapturableTarget && (
        <div className="absolute -inset-1 rounded-full border border-amber-400/80 pointer-events-none" />
      )}

      {/* Tactile Stone Body - Natural Matte Finish */}
      <div
        className={`relative w-[86%] h-[86%] rounded-full transition-colors ${
          isWhite
            ? "bg-[#E8DCC3] border border-[#D5C6A7] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_-1px_2px_rgba(0,0,0,0.12)]"
            : "bg-[#29231F] border border-[#3A322C] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.6)]"
        } flex items-center justify-center`}
      >
        {/* Subtle, soft natural luster at the upper crest */}
        <div
          className={`absolute top-[12%] left-[18%] w-[42%] h-[26%] rounded-full blur-[0.6px] pointer-events-none ${
            isWhite
              ? "bg-white/70"
              : "bg-white/[0.12]"
          }`}
        />

        {/* Delicate inner debossed ridge */}
        <div
          className={`w-[45%] h-[45%] rounded-full border pointer-events-none ${
            isWhite ? "border-black/[0.06]" : "border-white/[0.05]"
          }`}
        />
      </div>
    </motion.div>
  );
};
