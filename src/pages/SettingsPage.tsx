/**
 * @file SettingsPage.tsx
 * Configuration panel for audio, visual aids, default AI difficulty, and match statistics.
 */

import {
  Award,
  BarChart2,
  Bell,
  Check,
  Eye,
  Palette,
  RotateCcw,
  Settings as SettingsIcon,
  Sliders,
  Sparkles,
  Volume2,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { AiDifficulty, BoardTheme, GameSettings, GameStats } from "../game/types/gameTypes";
import { sound } from "../services/audio/soundSynthesizer";
import { storageService, DEFAULT_STATS } from "../services/storage/storageService";
import { BOARD_THEMES } from "../services/theme/boardThemes";

export interface SettingsPageProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  stats: GameStats;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  stats,
}) => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [currentStats, setCurrentStats] = useState<GameStats>(stats);

  const winRate =
    currentStats.gamesPlayed > 0
      ? Math.round((currentStats.gamesWon / currentStats.gamesPlayed) * 100)
      : 0;

  const handleResetStats = () => {
    storageService.saveStats(DEFAULT_STATS);
    setCurrentStats(DEFAULT_STATS);
    setIsResetConfirmOpen(false);
  };

  const currentTheme = settings.theme || "malagasy_wood";

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-white/80">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-serif font-bold uppercase tracking-widest">
          <SettingsIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Préférences & Profil</span>
        </div>
        <h1 className="text-3xl font-serif font-bold tracking-wide text-[#E6E6E6]">
          Paramètres & Thèmes
        </h1>
        <p className="text-xs text-white/50 max-w-md mx-auto">
          Personnalisez l'aspect visuel de votre plateau, vos sensations tactiles et vos options de partie.
        </p>
      </div>

      {/* Board Visual Theme Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-serif font-bold tracking-wider uppercase text-[#D4AF37] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#D4AF37]" />
            <span>Thème visuel du plateau ({Object.keys(BOARD_THEMES).length} styles)</span>
          </h2>
          <span className="text-xs text-white/40 hidden sm:inline">
            Cliquez pour changer instantanément
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Object.values(BOARD_THEMES).map((t) => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  sound.playSelect();
                  onUpdateSettings({ theme: t.id });
                }}
                className={`group relative text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "bg-[#18181A] border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.22)] ring-1 ring-[#D4AF37]/60 scale-[1.01]"
                    : "bg-[#111215] border-white/10 hover:border-white/25 hover:bg-[#15171C]"
                }`}
              >
                {/* Top: Title, Tagline and Selected Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-serif font-bold text-sm text-[#E6E6E6] group-hover:text-white transition-colors">
                      {t.name}
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37] text-black font-bold text-[10px] uppercase tracking-wider shrink-0 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Actif</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#D4AF37]/80 mt-0.5 font-medium">
                    {t.tagline}
                  </div>
                </div>

                {/* Visual Swatch Mini-Board Preview */}
                <div
                  className="w-full h-16 rounded-xl p-2 flex items-center justify-between border overflow-hidden relative shadow-inner"
                  style={{
                    backgroundColor: t.preview.frameColor,
                    borderColor: isSelected ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)",
                  }}
                >
                  {/* Surface swatch */}
                  <div
                    className="absolute inset-1.5 rounded-lg border flex items-center justify-around px-4 overflow-hidden"
                    style={{
                      backgroundColor: t.preview.boardColor,
                      borderColor: "rgba(0,0,0,0.2)",
                    }}
                  >
                    {/* Stylized grid line in background */}
                    <div
                      className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] opacity-40"
                      style={{ backgroundColor: t.preview.accent }}
                    />
                    <div
                      className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] opacity-40"
                      style={{ backgroundColor: t.preview.accent }}
                    />

                    {/* White piece pebble */}
                    <div
                      className="relative z-10 w-7 h-7 rounded-full shadow-md border flex items-center justify-center"
                      style={{
                        background: t.pieces.white.background,
                        borderColor: isSelected ? t.preview.accent : "rgba(255,255,255,0.4)",
                      }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full border border-black/10" />
                    </div>

                    {/* Black piece pebble */}
                    <div
                      className="relative z-10 w-7 h-7 rounded-full shadow-md border flex items-center justify-center"
                      style={{
                        background: t.pieces.black.background,
                        borderColor: isSelected ? t.preview.accent : "rgba(255,255,255,0.15)",
                      }}
                    >
                      <div className="w-2.5 h-2.5 rounded-full border border-white/10" />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-white/50 leading-relaxed">
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
        {/* Settings Column */}
        <div className="space-y-4">
          <h2 className="text-sm font-serif font-bold tracking-wider uppercase text-[#D4AF37] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#D4AF37]" />
            <span>Options de jeu</span>
          </h2>

          <Card variant="elevated" className="space-y-4">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#E6E6E6] flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Effets sonores</span>
                </div>
                <div className="text-[11px] text-white/40">
                  Bruits de pierres, capture et victoire
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
              />
            </div>

            <div className="border-t border-white/10" />

            {/* Possible Moves Highlight */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#E6E6E6] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#D4AF37]" />
                  <span>Guides visuels des coups</span>
                </div>
                <div className="text-[11px] text-white/40">
                  Surligner les destinations autorisées
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showPossibleMoves}
                onChange={(e) =>
                  onUpdateSettings({ showPossibleMoves: e.target.checked })
                }
                className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
              />
            </div>

            <div className="border-t border-white/10" />

            {/* Default AI Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-[#E6E6E6] mb-2">
                Difficulté par défaut de l'IA
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as AiDifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onUpdateSettings({ aiDifficulty: d })}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                      settings.aiDifficulty === d
                        ? "bg-[#161616] border-[#D4AF37] text-[#D4AF37] shadow-sm font-bold"
                        : "bg-[#111111] border-white/10 text-white/50 hover:text-white"
                    }`}
                  >
                    {d === "easy" ? "Facile" : d === "medium" ? "Moyen" : "Difficile"}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Statistics Column */}
        <div className="space-y-4">
          <h2 className="text-sm font-serif font-bold tracking-wider uppercase text-[#D4AF37] flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Statistiques locales</span>
          </h2>

          <Card variant="elevated" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#141414] border border-white/5">
                <div className="text-[11px] text-white/40 font-medium">Parties jouées</div>
                <div className="text-2xl font-bold text-[#E6E6E6] font-serif mt-0.5">
                  {currentStats.gamesPlayed}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#141414] border border-white/5">
                <div className="text-[11px] text-white/40 font-medium">Taux de victoires</div>
                <div className="text-2xl font-bold text-[#D4AF37] font-serif mt-0.5">
                  {winRate}%
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#141414] border border-white/5">
                <div className="text-[11px] text-white/40 font-medium">Victoires</div>
                <div className="text-xl font-bold text-[#E6E6E6] font-serif mt-0.5">
                  {currentStats.gamesWon}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#141414] border border-white/5">
                <div className="text-[11px] text-white/40 font-medium">Total captures</div>
                <div className="text-xl font-bold text-[#D4AF37] font-serif mt-0.5">
                  {currentStats.totalCaptures}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetConfirmOpen(true)}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Réinitialiser les stats
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation modal for stats reset */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Réinitialiser les statistiques ?"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs text-white/70 leading-relaxed">
          <p>
            Cette action effacera définitivement l'historique de vos victoires, défaites et captures enregistrées sur cet appareil.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsResetConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleResetStats}
            >
              Effacer les données
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
