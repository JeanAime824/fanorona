/**
 * @file BoardGridSvg.tsx
 * Pure SVG rendering of the authentic 9x5 Fanorona geometric board lattice.
 * Renders all horizontal, vertical, and alternating diagonal lines.
 */

import React, { useMemo } from "react";
import { areNeighbors, BOARD_COLS, BOARD_ROWS, hasDiagonalConnections } from "../../game/board/boardGraph";
import { BoardTheme, Position } from "../../game/types/gameTypes";
import { getBoardTheme } from "../../services/theme/boardThemes";

export const BOARD_SVG_WIDTH = 920;
export const BOARD_SVG_HEIGHT = 440;
export const MARGIN_X = 60;
export const MARGIN_Y = 40;
export const CELL_WIDTH = (BOARD_SVG_WIDTH - 2 * MARGIN_X) / (BOARD_COLS - 1); // 100
export const CELL_HEIGHT = (BOARD_SVG_HEIGHT - 2 * MARGIN_Y) / (BOARD_ROWS - 1); // 90

export function getCoordinates(pos: Position): { x: number; y: number } {
  return {
    x: MARGIN_X + pos.col * CELL_WIDTH,
    y: MARGIN_Y + pos.row * CELL_HEIGHT,
  };
}

export interface BoardGridSvgProps {
  theme?: BoardTheme;
}

