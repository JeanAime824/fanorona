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
        className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold tracking-wide bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/40 transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
        title="Se connecter avec votre compte Google pour sauvegarder vos statistiques sur Firestore"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
        <span className="hidden sm:inline">
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
