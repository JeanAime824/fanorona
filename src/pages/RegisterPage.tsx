/**
 * @file RegisterPage.tsx
 * Registration page for Fanorona online gaming platform.
 * Generates an authentic 6-character Player ID, assigns initial 1200 Isa rating,
 * and includes confirm password validation and guest option.
 */

import React, { useState } from "react";
import {
  UserPlus,
  ArrowRight,
  Sparkles,
  KeyRound,
  Mail,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Gamepad2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

interface RegisterPageProps {
  onNavigate: (route: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, signInAsGuest } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Veuillez choisir un nom d'utilisateur / pseudo.");
      return;
    }

    if (username.trim().length < 3) {
      setError("Le nom d'utilisateur doit contenir au moins 3 caractères.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }

    if (!password.trim() || password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await register(username.trim(), email.trim(), password);
      onNavigate("profil");
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création du compte.");
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

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="w-full max-w-md mx-auto py-8 sm:py-12 px-4">
      <div className="bg-[#141210] border border-[#C8A452]/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Navigation Tabs between Login and Register */}
        <div className="grid grid-cols-2 p-1 bg-white/[0.04] rounded-xl border border-white/[0.08]">
          <button
            type="button"
            onClick={() => onNavigate("connexion")}
            className="py-2 text-xs font-medium text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04] rounded-lg transition-all text-center cursor-pointer"
          >
            Se connecter
          </button>
          <button
            type="button"
            className="py-2 text-xs font-semibold rounded-lg bg-[#C8A452] text-[#141210] shadow-sm transition-all text-center cursor-default"
          >
            Créer un compte
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C8A452]/10 border border-[#C8A452]/30 text-[#C8A452] mb-1">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-wide text-[#F5F3EE]">
            Créer un compte Joueur
          </h1>
          <p className="text-xs text-[#9E9890]">
            Rejoignez la communauté de Fanorona et obtenez votre ID joueur officiel.
          </p>
        </div>

        {/* Official Features Pill */}
        <div className="p-3 bg-[#181614] border border-[#C8A452]/20 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C8A452]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Avantages du compte officiel</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#D8D4CE]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>ID Unique (6 chiffres)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Classement Isa (1200)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Parties multijoueur</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Statistiques & Amis</span>
            </div>
          </div>
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
              Pseudo / Nom d'utilisateur
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Miora, FanoronaGasy, Rasoa..."
                required
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-[#F5F3EE] placeholder-[#6B655E] focus:outline-none focus:border-[#C8A452] transition-colors"
              />
              <UserIcon className="w-4 h-4 text-[#9E9890] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider mb-1.5">
              Adresse Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-[#F5F3EE] placeholder-[#6B655E] focus:outline-none focus:border-[#C8A452] transition-colors"
              />
              <Mail className="w-4 h-4 text-[#9E9890] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                required
                className="w-full pl-9 pr-10 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-sm text-[#F5F3EE] placeholder-[#6B655E] focus:outline-none focus:border-[#C8A452] transition-colors"
              />
              <KeyRound className="w-4 h-4 text-[#9E9890] absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#9E9890] hover:text-[#F5F3EE] transition-colors p-0.5 focus:outline-none cursor-pointer"
                title={showPassword ? "Masquer" : "Afficher"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider">
                Confirmer le mot de passe
              </label>
              {passwordsMatch && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Correspond
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez votre mot de passe"
                required
                className={`w-full pl-9 pr-10 py-2.5 bg-white/[0.04] border rounded-xl text-sm text-[#F5F3EE] placeholder-[#6B655E] focus:outline-none transition-colors ${
                  confirmPassword && !passwordsMatch
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-[#C8A452]"
                }`}
              />
              <KeyRound className="w-4 h-4 text-[#9E9890] absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-[#9E9890] hover:text-[#F5F3EE] transition-colors p-0.5 focus:outline-none cursor-pointer"
                title={showConfirmPassword ? "Masquer" : "Afficher"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 justify-center text-sm font-semibold tracking-wide shadow-md"
            disabled={isLoading || isGuestLoading}
          >
            {isLoading ? "Création du profil..." : "Créer mon compte et mon ID"}
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
                Essayer le jeu sans inscription · Sauvegarde locale
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#9E9890] group-hover:text-[#C8A452] group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/[0.06] text-center">
          <p className="text-[11px] text-[#9E9890] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C8A452]" />
            <span>Sécurisé · Aucun mot de passe partagé publiquement</span>
          </p>
        </div>
      </div>
    </div>
  );
};
