/**
 * @file Navbar.tsx
 * Top navigation bar with Malagasy cultural branding, tab links,
 * notification center, sound controls, and user menu.
 */

import {
  BookOpen,
  Compass,
  Gamepad2,
  Settings as SettingsIcon,
  Users,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import React from "react";
import { UserMenu } from "../auth/UserMenu";
import { IconButton } from "../ui/IconButton";
import { NotificationCenter } from "../notifications/NotificationCenter";

export type NavTab =
  | "game"
  | "friends"
  | "classement"
  | "profil"
  | "rules"
  | "history"
  | "settings"
  | "connexion"
  | "inscription"
  | "public_profile";

export interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notificationCount?: number;
  onOpenNewGame?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  soundEnabled,
  onToggleSound,
  onOpenNewGame,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#121110]/95 backdrop-blur-md border-b border-white/[0.06]">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Authentic Cultural Signature */}
        <button
          type="button"
          onClick={() => onSelectTab("game")}
          className="flex items-center gap-3 cursor-pointer group text-left focus:outline-none"
        >
          {/* Fanorona Geometric Rhombus Lattice Icon */}
          <div className="w-9 h-9 rounded-lg bg-[#181615] flex items-center justify-center border border-white/[0.08] group-hover:border-[#C8A452]/40 transition-colors">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-[#C8A452]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" strokeOpacity="0.4" />
              <line x1="3" y1="12" x2="21" y2="12" strokeOpacity="0.7" />
              <line x1="12" y1="3" x2="12" y2="21" strokeOpacity="0.7" />
              <line x1="3" y1="3" x2="21" y2="21" strokeOpacity="0.4" />
              <line x1="21" y1="3" x2="3" y2="21" strokeOpacity="0.4" />
              <circle cx="12" cy="12" r="1.5" fill="#C8A452" />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="text-base sm:text-lg font-serif tracking-[0.16em] text-[#F5F3EE] uppercase font-semibold leading-none group-hover:text-[#C8A452] transition-colors">
              FANORONA
            </div>
            <div className="text-[9px] uppercase tracking-[0.2em] text-[#9E9890] mt-1 font-medium">
              Le jeu traditionnel de Madagascar
            </div>
          </div>
        </button>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5">
          {onOpenNewGame && (
            <button
              type="button"
              onClick={() => {
                onSelectTab("game");
                onOpenNewGame();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 bg-[#C8A452] hover:bg-[#D4AF37] text-black shadow-md shadow-[#C8A452]/20 active:scale-95"
            >
              <Gamepad2 className="w-3.5 h-3.5 fill-current" />
              <span>Nouvelle Partie</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onSelectTab("game")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentTab === "game"
                ? "bg-white/[0.08] text-[#F5F3EE]"
                : "text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04]"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Plateau</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("friends")}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentTab === "friends" || currentTab === "amis"
                ? "bg-white/[0.08] text-[#F5F3EE]"
                : "text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Amis</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("classement")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentTab === "classement"
                ? "bg-white/[0.08] text-[#F5F3EE]"
                : "text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04]"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#C8A452]" />
            <span className="hidden md:inline">Classement</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("rules")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentTab === "rules"
                ? "bg-white/[0.08] text-[#F5F3EE]"
                : "text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Règles</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("history")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 hidden lg:flex ${
              currentTab === "history"
                ? "bg-white/[0.08] text-[#F5F3EE]"
                : "text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04]"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Histoire</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("settings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentTab === "settings"
                ? "bg-white/[0.08] text-[#F5F3EE]"
                : "text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04]"
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paramètres</span>
          </button>

          {/* Separation */}
          <div className="h-4 w-px bg-white/[0.08] mx-1 sm:mx-2" />

          {/* Real-time Notification Center */}
          <NotificationCenter onNavigate={onSelectTab} />

          {/* Audio toggle */}
          <IconButton
            size="sm"
            variant="ghost"
            label={soundEnabled ? "Couper le son" : "Activer le son"}
            icon={
              soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#9E9890] hover:text-[#F5F3EE]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#6B655E]" />
              )
            }
            onClick={onToggleSound}
          />

          {/* User Sign In / Profile */}
          <UserMenu onNavigate={onSelectTab} />
        </nav>
      </div>
    </header>
  );
};
