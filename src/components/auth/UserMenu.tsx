/**
 * @file UserMenu.tsx
 * User authentication & profile menu for Fanorona platform.
 * Displays 6-character Player ID, Isa rating, quick links to Profile, Leaderboard, and Login.
 */

import React, { useRef, useState, useEffect } from "react";
import {
  LogIn,
  LogOut,
  User as UserIcon,
  Star,
  Copy,
  Check,
  Trophy,
  UserPlus,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

interface UserMenuProps {
  onNavigate?: (route: string) => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigate }) => {
  const { user, loading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isGuest = Boolean(user?.id?.startsWith("gst_") || user?.username?.startsWith("Invité_"));

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.player_id) {
      navigator.clipboard.writeText(user.player_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNavigateTo = (route: string) => {
    setIsOpen(false);
    if (onNavigate) onNavigate(route);
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-xl bg-white/5 animate-pulse border border-white/10" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleNavigateTo("connexion")}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide bg-[#C8A452] hover:bg-[#D4AF37] text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Connexion</span>
        </button>

      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#C8A452]/30 transition-all cursor-pointer focus:outline-none"
        title="Mon Compte Joueur"
      >
        <img
          src={
            user.avatar_url ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`
          }
          alt={user.username}
          className="w-7 h-7 rounded-lg object-cover border border-[#C8A452]/50 bg-[#1A1816]"
        />

        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-xs font-semibold text-[#F5F3EE] truncate max-w-[100px]">
            {user.username}
          </span>
          <span className="text-[10px] font-mono text-[#C8A452] font-bold">
            {user.player_id}
          </span>
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#141210] border border-[#C8A452]/30 rounded-2xl shadow-2xl z-50 p-4 space-y-3.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* User Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <img
              src={
                user.avatar_url ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`
              }
              alt={user.username}
              className="w-11 h-11 rounded-xl object-cover border border-[#C8A452]/60 bg-[#1A1816]"
            />
            <div className="overflow-hidden flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#F5F3EE] truncate">{user.username}</span>
                {isGuest && (
                  <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Invité
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[11px] font-mono font-bold text-[#C8A452]">
                  ID: {user.player_id}
                </span>
                <button
                  onClick={handleCopyId}
                  className="text-[10px] text-[#9E9890] hover:text-[#C8A452] flex items-center gap-1 cursor-pointer"
                  title="Copier mon ID"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copié" : "Copier"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Guest Upgrade Banner */}
          {isGuest && (
            <div className="p-2.5 rounded-xl bg-[#C8A452]/10 border border-[#C8A452]/30 space-y-1.5">
              <div className="text-[11px] font-semibold text-[#C8A452] flex items-center justify-between">
                <span>Session Invité</span>
                <span className="text-[9px] text-[#9E9890]">Non synchronisé</span>
              </div>
              <p className="text-[10px] text-[#9E9890] leading-snug">
                Créez votre compte joueur officiel pour conserver votre cote Isa et vos statistiques.
              </p>
              <button
                type="button"
                onClick={() => handleNavigateTo("inscription")}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#C8A452] hover:bg-[#D4AF37] text-black font-semibold text-[11px] transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Créer mon compte officiel</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Isa Rating Pill */}
          <div className="p-2.5 rounded-xl bg-[#0D0B0A] border border-[#C8A452]/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-[#C8A452] font-semibold">
              <Star className="w-3.5 h-3.5 fill-[#C8A452]" />
              <span>Classement Isa</span>
            </div>
            <div className="text-sm font-serif font-bold text-[#F5F3EE]">{user.isa}</div>
          </div>

          {/* Navigation links */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNavigateTo("profil")}
              className="w-full py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-[#F5F3EE] transition-colors flex items-center gap-2 cursor-pointer text-left"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#C8A452]" />
              <span>Mon Profil Joueur</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigateTo("classement")}
              className="w-full py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-xs font-medium text-[#F5F3EE] transition-colors flex items-center gap-2 cursor-pointer text-left"
            >
              <Trophy className="w-3.5 h-3.5 text-[#C8A452]" />
              <span>Classement Global</span>
            </button>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-medium text-red-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      )}
    </div>
  );
};
