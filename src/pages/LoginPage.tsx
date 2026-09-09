/**
 * @file LoginPage.tsx
 * Professional Login page for Fanorona online gaming platform.
 * Supports login via Username, Email, or 6-character Player ID,
 * password visibility toggle, and instant Guest Mode.
 */

import React, { useState } from "react";
import {
  LogIn,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  User as UserIcon,
  AlertCircle,
  Eye,
  EyeOff,
  Gamepad2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, signInAsGuest } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Veuillez renseigner votre pseudo, email ou identifiant joueur.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(identifier.trim(), password);
      onNavigate("game");
    } catch (err: any) {
      setError(
        err?.message ||
          "Identifiants incorrects. Veuillez vérifier votre nom d'utilisateur et mot de passe."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setIsGuestLoading(true);
    try {
      await signInAsGuest();
      onNavigate("game");
    } catch (err: any) {
      setError(err?.message || "Impossible de démarrer le mode invité.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 sm:py-12 px-4">
      <div className="bg-[#141210] border border-[#C8A452]/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Navigation Tabs between Login and Register */}
        <div className="grid grid-cols-2 p-1 bg-white/[0.04] rounded-xl border border-white/[0.08]">
          <button
            type="button"
            className="py-2 text-xs font-semibold rounded-lg bg-[#C8A452] text-[#141210] shadow-sm transition-all text-center cursor-default"
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => onNavigate("inscription")}
            className="py-2 text-xs font-medium text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04] rounded-lg transition-all text-center cursor-pointer"
          >
            Créer un compte
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C8A452]/10 border border-[#C8A452]/30 text-[#C8A452] mb-1">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-wide text-[#F5F3EE]">
            Espace Joueur
          </h1>
          <p className="text-xs text-[#9E9890]">
            Connectez-vous pour retrouver votre classement Isa, votre cote officielle et vos amis.
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
                placeholder="Ex: FanoronaPro, ID: 849201 ou email"
                required
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-[#F5F3EE] placeholder-[#6B655E] focus:outline-none focus:border-[#C8A452] transition-colors"
              />
              <UserIcon className="w-4 h-4 text-[#9E9890] absolute left-3 top-3" />
            </div>
            <p className="text-[10px] text-[#9E9890] mt-1">
              Vous pouvez utiliser votre pseudo, votre adresse email ou votre ID joueur à 6 chiffres.
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
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                className="w-full pl-9 pr-10 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-[#F5F3EE] placeholder-[#6B655E] focus:outline-none focus:border-[#C8A452] transition-colors"
              />
              <KeyRound className="w-4 h-4 text-[#9E9890] absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#9E9890] hover:text-[#F5F3EE] transition-colors p-0.5 focus:outline-none cursor-pointer"
                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/20 bg-white/[0.05] accent-[#C8A452] cursor-pointer"
              />
              <span className="text-xs text-[#9E9890]">Mémoriser ma session</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 justify-center text-sm font-semibold tracking-wide shadow-md"
            disabled={isLoading || isGuestLoading}
          >
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <span className="relative px-3 bg-[#141210] text-[11px] text-[#9E9890] uppercase tracking-wider">
            Ou jouer immédiatement
          </span>
        </div>

        {/* Guest Mode Play Button */}
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={isLoading || isGuestLoading}
          className="w-full py-3 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-[#C8A452]/40 text-[#F5F3EE] transition-all flex items-center justify-between gap-3 cursor-pointer group focus:outline-none"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-[#C8A452]/10 border border-[#C8A452]/30 flex items-center justify-center text-[#C8A452] group-hover:bg-[#C8A452]/20 transition-colors">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F5F3EE] group-hover:text-[#C8A452] transition-colors">
                {isGuestLoading ? "Démarrage en cours..." : "Continuer en mode Invité"}
              </div>
              <div className="text-[10px] text-[#9E9890]">
                Accès direct sans inscription · Idéal pour essayer le jeu
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9E9890] group-hover:text-[#C8A452] group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-[#9E9890] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C8A452]" />
            <span>Sécurité renforcée & chiffrement des identifiants</span>
          </p>
        </div>
      </div>
    </div>
  );
};
