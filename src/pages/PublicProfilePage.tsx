/**
 * @file PublicProfilePage.tsx
 * Public Player Profile view for `/joueur/:playerId`.
 * Displays public stats, Isa rating, and friend request / play invitation action buttons.
 */

import React, { useState, useEffect } from "react";
import { Star, Trophy, Shield, TrendingUp, UserPlus, Gamepad2, Check, ArrowLeft, Clock } from "lucide-react";
import { UserSearchResult } from "../game/types/userTypes";
import { api } from "../services/api";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";

interface PublicProfilePageProps {
  playerId: string;
  onNavigate: (route: string) => void;
  onStartGameWithUser?: (user: UserSearchResult) => void;
}

export const PublicProfilePage: React.FC<PublicProfilePageProps> = ({
  playerId,
  onNavigate,
  onStartGameWithUser,
}) => {
  const { user: currentUser } = useAuth();
  const [player, setPlayer] = useState<UserSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getPublicProfile(playerId)
      .then((data) => {
        if (!data) setError("Joueur introuvable avec cet identifiant.");
        else setPlayer(data);
      })
      .catch((err) => setError(err?.message || "Erreur de chargement du profil"))
      .finally(() => setLoading(false));
  }, [playerId]);

  const handleSendFriendRequest = async () => {
    if (!currentUser) {
      onNavigate("connexion");
      return;
    }
    if (!player) return;
    try {
      await api.sendFriendRequest({ target_user_id: player.id });
      setPlayer({ ...player, relation_status: "pending_sent" });
      setActionSuccess("Demande d'ami envoyée !");
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err?.message || "Impossible d'envoyer la demande");
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-20 text-center text-xs text-[#9E9890] animate-pulse">
        Chargement du profil joueur ({playerId})...
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="w-full max-w-md mx-auto py-16 text-center space-y-4 px-4">
        <h2 className="text-xl font-serif font-bold text-[#F5F3EE]">Joueur introuvable</h2>
        <p className="text-xs text-[#9E9890]">
          L'identifiant "{playerId}" ne correspond à aucun joueur enregistré sur la plateforme.
        </p>
        <Button variant="ghost" size="sm" onClick={() => onNavigate("classement")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Voir le classement global</span>
        </Button>
      </div>
    );
  }

  const isSelf = currentUser && currentUser.id === player.id;

  return (
    <div className="w-full max-w-3xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      <button
        onClick={() => onNavigate("classement")}
        className="text-xs text-[#9E9890] hover:text-[#F5F3EE] flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour au classement</span>
      </button>

      {/* Main Profile Header */}
      <div className="bg-[#141210] border border-[#C8A452]/20 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={
              player.avatar_url ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(player.username)}`
            }
            alt={player.username}
            className="w-24 h-24 rounded-2xl object-cover border-2 border-[#C8A452]/40 bg-[#1A1816] shadow-xl"
          />

          <div className="flex-1 text-center sm:text-left space-y-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-wider text-[#F5F3EE] uppercase">
              {player.username}
            </h1>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <div className="px-3 py-1 rounded-xl bg-[#0D0B0A] border border-[#C8A452]/30 text-xs font-mono text-[#C8A452] font-bold">
                ID : {player.player_id}
              </div>

              {/* Status indicator */}
              <div className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-[#9E9890] flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    player.status === "ONLINE"
                      ? "bg-emerald-400"
                      : player.status === "IN_GAME"
                      ? "bg-amber-400"
                      : "bg-zinc-500"
                  }`}
                />
                <span>
                  {player.status === "ONLINE"
                    ? "En ligne"
                    : player.status === "IN_GAME"
                    ? "En partie"
                    : "Hors ligne"}
                </span>
              </div>
            </div>

            {/* Actions for other users */}
            {!isSelf && (
              <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                {player.relation_status === "friends" ? (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>Vous êtes amis</span>
                  </div>
                ) : player.relation_status === "pending_sent" ? (
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#9E9890] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C8A452]" />
                    <span>Demande envoyée</span>
                  </div>
                ) : player.relation_status === "pending_received" ? (
                  <Button variant="primary" size="sm" onClick={() => onNavigate("amis")}>
                    Voir la demande reçue
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleSendFriendRequest}>
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    <span>Ajouter en ami</span>
                  </Button>
                )}

                {onStartGameWithUser && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onStartGameWithUser(player)}
                  >
                    <Gamepad2 className="w-3.5 h-3.5 mr-1.5 text-[#C8A452]" />
                    <span>Inviter à jouer</span>
                  </Button>
                )}
              </div>
            )}

            {actionSuccess && (
              <p className="text-xs text-emerald-400 font-semibold pt-1">{actionSuccess}</p>
            )}
          </div>

          {/* Isa rating */}
          <div className="p-4 rounded-2xl bg-[#1E1B17] border border-[#C8A452]/40 text-center min-w-[120px]">
            <div className="text-xs uppercase font-semibold text-[#C8A452] flex items-center justify-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#C8A452]" />
              <span>Isa</span>
            </div>
            <div className="text-3xl font-serif font-extrabold text-[#F5F3EE]">{player.isa}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
          <div className="text-xs text-[#9E9890]">Parties</div>
          <div className="text-xl font-bold text-[#F5F3EE]">{player.games_played}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
          <div className="text-xs text-[#9E9890]">Victoires</div>
          <div className="text-xl font-bold text-emerald-400">{player.wins}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
          <div className="text-xs text-[#9E9890]">Défaites</div>
          <div className="text-xl font-bold text-red-400">{player.losses}</div>
        </div>
        <div className="p-4 rounded-xl bg-[#141210] border border-white/[0.08] space-y-1">
          <div className="text-xs text-[#9E9890]">Taux Victoire</div>
          <div className="text-xl font-bold text-[#F5F3EE]">{player.win_rate}%</div>
        </div>
      </div>
    </div>
  );
};
