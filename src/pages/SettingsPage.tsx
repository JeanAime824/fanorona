/**
 * @file SettingsPage.tsx
 * Configuration panel for audio, visual aids, default AI difficulty, and match statistics.
 */

import {
  Award,
  BarChart2,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  Database,
  Disc,
  Eye,
  Layers,
  LogIn,
  LogOut,
  Palette,
  RefreshCw,
  RotateCcw,
  Settings as SettingsIcon,
  Sliders,
  Sparkles,
  User,
  Volume2,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../context/AuthContext";
import { AiDifficulty, BoardTheme, GameSettings, GameStats, PieceTexture } from "../game/types/gameTypes";
import { sound } from "../services/audio/soundSynthesizer";
import { syncStatsAndSettingsToFirestore, loadMatchHistoryFromFirestore, CloudGameRecord } from "../services/firebase/syncService";
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
  const [isClearDbConfirmOpen, setIsClearDbConfirmOpen] = useState(false);
  const [isClearingDb, setIsClearingDb] = useState(false);
  const [clearDbMessage, setClearDbMessage] = useState<string | null>(null);
  const [currentStats, setCurrentStats] = useState<GameStats>(stats);
  const [themeFilter, setThemeFilter] = useState<"all" | "wood" | "modern">("all");
  const { user, signInWithGoogle, logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [recentMatches, setRecentMatches] = useState<CloudGameRecord[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  React.useEffect(() => {
    if (user) {
      setIsLoadingMatches(true);
      loadMatchHistoryFromFirestore(5)
        .then((records) => setRecentMatches(records))
        .catch((err) => console.warn("Could not load match history:", err))
        .finally(() => setIsLoadingMatches(false));
    } else {
      setRecentMatches([]);
    }
  }, [user, syncSuccess]);

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      await syncStatsAndSettingsToFirestore(currentStats, settings);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error("Erreur de synchronisation:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const winRate =
    currentStats.gamesPlayed > 0
      ? Math.round((currentStats.gamesWon / currentStats.gamesPlayed) * 100)
      : 0;

  const handleResetStats = () => {
    storageService.saveStats(DEFAULT_STATS);
    setCurrentStats(DEFAULT_STATS);
    setIsResetConfirmOpen(false);
  };

  const handleClearServerDb = async () => {
    setIsClearingDb(true);
    try {
      const res = await fetch("/api/admin/clear-db", { method: "POST" });
      if (res.ok) {
        setClearDbMessage("Base de données serveur réinitialisée avec succès !");
        setTimeout(() => setClearDbMessage(null), 4000);
      }
    } catch (e) {
      console.error("Erreur réinitialisation base de données:", e);
    } finally {
      setIsClearingDb(false);
      setIsClearDbConfirmOpen(false);
    }
  };

  const currentTheme = settings.theme || "malagasy_wood";
  const currentPieceTexture: PieceTexture = settings.pieceTexture || "wooden";

  const filteredThemes = Object.values(BOARD_THEMES).filter((t) => {
    if (themeFilter === "wood") return t.category === "woodwork";
    if (themeFilter === "modern") return t.category === "modern";
    return true;
  });

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
          Personnalisez la texture de vos pièces, l'aspect de votre plateau, la fluidité des animations et vos options de jeu.
        </p>
      </div>

      {/* Cloud Authentication & Firestore Sync Section */}
      <Card variant="elevated" className="border-[#D4AF37]/30 bg-[#12100E]/90 p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <div className="text-sm font-serif font-bold text-[#E6E6E6] flex items-center gap-2">
                <span>Compte & Base de données Firestore</span>
                {user && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-sans font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Connecté
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {user
                  ? `Identifié en tant que ${user.displayName || user.email} via Google Sign-In`
                  : "Authentifiez-vous avec Google pour sécuriser et synchroniser vos données dans le Cloud"}
              </p>
            </div>
          </div>

          <div>
            {!user ? (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide bg-[#D4AF37] hover:bg-[#E5C158] text-black transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md shadow-[#D4AF37]/20 font-sans"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                  />
                </svg>
                <span>Connexion avec Google</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Synchroniser vos paramètres et statistiques actuels sur Firestore"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{syncSuccess ? "Synchronisé !" : isSyncing ? "En cours..." : "Synchroniser"}</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs text-red-400 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {user && (
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Données persistées sur la collection Firestore <code className="font-mono text-[11px] text-[#D4AF37]/80">users/{user.uid}</code></span>
            </div>
            <span className="text-[11px] text-white/40">
              Historique des matchs et préférences synchronisés
            </span>
          </div>
        )}
      </Card>

      {/* 1. Game Piece Texture Selector (Classic Wooden vs Modern Stone) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-serif font-bold tracking-wider uppercase text-[#D4AF37] flex items-center gap-2">
            <Disc className="w-4 h-4 text-[#D4AF37]" />
            <span>Texture des pièces de jeu (Bois classique ou Pierre contemporaine)</span>
          </h2>
          <span className="text-xs text-white/40 hidden sm:inline">
            Sélectionnez la texture tactile
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wooden Texture Option */}
          <button
            type="button"
            onClick={() => {
              sound.playSelect();
              onUpdateSettings({ pieceTexture: "wooden" });
            }}
            className={`group relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
              currentPieceTexture === "wooden"
                ? "bg-[#181614] border-[#D4AF37] shadow-[0_0_24px_rgba(212,175,55,0.22)] ring-1 ring-[#D4AF37]/60 scale-[1.01]"
                : "bg-[#111215] border-white/10 hover:border-white/25 hover:bg-[#15171C]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-serif font-bold text-base text-[#E6E6E6] group-hover:text-white transition-colors flex items-center gap-2">
                  <span>Bois classique d'ébénisterie</span>
                </div>
                <div className="text-xs text-[#D4AF37]/90 mt-0.5 font-medium">
                  Buis blond artisanal & Palissandre malgache
                </div>
                <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">
                  Sculpture traditionnelle au grain chaleureux, chanfreins adoucis et reflets dorés d'artisanat.
                </p>
              </div>
              {currentPieceTexture === "wooden" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4AF37] text-black font-bold text-[10px] uppercase tracking-wider shrink-0 shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Actif</span>
                </span>
              )}
            </div>

            {/* Piece Preview Swatch */}
            <div className="w-full h-20 rounded-xl p-3 bg-[#241711] border border-[#42291E] flex items-center justify-around shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:12px_12px]" />
              
              {/* White Wood Piece */}
              <div className="flex items-center gap-2 z-10">
                <div
                  className="w-11 h-11 rounded-full border border-[#A48250] shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),inset_0_-3px_5px_rgba(110,75,30,0.45)] flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: "radial-gradient(circle at 35% 28%, #FFF6E5 0%, #ECD8B9 38%, #D4B88E 75%, #B89666 100%)",
                  }}
                >
                  <div className="absolute top-1 left-1.5 w-3/5 h-2/5 rounded-full bg-gradient-to-b from-amber-100/90 to-transparent blur-[0.4px]" />
                  <div className="w-[40%] h-[40%] rounded-full border border-[#7C5E2D]/45" />
                </div>
                <div className="text-[10px] text-amber-100/70 font-medium">Buis Blond</div>
              </div>

              {/* Separator */}
              <div className="h-8 w-[1px] bg-white/10 z-10" />

              {/* Black Wood Piece */}
              <div className="flex items-center gap-2 z-10">
                <div
                  className="w-11 h-11 rounded-full border border-[#2A150D] shadow-[inset_0_2px_3px_rgba(255,255,255,0.22),inset_0_-3px_6px_rgba(0,0,0,0.95)] flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: "radial-gradient(circle at 34% 28%, #482C1F 0%, #2E1A11 44%, #1A0D07 80%, #0A0503 100%)",
                  }}
                >
                  <div className="absolute top-1 left-1.5 w-3/5 h-2/5 rounded-full bg-gradient-to-b from-amber-200/25 to-transparent blur-[0.4px]" />
                  <div className="w-[40%] h-[40%] rounded-full border border-amber-600/20" />
                </div>
                <div className="text-[10px] text-amber-200/60 font-medium">Palissandre</div>
              </div>
            </div>
          </button>

          {/* Modern Stone Texture Option */}
          <button
            type="button"
            onClick={() => {
              sound.playSelect();
              onUpdateSettings({ pieceTexture: "stone" });
            }}
            className={`group relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 ${
              currentPieceTexture === "stone"
                ? "bg-[#14161A] border-[#38BDF8] shadow-[0_0_24px_rgba(56,189,248,0.22)] ring-1 ring-[#38BDF8]/60 scale-[1.01]"
                : "bg-[#111215] border-white/10 hover:border-white/25 hover:bg-[#15171C]"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-serif font-bold text-base text-[#E6E6E6] group-hover:text-white transition-colors flex items-center gap-2">
                  <span>Pierre minérale contemporaine</span>
                </div>
                <div className="text-xs text-sky-400/90 mt-0.5 font-medium">
                  Quartz blanc poli & Basalte volcanique
                </div>
                <p className="text-[11px] text-white/50 mt-1.5 leading-relaxed">
                  Galets minéraux denses polis à la main, reflets cristallins et finition satinée moderne.
                </p>
              </div>
              {currentPieceTexture === "stone" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#38BDF8] text-black font-bold text-[10px] uppercase tracking-wider shrink-0 shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Actif</span>
                </span>
              )}
            </div>

            {/* Piece Preview Swatch */}
            <div className="w-full h-20 rounded-xl p-3 bg-[#182028] border border-[#2B3847] flex items-center justify-around shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38BDF8_1px,transparent_1px)] [background-size:12px_12px]" />

              {/* White Stone Piece */}
              <div className="flex items-center gap-2 z-10">
                <div
                  className="w-11 h-11 rounded-full border border-[#CBD5E1] shadow-[inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_5px_rgba(148,163,184,0.4)] flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: "radial-gradient(circle at 35% 28%, #FFFFFF 0%, #F8FAFC 42%, #E2E8F0 82%, #CBD5E1 100%)",
                  }}
                >
                  <div className="absolute top-1 left-1.5 w-3/5 h-2/5 rounded-full bg-gradient-to-b from-white/95 to-transparent blur-[0.4px]" />
                  <div className="w-[40%] h-[40%] rounded-full border border-[#94A3B8]/35" />
                </div>
                <div className="text-[10px] text-slate-200 font-medium">Quartz Blanc</div>
              </div>

              {/* Separator */}
              <div className="h-8 w-[1px] bg-white/10 z-10" />

              {/* Black Stone Piece */}
              <div className="flex items-center gap-2 z-10">
                <div
                  className="w-11 h-11 rounded-full border border-[#334155] shadow-[inset_0_2px_3px_rgba(255,255,255,0.25),inset_0_-3px_6px_rgba(0,0,0,0.95)] flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: "radial-gradient(circle at 35% 28%, #334155 0%, #1E293B 48%, #0F172A 85%, #020617 100%)",
                  }}
                >
                  <div className="absolute top-1 left-1.5 w-3/5 h-2/5 rounded-full bg-gradient-to-b from-cyan-100/25 to-transparent blur-[0.4px]" />
                  <div className="w-[40%] h-[40%] rounded-full border border-white/10" />
                </div>
                <div className="text-[10px] text-slate-300 font-medium">Basalte Noir</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Board Visual Theme Selector */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-serif font-bold tracking-wider uppercase text-[#D4AF37] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#D4AF37]" />
            <span>Thème visuel du plateau ({Object.keys(BOARD_THEMES).length} styles)</span>
          </h2>

          {/* Theme category filter tabs */}
          <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setThemeFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                themeFilter === "all"
                  ? "bg-[#D4AF37] text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Tous
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter("wood")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                themeFilter === "wood"
                  ? "bg-[#D4AF37] text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Bois Classique
            </button>
            <button
              type="button"
              onClick={() => setThemeFilter("modern")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                themeFilter === "modern"
                  ? "bg-[#D4AF37] text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Pierre & Moderne
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredThemes.map((t) => {
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

            {/* Animations Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#E6E6E6] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#D4AF37]" />
                  <span>Animations des déplacements</span>
                </div>
                <div className="text-[11px] text-white/40">
                  Transitions fluides et glissées lors des coups
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.animationsEnabled}
                onChange={(e) =>
                  onUpdateSettings({ animationsEnabled: e.target.checked })
                }
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

            <div className="border-t border-white/10" />

            {/* Speed Mode & Countdown Timer Configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#E6E6E6] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    <span>Mode Vitesse (Chronomètre par coup)</span>
                  </div>
                  <div className="text-[11px] text-white/40">
                    Active un compte à rebours sous tension avec défaite au temps
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.speedModeEnabled}
                  onChange={(e) =>
                    onUpdateSettings({ speedModeEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#D4AF37] cursor-pointer"
                />
              </div>

              {settings.speedModeEnabled && (
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-white/60 mb-2">
                    Durée allouée par coup (secondes)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { sec: 10, label: "10s", tip: "Blitz Éclair" },
                      { sec: 15, label: "15s", tip: "Rapide" },
                      { sec: 30, label: "30s", tip: "Standard" },
                      { sec: 45, label: "45s", tip: "Modéré" },
                      { sec: 60, label: "60s", tip: "Tranquille" },
                    ].map((item) => (
                      <button
                        key={item.sec}
                        type="button"
                        onClick={() => onUpdateSettings({ turnTimeLimit: item.sec })}
                        className={`py-1.5 px-2 rounded-lg border text-center font-mono text-xs transition-all cursor-pointer ${
                          settings.turnTimeLimit === item.sec
                            ? "bg-[#D4AF37] text-black border-[#D4AF37] font-bold"
                            : "bg-[#111111] border-white/10 text-white/60 hover:text-white"
                        }`}
                        title={item.tip}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10" />

            {/* Personalized Player Names for Victory Display */}
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-[#E6E6E6] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#D4AF37]" />
                  <span>Personnalisation des noms des joueurs</span>
                </div>
                <div className="text-[11px] text-white/40">
                  Affichés lors des félicitations de victoire et des écrans d'honneur
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-white/60 mb-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-white border border-black/30 inline-block" />
                    Joueur Blancs
                  </label>
                  <input
                    type="text"
                    value={settings.playerNameWhite || ""}
                    placeholder="Joueur Blanc"
                    maxLength={30}
                    onChange={(e) =>
                      onUpdateSettings({ playerNameWhite: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/60 mb-1 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-950 border border-white/20 inline-block" />
                    Joueur Noirs
                  </label>
                  <input
                    type="text"
                    value={settings.playerNameBlack || ""}
                    placeholder="Joueur Noir"
                    maxLength={30}
                    onChange={(e) =>
                      onUpdateSettings({ playerNameBlack: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#111111] border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
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

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2">
              {clearDbMessage && (
                <span className="text-xs text-emerald-400 font-medium mr-auto animate-fadeIn">
                  {clearDbMessage}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetConfirmOpen(true)}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Réinitialiser les stats
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsClearDbConfirmOpen(true)}
                icon={<Database className="w-3.5 h-3.5" />}
              >
                Vider la base de données
              </Button>
            </div>
          </Card>

          {/* Cloud Match History if signed in */}
          {user && (
            <Card variant="elevated" className="space-y-3 p-4 bg-[#141210] border-[#D4AF37]/20">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[#E6E6E6] flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Derniers matchs (Firestore)</span>
                </div>
                {isLoadingMatches && (
                  <span className="text-[10px] text-white/40 animate-pulse">Chargement...</span>
                )}
              </div>

              {recentMatches.length === 0 ? (
                <p className="text-[11px] text-white/40 italic py-1">
                  Aucun match récent enregistré sur le Cloud. Jouez une partie pour archiver vos résultats !
                </p>
              ) : (
                <div className="space-y-1.5">
                  {recentMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-lg bg-[#0F0E0D] border border-white/5 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            m.winner === "white"
                              ? "bg-white"
                              : m.winner === "black"
                              ? "bg-amber-950 border border-white/30"
                              : "bg-gray-500"
                          }`}
                        />
                        <span className="font-medium text-white/90">
                          {m.gameMode === "ai" ? `Vs IA (${m.difficulty})` : "Passe & Joue"}
                        </span>
                        {m.speedMode && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-[#D4AF37]/20 text-[#D4AF37]">
                            Vitesse
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-white/50 font-mono text-[10px]">
                        <span>{m.turnNumber} tours</span>
                        <span className="text-white/20">•</span>
                        <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
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

      {/* Confirmation modal for server db clear */}
      <Modal
        isOpen={isClearDbConfirmOpen}
        onClose={() => setIsClearDbConfirmOpen(false)}
        title="Vider la base de données serveur ?"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs text-white/70 leading-relaxed">
          <p>
            Cette action réinitialisera complètement tous les comptes utilisateurs, invitations de jeu, parties multijoueur et classements enregistrés sur le serveur.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsClearDbConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isClearingDb}
              onClick={handleClearServerDb}
            >
              Confirmer et vider
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
