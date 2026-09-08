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
  theme,
  pieceTexture,
}) => {
  const isWhite = player === "white";
  const themeDef = getBoardTheme(theme);
  const baseConfig = isWhite ? themeDef.pieces.white : themeDef.pieces.black;

  // Custom textures when explicitly selected
  const pieceConfig = React.useMemo(() => {
    if (pieceTexture === "wooden") {
      return isWhite
        ? {
            name: "Buis Blond Sculpté",
            background:
              "radial-gradient(circle at 35% 28%, #FFF6E5 0%, #ECD8B9 38%, #D4B88E 75%, #B89666 100%)",
            border: "border-[#A48250]",
            innerRing: "border-[#7C5E2D]/45",
            specular: "from-amber-100/90 to-transparent",
            boxShadow:
              "shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_5px_rgba(110,75,30,0.45)]",
            woodRings: true,
          }
        : {
            name: "Palissandre & Ébène",
            background:
              "radial-gradient(circle at 34% 28%, #482C1F 0%, #2E1A11 44%, #1A0D07 80%, #0A0503 100%)",
            border: "border-[#2A150D]",
            innerRing: "border-amber-600/20",
            specular: "from-amber-200/25 to-transparent",
            boxShadow:
              "shadow-[inset_0_2px_3px_rgba(255,255,255,0.22),inset_0_-3px_6px_rgba(0,0,0,0.95)]",
            woodRings: true,
          };
    }

    if (pieceTexture === "stone") {
      return isWhite
        ? {
            name: "Quartz Blanc & Marbre",
            background:
              "radial-gradient(circle at 35% 28%, #FFFFFF 0%, #F8FAFC 42%, #E2E8F0 82%, #CBD5E1 100%)",
            border: "border-[#CBD5E1]",
            innerRing: "border-[#94A3B8]/35",
            specular: "from-white/95 to-transparent",
            boxShadow:
              "shadow-[inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_5px_rgba(148,163,184,0.4)]",
            woodRings: false,
          }
        : {
            name: "Basalte & Obsidienne",
            background:
              "radial-gradient(circle at 35% 28%, #334155 0%, #1E293B 48%, #0F172A 85%, #020617 100%)",
            border: "border-[#334155]",
            innerRing: "border-white/10",
            specular: "from-cyan-100/25 to-transparent",
            boxShadow:
              "shadow-[inset_0_2px_3px_rgba(255,255,255,0.25),inset_0_-3px_6px_rgba(0,0,0,0.95)]",
            woodRings: false,
          };
    }

    return {
      ...baseConfig,
      woodRings: themeDef.category === "woodwork",
    };
  }, [pieceTexture, isWhite, baseConfig, themeDef]);

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
