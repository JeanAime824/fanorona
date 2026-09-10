/**
 * @file FriendsPage.tsx
 * Complete Friends Hub: Search by Player ID / Username, Friend Requests Management,
 * Presence Indicators (En ligne, En partie, Hors ligne), and Direct Game Invitations.
 */

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  UserPlus,
  Gamepad2,
  Check,
  X,
  Clock,
  Star,
  Trash2,
  ExternalLink,
  Shield,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { UserProfile, UserSearchResult } from "../game/types/userTypes";
import { Button } from "../components/ui/Button";

interface FriendsPageProps {
  onNavigate: (route: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onInviteToGame?: (friend: UserProfile) => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({
  onNavigate,
  onSelectPlayer,
  onInviteToGame,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");

  // Data states
  const [friendsList, setFriendsList] = useState<{ id: string; friend: UserProfile; created_at: string }[]>([]);
  const [pendingReceived, setPendingReceived] = useState<{ id: string; sender: UserProfile; created_at: string }[]>([]);
  const [pendingSent, setPendingSent] = useState<{ id: string; receiver: UserProfile; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadFriendsData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [friends, requests] = await Promise.all([api.getFriends(), api.getFriendRequests()]);
      setFriendsList(friends);
      setPendingReceived(requests.received);
      setPendingSent(requests.sent);
    } catch (err) {
      console.warn("Erreur chargement amis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriendsData();
  }, [user]);

  // Load player search results (including all registered players on empty query)
  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await api.searchUsers(query.trim());
      setSearchResults(results);
    } catch (err) {
      console.warn("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  const handleSendRequest = async (targetUserId: string, playerId?: string) => {
    try {
      await api.sendFriendRequest({ target_user_id: targetUserId, player_id: playerId });
      setActionMessage("Demande d'ami envoyée !");
      setTimeout(() => setActionMessage(null), 3000);
      loadFriendsData();
      // Update local search result status
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, relation_status: "pending_sent" } : u))
      );
    } catch (err: any) {
      alert(err?.message || "Impossible d'envoyer la demande");
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      setActionMessage("Demande acceptée !");
      setTimeout(() => setActionMessage(null), 3000);
      loadFriendsData();
    } catch (err: any) {
      alert(err?.message || "Impossible d'accepter");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await api.rejectFriendRequest(requestId);
      loadFriendsData();
    } catch (err: any) {
      alert(err?.message || "Erreur");
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await api.cancelFriendRequest(requestId);
      loadFriendsData();
    } catch (err: any) {
      alert(err?.message || "Erreur");
    }
  };

  const handleDeleteFriend = async (friendshipOrUserId: string) => {
    if (!confirm("Voulez-vous vraiment retirer cet ami de votre liste ?")) return;
    try {
      await api.deleteFriend(friendshipOrUserId);
      loadFriendsData();
    } catch (err: any) {
      alert(err?.message || "Impossible de supprimer l'ami");
    }
  };

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto py-16 text-center space-y-4 px-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#C8A452]/10 border border-[#C8A452]/30 flex items-center justify-center text-[#C8A452]">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#F5F3EE]">Espace Amis & Défis</h2>
        <p className="text-xs text-[#9E9890]">
          Connectez-vous pour ajouter des amis avec leur ID à 6 chiffres et lancer des parties classées en temps réel.
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

  const getStatusBadge = (status: "ONLINE" | "IN_GAME" | "OFFLINE") => {
    if (status === "ONLINE") {
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>En ligne</span>
        </span>
      );
    }
    if (status === "IN_GAME") {
      return (
        <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>En partie</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs text-zinc-400">
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
        <span>Hors ligne</span>
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#141210] border border-[#C8A452]/30 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-[#C8A452] uppercase tracking-wider">
            <Users className="w-4 h-4 text-[#C8A452]" />
            <span>Communauté & Défis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-[#F5F3EE]">
            Mes Amis & Adversaires
          </h1>
          <p className="text-xs text-[#9E9890]">
            Ajoutez des joueurs et affrontez-les.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadFriendsData}
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#9E9890] hover:text-[#F5F3EE] transition-colors cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button variant="primary" size="md" onClick={() => setActiveTab("search")}>
            <UserPlus className="w-4 h-4 mr-2" />
            <span>Ajouter un joueur</span>
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab("friends")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "friends"
              ? "bg-[#C8A452]/20 text-[#C8A452] border border-[#C8A452]/40"
              : "text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04]"
          }`}
        >
          <span>Mes Amis</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-[#F5F3EE]">
            {friendsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "requests"
              ? "bg-[#C8A452]/20 text-[#C8A452] border border-[#C8A452]/40"
              : "text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04]"
          }`}
        >
          <span>Demandes</span>
          {pendingReceived.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-[10px] text-white font-bold animate-bounce">
              {pendingReceived.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "search"
              ? "bg-[#C8A452]/20 text-[#C8A452] border border-[#C8A452]/40"
              : "text-[#9E9890] hover:text-[#F5F3EE] hover:bg-white/[0.04]"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Recherche Joueur</span>
        </button>
      </div>

      {/* TAB 1: FRIENDS LIST */}
      {activeTab === "friends" && (
        <div className="space-y-4">
          {friendsList.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#141210] border border-white/[0.08] text-center space-y-3">
              <Users className="w-10 h-10 mx-auto text-[#9E9890]/40" />
              <div className="text-sm font-semibold text-[#F5F3EE]">Aucun ami pour le moment</div>
              <p className="text-xs text-[#9E9890] max-w-sm mx-auto">
                Recherchez des joueurs avec leur pseudo ou leur identifiant à 6 chiffres pour les ajouter à votre liste.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setActiveTab("search")}>
                Trouver un joueur
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {friendsList.map(({ id: friendshipId, friend }) => (
                <div
                  key={friendshipId}
                  className="p-4 rounded-xl bg-[#141210] border border-white/[0.08] hover:border-[#C8A452]/30 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        friend.avatar_url ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                          friend.username
                        )}`
                      }
                      alt={friend.username}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-[#1A1816]"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#F5F3EE] truncate">
                          {friend.username}
                        </h3>
                        {getStatusBadge(friend.status)}
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[11px] font-mono font-bold text-[#C8A452]">
                          ID: {friend.player_id}
                        </span>
                        <span className="text-[11px] text-[#9E9890]">·</span>
                        <span className="text-[11px] text-[#9E9890] flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-[#C8A452] text-[#C8A452]" />
                          <span>{friend.isa} Isa</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (onInviteToGame) onInviteToGame(friend);
                          else onNavigate("game");
                        }}
                      >
                        <Gamepad2 className="w-3.5 h-3.5 mr-1 text-[#C8A452]" />
                        <span>Jouer</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectPlayer(friend.player_id)}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        <span>Profil</span>
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFriend(friendshipId)}
                      className="p-1.5 rounded-lg text-[#9E9890] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Retirer cet ami"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-6">
          {/* Received */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#C8A452] uppercase tracking-wider flex items-center gap-2">
              <span>Demandes reçues</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#C8A452]/20 text-[10px] text-[#C8A452]">
                {pendingReceived.length}
              </span>
            </h2>

            {pendingReceived.length === 0 ? (
              <p className="text-xs text-[#9E9890] italic py-2">
                Aucune demande d'ami en attente de réponse.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingReceived.map(({ id: reqId, sender }) => (
                  <div
                    key={reqId}
                    className="p-3.5 rounded-xl bg-[#141210] border border-white/[0.08] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          sender.avatar_url ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                            sender.username
                          )}`
                        }
                        alt={sender.username}
                        className="w-9 h-9 rounded-xl object-cover border border-white/10"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#F5F3EE]">{sender.username}</div>
                        <div className="text-[10px] font-mono text-[#9E9890]">
                          ID: <span className="text-[#C8A452] font-bold">{sender.player_id}</span> · {sender.isa} Isa
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAcceptRequest(reqId)}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        <span>Accepter</span>
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleRejectRequest(reqId)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-red-500/10 hover:text-red-400 text-xs text-[#9E9890] transition-colors cursor-pointer"
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent */}
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <h2 className="text-xs font-semibold text-[#9E9890] uppercase tracking-wider flex items-center gap-2">
              <span>Demandes envoyées</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-[#F5F3EE]">
                {pendingSent.length}
              </span>
            </h2>

            {pendingSent.length === 0 ? (
              <p className="text-xs text-[#9E9890] italic py-2">
                Aucune demande envoyée en attente.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingSent.map(({ id: reqId, receiver }) => (
                  <div
                    key={reqId}
                    className="p-3.5 rounded-xl bg-[#141210] border border-white/[0.08] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center font-bold text-xs text-[#C8A452]">
                        {receiver.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#F5F3EE]">{receiver.username}</div>
                        <div className="text-[10px] font-mono text-[#9E9890]">
                          ID: {receiver.player_id} · {receiver.isa} Isa
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCancelRequest(reqId)}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-red-500/10 hover:text-red-400 text-xs text-[#9E9890] transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SEARCH FOR PLAYERS */}
      {activeTab === "search" && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par ID Joueur (ex: 849201) ou pseudo..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-[#141210] border border-[#C8A452]/40 rounded-xl text-sm text-[#F5F3EE] placeholder-[#6B655E] focus:outline-none focus:border-[#C8A452] shadow-xl"
            />
            <Search className="w-4 h-4 text-[#C8A452] absolute left-3.5 top-3.5" />
          </div>

          <div className="text-[11px] text-[#9E9890]">
            💡 <strong className="text-[#F5F3EE]">Conseil :</strong> Recherchez vos amis par leur nom d'utilisateur, adresse email ou identifiant joueur à 6 chiffres pour les défier instantanément.
          </div>

          {/* Results */}
          {isSearching ? (
            <div className="py-8 text-center text-xs text-[#9E9890] animate-pulse">
              Recherche en cours...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-white/[0.06] bg-[#141210] border border-white/[0.08] rounded-xl overflow-hidden">
              {searchResults.map((player) => (
                <div
                  key={player.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        player.avatar_url ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                          player.username
                        )}`
                      }
                      alt={player.username}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#F5F3EE]">{player.username}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#C8A452]/10 text-[#C8A452] font-bold">
                          {player.player_id}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#9E9890] pt-0.5">
                        ⭐ {player.isa} Isa · {player.games_played} parties ({player.win_rate}% victoires)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectPlayer(player.player_id)}
                    >
                      Profil
                    </Button>

                    {player.relation_status === "friends" ? (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Amis</span>
                      </div>
                    ) : player.relation_status === "pending_sent" ? (
                      <div className="px-3 py-1.5 rounded-xl bg-white/5 text-[#9E9890] text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#C8A452]" />
                        <span>Demande envoyée</span>
                      </div>
                    ) : player.relation_status === "pending_received" ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setActiveTab("requests")}
                      >
                        Voir demande
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendRequest(player.id, player.player_id)}
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                        <span>Ajouter</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-8 text-center text-xs text-[#9E9890] bg-[#141210] rounded-xl border border-white/[0.08]">
              Aucun joueur trouvé pour "{searchQuery}". Vérifiez le pseudo ou l'ID.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
