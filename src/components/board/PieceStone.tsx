/**
 * @file PieceStone.tsx
 * High-craft tactile stone Fanorona game pieces with spring physics.
 * White pieces: Hand-polished Malagasy white marble / quartz stone.
 * Black pieces: Matte satin volcanic basalt / obsidian stone.
 */

import { motion } from "motion/react";
import React from "react";
import { BoardTheme, Player } from "../../game/types/gameTypes";
import { getBoardTheme } from "../../services/theme/boardThemes";

export interface PieceStoneProps {
  player: Player;
  isSelected?: boolean;
  isInCaptureSequence?: boolean;
  isCapturableTarget?: boolean;
  theme?: BoardTheme;
}

export const PieceStone: React.FC<PieceStoneProps> = ({
  player,
  isSelected = false,
  isInCaptureSequence = false,
  isCapturableTarget = false,
  theme,
}) => {
  const isWhite = player === "white";
  const themeDef = getBoardTheme(theme);
  const pieceConfig = isWhite ? themeDef.pieces.white : themeDef.pieces.black;

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{
        scale: isSelected ? 1.15 : 1,
        y: isSelected ? -5 : 0,
        opacity: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 550,
        damping: 32,
      }}
      className="relative w-full h-full rounded-full select-none"
    >
      {/* Dynamic Physical Contact Shadow under the stone */}
      <motion.div
        animate={{
          scale: isSelected ? 1.25 : 1,
          opacity: isSelected ? 0.85 : 0.65,
          y: isSelected ? 8 : 3,
        }}
        transition={{ type: "spring", stiffness: 550, damping: 32 }}
        className="absolute inset-1 rounded-full bg-black/80 blur-[3px] pointer-events-none -z-10"
      />

      {/* Tactile Selection Ring styled per theme */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{ type: "spring", stiffness: 450, damping: 24 }}
          className={`absolute -inset-1.5 rounded-full border-2 ${themeDef.indicators.selectionRing} ${themeDef.indicators.selectionGlow} pointer-events-none`}
        />
      )}

      {/* Multiple Capture Sequence Active Ring */}
      {isInCaptureSequence && (
        <motion.div
          animate={{ scale: [1.1, 1.25, 1.1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          className={`absolute -inset-2 rounded-full border-2 ${themeDef.indicators.comboRing} pointer-events-none`}
        />
      )}

      {/* Capturable Target Warning Aura */}
      {isCapturableTarget && (
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.95, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
          className="absolute -inset-1.5 rounded-full border-2 border-amber-500/90 shadow-[0_0_12px_rgba(245,158,11,0.7)] pointer-events-none"
        />
      )}

      {/* Physical Stone Body */}
      <div
        className={`relative w-full h-full rounded-full border ${pieceConfig.border} ${pieceConfig.boxShadow} flex items-center justify-center overflow-hidden`}
        style={{
          background: pieceConfig.background,
        }}
      >
        {/* Natural stone specular highlight */}
        <div className={`absolute top-1 left-1.5 w-3/5 h-2/5 rounded-full bg-gradient-to-b ${pieceConfig.specular} blur-[0.4px] pointer-events-none`} />
        {/* Fine concentric carved ring */}
        <div className={`w-[38%] h-[38%] rounded-full border ${pieceConfig.innerRing}`} />
      </div>
    </motion.div>
  );
};
