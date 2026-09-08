/**
 * @file UserMenu.tsx
 * Google Authentication and Custom Unique ID status component for top navbar.
 */

import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Database,
  LogIn,
  LogOut,
  User as UserIcon,
  UserCheck,
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface UserMenuProps {
  onOpenSettings?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = () => {
  const { user, loading, signInWithGoogle, signInWithUsername, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
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

  const handleSignInGoogle = async () => {
    setAuthError(null);
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Erreur de connexion Google:", err);
      const errCode = err?.code || "";
      const message = err?.message || String(err);

      if (errCode === "auth/unauthorized-domain") {
        setAuthError(
          "Ce domaine n'est pas autorisé dans Firebase console. Utilisez plutôt la connexion directe par Pseudo ci-dessous !"
        );
      } else if (errCode === "auth/popup-closed-by-user") {
        setAuthError("La fenêtre de connexion a été fermée avant la fin de l'authentification.");
      } else {
        setAuthError(`Erreur de connexion (${errCode || "inconnue"}) : ${message}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    try {
      setIsSigningIn(true);
      await signInWithUsername(usernameInput.trim());
      setIsUsernameModalOpen(false);
      setUsernameInput("");
    } catch (err: any) {
      setAuthError(err?.message || "Erreur de connexion");
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
      <>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsUsernameModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-[#C8A452] hover:bg-[#D4AF37] text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Connexion instantanée par Pseudo (avec ID Unique)"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Connexion Pseudo</span>
          </button>

          <button
            type="button"
            onClick={handleSignInGoogle}
            disabled={isSigningIn}
            className="hidden sm:flex px-2.5 py-1.5 rounded-lg text-xs font-medium tracking-wide bg-white/[0.04] hover:bg-white/[0.08] text-[#F5F3EE] border border-white/[0.08] transition-all items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Se connecter avec un compte Google"
          >
            <LogIn className="w-3.5 h-3.5 text-[#C8A452]" />
            <span>Google</span>
          </button>
        </div>

        {/* Username Login Modal */}
        <Modal
          isOpen={isUsernameModalOpen}
          onClose={() => setIsUsernameModalOpen(false)}
          title="Connexion Joueur (ID Unique)"
          maxWidth="sm"
        >
          <form onSubmit={handleUsernameSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider mb-2">
                Votre Pseudo / Nom de joueur
              </label>
              <input
                type="text"
                placeholder="Ex: Miora, FanoronaMaster..."
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                required
                autoFocus
                className="w-full px-3 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-sm text-[#F5F3EE] placeholder-[#9E9890] focus:outline-none focus:border-[#C8A452]"
              />
              <p className="text-[10px] text-[#9E9890] mt-1.5">
                Un ID unique permanent vous sera automatiquement attribué pour vous identifier sur le serveur multijoueur.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsUsernameModalOpen(false)}>
                Annuler
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSigningIn || !usernameInput.trim()}>
                {isSigningIn ? "Connexion..." : "Rejoindre le jeu"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Auth Error Modal */}
        {authError && (
          <Modal
            isOpen={!!authError}
            onClose={() => setAuthError(null)}
            title="Information Connexion"
            maxWidth="sm"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-red-300">Auth Google Indisponible</div>
                  <p className="leading-relaxed text-red-400/90">{authError}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setAuthError(null);
                    setIsUsernameModalOpen(true);
                  }}
                >
                  Utiliser un Pseudo
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  }

  // Authenticated user avatar & popover
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer focus:outline-none"
        title="Compte Joueur Autonome & Unique ID"
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
          <span className="text-[9px] font-mono text-[#D4AF37] truncate max-w-[90px]">
            {user.uid.startsWith("usr_") ? user.uid.substring(0, 10) + "..." : "Connecté"}
          </span>
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#141210] border border-[#D4AF37]/30 rounded-2xl shadow-2xl z-50 p-4 space-y-4 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* User Header */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] flex items-center justify-center text-base font-bold text-[#D4AF37]">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-[#E6E6E6] truncate">
                {user.displayName || "Joueur Authentifié"}
              </div>
              <div className="text-[10px] font-mono text-[#C8A452] truncate">
                ID: {user.uid}
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="p-2.5 rounded-xl bg-[#0D0B0A] border border-[#D4AF37]/20 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#D4AF37]">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>ID Unique Serveur</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                <span>Actif</span>
              </span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed">
              Votre identifiant unique est conservé pour vos parties multijoueurs et vos conversations vocales.
            </p>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-xs font-medium text-white/70 hover:text-red-400 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Changer de joueur</span>
          </button>
        </div>
      )}
    </div>
  );
};
