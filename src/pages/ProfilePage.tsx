/**
 * @file ProfilePage.tsx
 * Authenticated Player Profile Page with 6-character Unique ID,
 * Isa rating, match stats, and copy ID button.
 */

import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Star,
  Trophy,
  Shield,
  TrendingUp,
  History,
  Calendar,
  User,
  LogOut,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { api } from "../services/api";
import { RatingHistoryEntry } from "../game/types/userTypes";

interface ProfilePageProps {
  onNavigate: (route: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, logout, updateProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
      api.getRatingHistory().then(setRatingHistory).catch(console.warn);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto py-16 text-center space-y-4 px-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#C8A452]/10 border border-[#C8A452]/30 flex items-center justify-center text-[#C8A452]">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#F5F3EE]">Profil non accessible</h2>
        <p className="text-xs text-[#9E9890]">
          Veuillez vous connecter pour accéder à votre profil joueur et à votre historique Isa.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="primary" size="md" onClick={() => onNavigate("connexion")}>
            Se connecter
          </Button>
          <Button variant="ghost" size="md" onClick={() => onNavigate("inscription")}>
            Créer un compte
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.player_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setSaveError(null);
    try {
      await updateProfile({ username: newUsername.trim() });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setSaveError(err?.message || "Erreur lors de la mise à jour");
      setTimeout(() => setSaveError(null), 4000);
    }
  };

  const winRate =
    user.games_played > 0 ? Math.round((user.wins / user.games_played) * 1000) / 10 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      {/* Top Banner Card */}
      <div className="relative overflow-hidden bg-[#141210] border border-[#C8A452]/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C8A452]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative">
            <img
              src={
                user.avatar_url ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`
              }
              alt={user.username}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-[#C8A452]/60 shadow-lg shadow-black/60 bg-[#1A1816]"
            />
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Actif</span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="px-2.5 py-1 bg-white/10 border border-[#C8A452] rounded-lg text-lg font-bold text-[#F5F3EE] focus:outline-none"
                    autoFocus
                  />
                  <Button type="submit" variant="primary" size="sm">
                    Enregistrer
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuler
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold uppercase tracking-wider text-[#F5F3EE]">
                    {user.username}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-lg text-[#9E9890] hover:text-[#C8A452] hover:bg-white/5 transition-colors cursor-pointer"
                    title="Modifier le pseudo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Modifié !</span>
                </span>
              )}

              {saveError && (
                <span className="text-xs text-red-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>{saveError}</span>
                </span>
              )}
            </div>

            {/* Unique 6-character Player ID Badge with Copy button */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <div className="px-3 py-1.5 rounded-xl bg-[#0D0B0A] border border-[#C8A452]/40 flex items-center gap-2">
                <span className="text-[11px] text-[#9E9890] uppercase tracking-wider font-semibold">
                  ID JOUEUR :
                </span>
                <span className="text-sm font-mono font-bold tracking-widest text-[#C8A452]">
                  {user.player_id}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyId}
                className="px-3 py-1.5 rounded-xl bg-[#C8A452]/10 hover:bg-[#C8A452]/20 border border-[#C8A452]/30 text-xs font-medium text-[#C8A452] hover:text-[#D4AF37] transition-all flex items-center gap-1.5 cursor-pointer"
                title="Copier mon ID à 6 chiffres"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier mon ID</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-[#9E9890] pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#C8A452]" />
                <span>
                  Membre depuis {new Date(user.created_at).toLocaleDateString("fr-FR")}
                </span>
              </span>
              <span className="text-white/20">|</span>
              <span className="font-mono text-[11px]">{user.email}</span>
            </div>
          </div>

          {/* Large Isa Rating Callout */}
          <div className="w-full sm:w-auto p-4 rounded-2xl bg-gradient-to-b from-[#1E1B17] to-[#12100E] border border-[#C8A452]/40 text-center space-y-1 shadow-md">
            <div className="flex items-center justify-center gap-1.5 text-xs uppercase font-semibold text-[#C8A452] tracking-wider">
              <Star className="w-4 h-4 fill-[#C8A452]" />
              <span>Classement Isa</span>
            </div>
            <div className="text-3xl sm:text-4xl font-serif font-extrabold text-[#F5F3EE] tracking-tight">
              {user.isa}
            </div>
            <div className="text-[10px] text-[#9E9890]">Système officiel Fanorona</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#9E9890]">
            <span>Parties jouées</span>
            <Shield className="w-4 h-4 text-[#C8A452]" />
          </div>
          <div className="text-2xl font-bold text-[#F5F3EE]">{user.games_played}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#9E9890]">
            <span>Victoires</span>
            <Trophy className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{user.wins}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#9E9890]">
            <span>Défaites</span>
            <span className="text-xs font-mono text-red-400">✕</span>
          </div>
          <div className="text-2xl font-bold text-red-400/90">{user.losses}</div>
        </div>

        <div className="p-4 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#9E9890]">
            <span>Taux de victoire</span>
            <TrendingUp className="w-4 h-4 text-[#C8A452]" />
          </div>
          <div className="text-2xl font-bold text-[#F5F3EE]">{winRate}%</div>
        </div>
      </div>

      {/* Isa Rating History Section */}
      <div className="bg-[#141210] border border-white/[0.08] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-serif font-bold text-[#F5F3EE]">
            <History className="w-5 h-5 text-[#C8A452]" />
            <span>Historique des variations Isa</span>
          </div>
          <span className="text-xs text-[#9E9890]">30 dernières parties</span>
        </div>

        {ratingHistory.length === 0 ? (
          <p className="text-xs text-[#9E9890] italic py-4 text-center">
            Aucun historique de partie classée pour le moment. Jouez une partie classée pour faire évoluer votre Isa !
          </p>
        ) : (
          <div className="divide-y divide-white/[0.06] overflow-x-auto">
            {ratingHistory.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between text-xs gap-4"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#F5F3EE]">{item.reason}</div>
                  <div className="text-[10px] text-[#9E9890]">
                    {new Date(item.created_at).toLocaleString("fr-FR")}
                  </div>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-[#9E9890]">
                    {item.old_rating} → {item.new_rating}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                      item.rating_change > 0
                        ? "bg-emerald-500/10 text-emerald-400"
                        : item.rating_change < 0
                        ? "bg-red-500/10 text-red-400"
                        : "bg-white/5 text-white/70"
                    }`}
                  >
                    {item.rating_change > 0 ? `+${item.rating_change}` : item.rating_change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={() => onNavigate("game")}>
          Retour au jeu
        </Button>
        <button
          type="button"
          onClick={logout}
          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-medium text-red-400 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
};
