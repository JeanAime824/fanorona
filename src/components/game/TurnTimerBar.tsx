/**
 * @file TurnTimerBar.tsx
 * Configurable countdown timer widget for player turns in the game view.
 * Provides Speed Mode blitz cadence, configurable time limits, animated progress bar,
 * and high-visibility urgency cues.
 */

import { AlertTriangle, Clock, Flame, Sliders, Zap } from "lucide-react";
import React, { useState } from "react";
import { Player } from "../../game/types/gameTypes";

export interface TurnTimerBarProps {
  speedModeEnabled: boolean;
  turnTimeLimit: number;
  timeRemaining: number;
  activePlayer: Player;
  isGameOver: boolean;
  onToggleSpeedMode: () => void;
  onSetTurnTimeLimit: (seconds: number) => void;
}

export const TIME_LIMIT_OPTIONS = [
  { seconds: 10, label: "10s", name: "Blitz Éclair" },
  { seconds: 15, label: "15s", name: "Rapide" },
  { seconds: 30, label: "30s", name: "Standard" },
  { seconds: 45, label: "45s", name: "Modéré" },
  { seconds: 60, label: "60s", name: "Tranquille" },
] as const;

export const TurnTimerBar: React.FC<TurnTimerBarProps> = ({
  speedModeEnabled,
  turnTimeLimit,
  timeRemaining,
  activePlayer,
  isGameOver,
  onToggleSpeedMode,
  onSetTurnTimeLimit,
}) => {
  const [showConfig, setShowConfig] = useState(false);

  // Percentage for the bar
  const safeLimit = Math.max(1, turnTimeLimit || 30);
  const percentage = Math.min(100, Math.max(0, (timeRemaining / safeLimit) * 100));

  const isUrgent = timeRemaining <= 5 && !isGameOver && speedModeEnabled;
  const isWarning = timeRemaining <= 10 && timeRemaining > 5 && !isGameOver && speedModeEnabled;

  return (
    <div
      className={`rounded-xl border transition-all duration-300 p-3 relative overflow-hidden ${
        !speedModeEnabled
          ? "bg-[#121110] border-white/5 text-white/60"
          : isUrgent
          ? "bg-[#251012] border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-rose-500/60"
          : isWarning
          ? "bg-[#1F1710] border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          : "bg-[#181512] border-[#4A3B2C]/70 shadow-md"
      }`}
    >
      {/* Background glow when urgent */}
      {isUrgent && (
        <div className="absolute inset-0 bg-rose-500/10 pointer-events-none animate-pulse" />
      )}

      {/* Top row: Mode Title, Current Time Limit, Quick Config Toggle & On/Off */}
      <div className="flex flex-wrap items-center justify-between gap-2 z-10 relative">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
              speedModeEnabled
                ? isUrgent
                  ? "bg-rose-500 text-white animate-bounce"
                  : "bg-[#D4AF37] text-black"
                : "bg-white/10 text-white/50"
            }`}
          >
            {isUrgent ? (
              <Flame className="w-4 h-4" />
            ) : speedModeEnabled ? (
              <Zap className="w-4 h-4 fill-current" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="text-xs font-serif font-bold text-white flex items-center gap-1.5">
              <span>Mode Vitesse</span>
              {speedModeEnabled && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                    isUrgent
                      ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                      : "bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30"
                  }`}
                >
                  {turnTimeLimit}s / coup
                </span>
              )}
            </div>
            <div className="text-[10px] text-white/40">
              {speedModeEnabled
                ? isGameOver
                  ? "Partie terminée"
                  : `Tour des ${activePlayer === "white" ? "Blancs" : "Noirs"}`
                : "Cadence libre (temps illimité)"}
            </div>
          </div>
        </div>

        {/* Right controls: Config Pill & Enable/Disable Button */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              showConfig
                ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]"
                : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
            }`}
            title="Configurer la durée du chronomètre"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-medium">Cadence</span>
          </button>

          <button
            type="button"
            onClick={onToggleSpeedMode}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              speedModeEnabled
                ? "bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black shadow-sm font-bold hover:brightness-110"
                : "bg-white/10 hover:bg-white/15 text-white/80 border border-white/10"
            }`}
          >
            <Zap className={`w-3 h-3 ${speedModeEnabled ? "fill-current" : ""}`} />
            <span>{speedModeEnabled ? "Actif" : "Activer"}</span>
          </button>
        </div>
      </div>

      {/* Config Collapsible Drawer (Direct configuration in the game view) */}
      {showConfig && (
        <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-10 relative">
          <div className="text-[11px] text-white/60 font-medium">
            Durée du chronomètre par coup :
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {TIME_LIMIT_OPTIONS.map((opt) => (
              <button
                key={opt.seconds}
                type="button"
                onClick={() => {
                  onSetTurnTimeLimit(opt.seconds);
                  if (!speedModeEnabled) {
                    onToggleSpeedMode();
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  turnTimeLimit === opt.seconds && speedModeEnabled
                    ? "bg-[#D4AF37] text-black shadow-sm scale-105"
                    : "bg-white/5 hover:bg-white/15 text-white/70 border border-white/10"
                }`}
                title={opt.name}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Countdown Progress & Display */}
      {speedModeEnabled && (
        <div className="mt-3 space-y-1.5 z-10 relative">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Clock
                className={`w-3.5 h-3.5 ${
                  isUrgent
                    ? "text-rose-400 animate-spin"
                    : isWarning
                    ? "text-amber-400"
                    : "text-[#D4AF37]"
                }`}
              />
              <span
                className={`font-mono font-bold text-sm tracking-tight ${
                  isUrgent
                    ? "text-rose-400 text-base animate-pulse"
                    : isWarning
                    ? "text-amber-400"
                    : "text-white"
                }`}
              >
                {timeRemaining}s
              </span>
              <span className="text-[10px] text-white/40">/ {turnTimeLimit}s</span>
            </div>

            <div className="text-[10px] text-right">
              {isUrgent ? (
                <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3" />
                  Urgence ! Jouez vite !
                </span>
              ) : isWarning ? (
                <span className="text-amber-400 font-medium">Temps limité</span>
              ) : (
                <span className="text-white/40">Chronomètre par coup</span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-black/60 border border-white/5 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isUrgent
                  ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                  : isWarning
                  ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                  : "bg-gradient-to-r from-[#B38F2D] via-[#D4AF37] to-amber-300"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
