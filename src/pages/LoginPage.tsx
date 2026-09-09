/**
 * @file LoginPage.tsx
 * Professional Login page for Fanorona online gaming platform.
 * Supports login via Username, Email, or 6-character Player ID.
 */

import React, { useState } from "react";
import { LogIn, ArrowRight, ShieldCheck, KeyRound, User as UserIcon, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Veuillez entrer votre nom d'utilisateur, email ou ID Joueur.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(identifier.trim(), password);
      onNavigate("game");
    } catch (err: any) {
      setError(err?.message || "Identifiants invalides. Veuillez vérifier vos informations.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (username: string) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(username, "Fanorona2026!");
      onNavigate("game");
    } catch (err: any) {
      setError(err?.message || "Impossible de se connecter au compte démo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 sm:py-12 px-4">
      <div className="bg-[#141210] border border-[#C8A452]/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C8A452]/10 border border-[#C8A452]/30 text-[#C8A452] mb-1">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-wide text-[#F5F3EE]">
            Connexion Fanorona
          </h1>
          <p className="text-xs text-[#9E9890]">
            Accédez à vos parties classées, votre classement Isa et votre liste d'amis.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider mb-1.5">
              Identifiant / Email / ID Joueur
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ex: JeanAime, F7K2M9 ou email..."
                required
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-[#F5F3EE] placeholder-[#6B655E] focus:outline-none focus:border-[#C8A452] transition-colors"
              />
              <UserIcon className="w-4 h-4 text-[#9E9890] absolute left-3 top-3" />
            </div>
            <p className="text-[10px] text-[#9E9890] mt-1">
              Vous pouvez vous connecter avec votre pseudo ou votre ID unique à 6 caractères.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider">
                Mot de passe
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full pl-9 pr-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-[#F5F3EE] placeholder-[#6B655E] focus:outline-none focus:border-[#C8A452] transition-colors"
              />
              <KeyRound className="w-4 h-4 text-[#9E9890] absolute left-3 top-3" />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 justify-center text-sm font-semibold tracking-wide"
            disabled={isLoading}
          >
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>

        {/* Register prompt */}
        <div className="pt-4 border-t border-white/[0.08] text-center space-y-2">
          <p className="text-xs text-[#9E9890]">
            Vous n'avez pas encore de compte joueur ?
          </p>
          <button
            type="button"
            onClick={() => onNavigate("inscription")}
            className="text-xs font-semibold text-[#C8A452] hover:text-[#D4AF37] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Créer un compte avec ID unique à 6 caractères</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Demo profiles */}
        <div className="pt-3 border-t border-white/[0.06]">
          <div className="text-[10px] font-semibold text-[#9E9890] uppercase tracking-wider mb-2 text-center">
            Comptes de démonstration rapide
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("JeanAime")}
              className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-semibold text-[#F5F3EE]">JeanAime</div>
              <div className="text-[10px] font-mono text-[#C8A452]">ID: F7K2M9 · 1640 Isa</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("Tiana")}
              className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-left transition-colors cursor-pointer"
            >
              <div className="text-xs font-semibold text-[#F5F3EE]">Tiana</div>
              <div className="text-[10px] font-mono text-[#C8A452]">ID: K4P8XQ · 1588 Isa</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
