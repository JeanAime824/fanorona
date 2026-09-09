/**
 * @file RegisterPage.tsx
 * Registration page for Fanorona online gaming platform.
 * Generates an authentic 6-character Player ID and assigns initial 1200 Isa rating.
 */

import React, { useState } from "react";
import { UserPlus, ArrowRight, Sparkles, KeyRound, Mail, User as UserIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";

interface RegisterPageProps {
  onNavigate: (route: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
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

  return (
    <div className="w-full max-w-md mx-auto py-8 sm:py-12 px-4">
      <div className="bg-[#141210] border border-[#C8A452]/20 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C8A452]/10 border border-[#C8A452]/30 text-[#C8A452] mb-1">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-wide text-[#F5F3EE]">
            Créer un compte Joueur
          </h1>
          <p className="text-xs text-[#9E9890]">
            Rejoignez la communauté de Fanorona et obtenez votre ID joueur unique.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="p-3 bg-[#181614] border border-[#C8A452]/20 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C8A452]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Avantages du compte Fanorona</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#D8D4CE]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>ID Unique (6 car.)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Classement Isa (1200)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Parties classées</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Amis & Vocal WebRTC</span>
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
                placeholder="Ex: Miora, JeanAime, FanoronaGasy..."
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 6 caractères"
                required
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
            {isLoading ? "Génération du compte..." : "Créer mon compte et mon ID"}
          </Button>
        </form>

        {/* Login prompt */}
        <div className="pt-4 border-t border-white/[0.08] text-center space-y-2">
          <p className="text-xs text-[#9E9890]">
            Vous possédez déjà un compte ?
          </p>
          <button
            type="button"
            onClick={() => onNavigate("connexion")}
            className="text-xs font-semibold text-[#C8A452] hover:text-[#D4AF37] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Se connecter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
