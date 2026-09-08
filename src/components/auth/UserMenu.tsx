/**
 * @file UserMenu.tsx
 * Google Authentication and Cloud Sync status component for top navbar.
 */

import {
  CheckCircle2,
  Cloud,
  Database,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

interface UserMenuProps {
  onOpenSettings?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = () => {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err) {
      console.error("Erreur de connexion Google:", err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (err) {
      console.error("Erreur de déconnexion:", err);
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse flex items-center justify-center border border-white/10" />
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isSigningIn}
        className="px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide bg-white/[0.04] hover:bg-white/[0.08] text-[#F5F3EE] border border-white/[0.08] hover:border-[#C8A452]/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        title="Se connecter avec un compte Google"
      >
        <LogIn className="w-3.5 h-3.5 text-[#C8A452]" />
        <span>
          {isSigningIn ? "Connexion..." : "Connexion"}
        </span>
      </button>
    );
  }

  // Authenticated user avatar & popover
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer focus:outline-none"
        title="Compte Google & Synchronisation Firestore"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || "Avatar"}
            className="w-7 h-7 rounded-lg object-cover border border-[#D4AF37]/50"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-xs font-bold text-[#D4AF37]">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
          </div>
        )}

        <div className="hidden md:flex flex-col items-start leading-tight">
          <span className="text-xs font-semibold text-white/90 truncate max-w-[100px]">
            {user.displayName || "Joueur"}
          </span>
          <span className="text-[10px] text-[#D4AF37] flex items-center gap-1">
            <Cloud className="w-2.5 h-2.5" />
            <span>Firestore</span>
          </span>
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#141210] border border-[#D4AF37]/30 rounded-2xl shadow-2xl z-50 p-4 space-y-4 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* User Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "Avatar"}
                className="w-10 h-10 rounded-xl object-cover border border-[#D4AF37]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-base font-bold text-[#D4AF37]">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-[#E6E6E6] truncate">
                {user.displayName || "Joueur Authentifié"}
              </div>
              <div className="text-[11px] text-white/40 truncate">
                {user.email || ""}
              </div>
            </div>
          </div>

          {/* Cloud Database Status */}
          <div className="p-2.5 rounded-xl bg-[#0D0B0A] border border-[#D4AF37]/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#D4AF37]">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Base Firestore</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active</span>
              </span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed">
              Vos victoires, défaites et paramètres de jeu sont automatiquement persistés et synchronisés sur le Cloud.
            </p>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-xs font-medium text-white/70 hover:text-red-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      )}
    </div>
  );
};
