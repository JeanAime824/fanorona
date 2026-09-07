/**
 * @file Navbar.tsx
 * Top navigation bar with Malagasy cultural branding and tab links.
 */

import { BookOpen, Compass, Gamepad2, Settings as SettingsIcon, Volume2, VolumeX } from "lucide-react";
import React from "react";
import { IconButton } from "../ui/IconButton";

export type NavTab = "game" | "rules" | "history" | "settings";

export interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F0F0F]/95 backdrop-blur-md border-b border-white/10">
      <div className="w-[90%] max-w-[90vw] mx-auto px-2 sm:px-4 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => onSelectTab("game")}
          className="flex items-center gap-3.5 cursor-pointer group text-left focus:outline-none"
        >
          {/* Fanorona Lattice Icon */}
          <div className="w-10 h-10 rounded-lg bg-[#161616] flex items-center justify-center shadow-lg border border-[#D4AF37]/30 group-hover:border-[#D4AF37] transition-all">
            <div className="w-5 h-5 relative flex items-center justify-center">
              <div className="absolute inset-0 border border-[#D4AF37]/60 rotate-45" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="text-xl sm:text-2xl font-serif tracking-widest text-[#D4AF37] uppercase font-bold leading-none">
              FANORONA
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1 font-medium">
              Le jeu traditionnel de Madagascar
            </div>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onSelectTab("game")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === "game"
                ? "bg-white/10 text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Jouer</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("rules")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === "rules"
                ? "bg-white/10 text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            <span>Règles</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("history")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer hidden md:flex ${
              currentTab === "history"
                ? "bg-white/10 text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <Compass className="w-4 h-4 text-[#D4AF37]" />
            <span>Histoire</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("settings")}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === "settings"
                ? "bg-white/10 text-[#D4AF37] border border-[#D4AF37]/40 shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            <SettingsIcon className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline">Paramètres</span>
          </button>

          {/* Quick Sound Toggle */}
          <div className="ml-1 sm:ml-2 pl-2 sm:pl-3 border-l border-white/10">
            <IconButton
              size="sm"
              variant="ghost"
              label={soundEnabled ? "Couper le son" : "Activer le son"}
              icon={
                soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-white/40" />
                )
              }
              onClick={onToggleSound}
            />
          </div>
        </nav>
      </div>
    </header>
  );
};