export const BoardGridSvg: React.FC<BoardGridSvgProps> = ({ theme }) => {
  const themeDef = getBoardTheme(theme);
  const isGoldGradient = theme === "luxury_wood" || theme === "malagasy_wood";
  // Precompute diagonal line segments between strong intersections
  const diagonalSegments = useMemo(() => {
    const diagonals: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      key: string;
    }> = [];

    for (let r1 = 0; r1 < BOARD_ROWS - 1; r1++) {
      for (let c1 = 0; c1 < BOARD_COLS; c1++) {
        const p1: Position = { row: r1, col: c1 };
        if (!hasDiagonalConnections(p1)) continue;

        const coord1 = getCoordinates(p1);

        // Down-Left diagonal
        if (c1 > 0) {
          const coord2 = getCoordinates({ row: r1 + 1, col: c1 - 1 });
          diagonals.push({
            x1: coord1.x,
            y1: coord1.y,
            x2: coord2.x,
            y2: coord2.y,
            key: `diag-${r1},${c1}-${r1 + 1},${c1 - 1}`,
          });
        }

        // Down-Right diagonal
        if (c1 < BOARD_COLS - 1) {
          const coord2 = getCoordinates({ row: r1 + 1, col: c1 + 1 });
          diagonals.push({
            x1: coord1.x,
            y1: coord1.y,
            x2: coord2.x,
            y2: coord2.y,
            key: `diag-${r1},${c1}-${r1 + 1},${c1 + 1}`,
          });
        }
      }
    }
    return diagonals;
  }, []);

  const colLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const rowNumbers = ["5", "4", "3", "2", "1"];

  const minX = MARGIN_X;
  const maxX = MARGIN_X + (BOARD_COLS - 1) * CELL_WIDTH;
  const minY = MARGIN_Y;
  const maxY = MARGIN_Y + (BOARD_ROWS - 1) * CELL_HEIGHT;

  return (
    <svg
      viewBox={`0 0 ${BOARD_SVG_WIDTH} ${BOARD_SVG_HEIGHT}`}
      className="w-full h-full select-none pointer-events-none"
    >
      <defs>
        {/* Authentic Wood Micrograin & Fiber Pattern */}
        <pattern
          id="svgWoodGrain"
          width="180"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          {/* Subtle natural wood fibers */}
          <path
            d="M0,15 Q45,12 90,16 T180,14 M0,42 Q50,45 100,41 T180,44 M0,75 Q35,71 90,76 T180,73 M0,105 Q60,108 110,104 T180,106"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M0,28 Q70,31 120,27 T180,30 M0,60 Q40,58 90,62 T180,59 M0,90 Q55,93 110,89 T180,92"
            stroke="rgba(212,175,55,0.06)"
            strokeWidth="0.8"
            fill="none"
          />
        </pattern>

        {/* Deep incised groove shadow for hand-carved look */}
        <filter id="woodCarve" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.9" />
          <feDropShadow dx="0" dy="-0.5" stdDeviation="0.5" floodColor="rgba(255,255,255,0.08)" floodOpacity="1" />
        </filter>

        {/*
          Regal Gold linear gradient for lattice lines.
          CRITICAL: Uses gradientUnits="userSpaceOnUse" so that pure horizontal lines (height=0)
          and pure vertical lines (width=0) do NOT produce degenerate bounding boxes and remain
          fully visible across all browsers.
        */}
        <linearGradient
          id="goldGridGrad"
          gradientUnits="userSpaceOnUse"
          x1={minX}
          y1={minY}
          x2={maxX}
          y2={maxY}
        >
          <stop offset="0%" stopColor="#C49B30" />
          <stop offset="25%" stopColor="#E6CF78" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="75%" stopColor="#E6CF78" />
          <stop offset="100%" stopColor="#C49B30" />
        </linearGradient>
      </defs>

      {/* SVG Wood Micrograin Overlay */}
      {themeDef.grid.hasWoodGrainPattern && (
        <rect width="100%" height="100%" fill="url(#svgWoodGrain)" opacity="0.8" />
      )}

      {/* Outer board inlay frame with beveled border */}
      <rect
        x={MARGIN_X - 16}
        y={MARGIN_Y - 16}
        width={BOARD_SVG_WIDTH - 2 * MARGIN_X + 32}
        height={BOARD_SVG_HEIGHT - 2 * MARGIN_Y + 32}
        rx="10"
        fill="none"
        stroke={themeDef.grid.outerFrameStroke}
        strokeWidth="1.8"
        opacity="0.45"
      />
      <rect
        x={MARGIN_X - 20}
        y={MARGIN_Y - 20}
        width={BOARD_SVG_WIDTH - 2 * MARGIN_X + 40}
        height={BOARD_SVG_HEIGHT - 2 * MARGIN_Y + 40}
        rx="14"
        fill="none"
        stroke="#000000"
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Corner Artisan Accents */}
      {themeDef.grid.hasCornerAccents &&
        [
          { cx: MARGIN_X - 16, cy: MARGIN_Y - 16 },
          { cx: BOARD_SVG_WIDTH - MARGIN_X + 16, cy: MARGIN_Y - 16 },
          { cx: MARGIN_X - 16, cy: BOARD_SVG_HEIGHT - MARGIN_Y + 16 },
          { cx: BOARD_SVG_WIDTH - MARGIN_X + 16, cy: BOARD_SVG_HEIGHT - MARGIN_Y + 16 },
        ].map((corner, idx) => (
          <g key={`corner-accent-${idx}`}>
            <circle cx={corner.cx} cy={corner.cy} r="4" fill={themeDef.grid.cornerStudColor || "#D4AF37"} opacity="0.6" />
            <circle cx={corner.cx} cy={corner.cy} r="1.5" fill="#1A1008" />
          </g>
        ))}

      {/* Board Lattice Lines Group */}
      <g filter={theme === "modern_minimal" ? undefined : "url(#woodCarve)"}>
        {/* 1. Full Horizontal Lines (5 continuous lines from col 0 to col 8) */}
        {Array.from({ length: BOARD_ROWS }).map((_, r) => {
          const y = MARGIN_Y + r * CELL_HEIGHT;
          return (
            <line
              key={`h-line-${r}`}
              x1={minX}
              y1={y}
              x2={maxX}
              y2={y}
              stroke={isGoldGradient ? "url(#goldGridGrad)" : themeDef.grid.lineStroke}
              strokeWidth={themeDef.grid.lineWidth}
              strokeLinecap="round"
              opacity="0.9"
            />
          );
        })}

        {/* 2. Full Vertical Lines (9 continuous lines from row 0 to row 4) */}
        {Array.from({ length: BOARD_COLS }).map((_, c) => {
          const x = MARGIN_X + c * CELL_WIDTH;
          return (
            <line
              key={`v-line-${c}`}
              x1={x}
              y1={minY}
              x2={x}
              y2={maxY}
              stroke={isGoldGradient ? "url(#goldGridGrad)" : themeDef.grid.lineStroke}
              strokeWidth={themeDef.grid.lineWidth}
              strokeLinecap="round"
              opacity="0.9"
            />
          );
        })}

        {/* 3. Diagonal Lattice Lines connecting alternating strong intersections */}
        {diagonalSegments.map((seg) => (
          <line
            key={seg.key}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={isGoldGradient ? "url(#goldGridGrad)" : themeDef.grid.diagStroke}
            strokeWidth={themeDef.grid.diagWidth}
            strokeLinecap="round"
            opacity="0.75"
          />
        ))}
      </g>

      {/* Intersection Node Marks */}
      {Array.from({ length: BOARD_ROWS }).map((_, r) =>
        Array.from({ length: BOARD_COLS }).map((_, c) => {
          const coords = getCoordinates({ row: r, col: c });
          const isCenter = r === 2 && c === 4;
          const isStrong = hasDiagonalConnections({ row: r, col: c });

          return (
            <g key={`node-${r}-${c}`}>
              {/* Subtle decorative ring for strong intersections */}
              {isStrong && (
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="7"
                  fill="none"
                  stroke={themeDef.grid.dotFill}
                  strokeWidth="1"
                  opacity="0.3"
                />
              )}
              {/* Center point distinctive emblem */}
              {isCenter && (
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r="12"
                  fill="none"
                  stroke={themeDef.grid.dotFill}
                  strokeWidth="1.5"
                  strokeDasharray="3,3"
                  opacity="0.8"
                />
              )}
              {/* Node Center Dot */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={isCenter ? themeDef.grid.dotRadius : Math.max(1.8, themeDef.grid.dotRadius - 1)}
                fill={themeDef.grid.dotFill}
              />
            </g>
          );
        })
      )}

      {/* Coordinate Labels */}
      {/* Columns: A-I */}
      {colLetters.map((letter, c) => {
        const x = MARGIN_X + c * CELL_WIDTH;
        return (
          <React.Fragment key={`col-label-${c}`}>
            <text
              x={x}
              y={MARGIN_Y - 24}
              textAnchor="middle"
              fill={themeDef.grid.coordinateColor}
              className="text-[12px] font-sans font-bold select-none tracking-widest opacity-80"
            >
              {letter}
            </text>
            <text
              x={x}
              y={BOARD_SVG_HEIGHT - MARGIN_Y + 30}
              textAnchor="middle"
              fill={themeDef.grid.coordinateColor}
              className="text-[12px] font-sans font-bold select-none tracking-widest opacity-80"
            >
              {letter}
            </text>
          </React.Fragment>
        );
      })}

      {/* Rows: 1-5 */}
      {rowNumbers.map((num, r) => {
        const y = MARGIN_Y + r * CELL_HEIGHT + 4;
        return (
          <React.Fragment key={`row-label-${r}`}>
            <text
              x={MARGIN_X - 30}
              y={y}
              textAnchor="middle"
              fill={themeDef.grid.coordinateColor}
              className="text-[12px] font-sans font-bold select-none tracking-widest opacity-80"
            >
              {num}
            </text>
            <text
              x={BOARD_SVG_WIDTH - MARGIN_X + 30}
              y={y}
              textAnchor="middle"
              fill={themeDef.grid.coordinateColor}
              className="text-[12px] font-sans font-bold select-none tracking-widest opacity-80"
            >
              {num}
            </text>
          </React.Fragment>
        );
      })}
    </svg>
  );
};
