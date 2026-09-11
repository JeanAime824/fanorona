/**
 * @file ChallengeManager.tsx
 * Chess.com-like real-time challenge orchestrator for Fanorona.
 * Manages outgoing and incoming challenges with live Socket.io sync,
 * sound notifications, and seamless automatic game routing.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Swords,
  Clock,
  Zap,
  Check,
  X,
  Loader2,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { socketService } from "../../services/socketService";
import { api } from "../../services/api";
import { sound } from "../../services/audio/soundSynthesizer";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export interface OutgoingChallengeTarget {
  id: string;
  username: string;
  player_id?: string;
  avatar_url?: string;
  isa?: number;
}

export interface IncomingChallengeData {
  id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar?: string;
  sender_isa?: number;
  time_control: number;
  game_type: "ranked" | "casual";
  player_color: "white" | "black" | "random";
  created_at: string;
}

export interface ChallengeManagerProps {
  onStartMultiplayerGame: (gameData: {
    gameId: string;
    gameCode: string;
    timeControl: number;
    gameType: "ranked" | "casual";
    playerColor: "white" | "black";
    whitePlayer: { id: string; username: string; avatar_url?: string; isa?: number };
    blackPlayer: { id: string; username: string; avatar_url?: string; isa?: number };
  }) => void;
  // External trigger to open challenge modal for a specific user
  pendingTargetUser: OutgoingChallengeTarget | null;
  onClearPendingTargetUser: () => void;
}

const TIME_OPTIONS = [
  { label: "1 min", value: 60, desc: "Bullet" },
  { label: "3 min", value: 180, desc: "Blitz" },
  { label: "5 min", value: 300, desc: "Rapide" },
  { label: "10 min", value: 600, desc: "Classique" },
  { label: "Illimité", value: 0, desc: "Sans chrono" },
];

export const ChallengeManager: React.FC<ChallengeManagerProps> = ({
  onStartMultiplayerGame,
  pendingTargetUser,
  onClearPendingTargetUser,
}) => {
  const { user } = useAuth();

  // Incoming challenge state
  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallengeData | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Outgoing challenge creation state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState(300);
  const [selectedGameType, setSelectedGameType] = useState<"ranked" | "casual">("ranked");
  const [selectedColor, setSelectedColor] = useState<"white" | "black" | "random">("random");
  const [isSending, setIsSending] = useState(false);

  // Outgoing waiting challenge state
  const [activeSentChallenge, setActiveSentChallenge] = useState<{
    id: string;
    targetName: string;
    timeControl: number;
    gameType: string;
  } | null>(null);

  // Open modal if target user provided from outside
  useEffect(() => {
    if (pendingTargetUser) {
      setIsCreateModalOpen(true);
    }
  }, [pendingTargetUser]);

  // Connect socket and listen to challenge events
  useEffect(() => {
    if (!user) return;

    socketService.authenticate(user.id);

    // 1. Incoming challenge received
    socketService.onChallengeReceived((challenge: IncomingChallengeData) => {
      setIncomingChallenge(challenge);
      sound.playChallenge();
    });

    // 2. Challenge was accepted -> launch game room
    socketService.onChallengeAccepted((payload: any) => {
      sound.playGameStart();
      setIncomingChallenge(null);
      setActiveSentChallenge(null);
      setIsCreateModalOpen(false);
      onClearPendingTargetUser();

      const myId = user.id;
      const isWhite = payload.white_player_id === myId;
      const myColor = isWhite ? "white" : "black";

      onStartMultiplayerGame({
        gameId: payload.game_id || payload.id,
        gameCode: payload.game_code || payload.code || "",
        timeControl: payload.time_control || 300,
        gameType: payload.game_type || "ranked",
        playerColor: myColor,
        whitePlayer: payload.white_player || { id: payload.white_player_id, username: "Joueur Blanc" },
        blackPlayer: payload.black_player || { id: payload.black_player_id, username: "Joueur Noir" },
      });
    });

    // 3. Challenge was declined
    socketService.onChallengeDeclined(() => {
      if (activeSentChallenge) {
        alert(`${activeSentChallenge.targetName} a refusé le défi.`);
      }
      setActiveSentChallenge(null);
    });

    // 4. Challenge cancelled by challenger
    socketService.onChallengeCancelled(() => {
      setIncomingChallenge(null);
    });
  }, [user, activeSentChallenge, onClearPendingTargetUser, onStartMultiplayerGame]);

  // Handle Send Challenge
  const handleSendChallenge = async () => {
    if (!pendingTargetUser) return;
    setIsSending(true);

    try {
      const res = await api.sendChallenge({
        target_user_id: pendingTargetUser.id,
        player_id: pendingTargetUser.player_id,
        time_control: selectedTimeControl,
        game_type: selectedGameType,
        player_color: selectedColor,
      });

      setIsCreateModalOpen(false);
      setActiveSentChallenge({
        id: res.challenge_id || res.id,
        targetName: pendingTargetUser.username,
        timeControl: selectedTimeControl,
        gameType: selectedGameType,
      });
    } catch (err: any) {
      alert(err?.message || "Impossible d'envoyer le défi.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle Cancel Outgoing Challenge
  const handleCancelSentChallenge = async () => {
    if (!activeSentChallenge) return;
    try {
      await api.cancelChallenge(activeSentChallenge.id);
    } catch (e) {
      console.warn("Cancel challenge error:", e);
    }
    setActiveSentChallenge(null);
    onClearPendingTargetUser();
  };

  // Handle Accept Incoming Challenge
  const handleAcceptIncoming = async () => {
    if (!incomingChallenge) return;
    setIsAccepting(true);
    try {
      const res = await api.acceptChallenge(incomingChallenge.id);
      // Backend automatically emits challenge_accepted via Socket.io
      setIncomingChallenge(null);
    } catch (err: any) {
      alert(err?.message || "Impossible d'accepter le défi.");
      setIsAccepting(false);
    }
  };

  // Handle Reject Incoming Challenge
  const handleRejectIncoming = async () => {
    if (!incomingChallenge) return;
    try {
      await api.rejectChallenge(incomingChallenge.id);
    } catch (e) {
      console.warn("Reject error:", e);
    }
    setIncomingChallenge(null);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    onClearPendingTargetUser();
  };

  return (
    <>
      {/* 1. REAL-TIME INCOMING CHALLENGE FLOATING CARD (CHESS.COM STYLE) */}
      {incomingChallenge && (
        <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 rounded-2xl bg-[#141210] border-2 border-[#C8A452] shadow-2xl shadow-black/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#C8A452] uppercase tracking-wider">
                <Swords className="w-4 h-4 animate-bounce" />
                <span>Nouveau défi reçu !</span>
              </div>
              <button
                type="button"
                onClick={handleRejectIncoming}
                className="p-1 text-[#9E9890] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3.5 bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
              <img
                src={
                  incomingChallenge.sender_avatar ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                    incomingChallenge.sender_username
                  )}`
                }
                alt={incomingChallenge.sender_username}
                className="w-12 h-12 rounded-xl object-cover border border-[#C8A452]/40 bg-[#1C1A18]"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#F5F3EE] truncate">
                  {incomingChallenge.sender_username}
                </h4>
                <div className="flex items-center gap-2 text-xs text-[#9E9890] pt-0.5">
                  <span className="flex items-center gap-1 text-[#C8A452] font-semibold">
                    <Star className="w-3 h-3 fill-[#C8A452]" />
                    {incomingChallenge.sender_isa || 1200} Isa
                  </span>
                  <span>•</span>
                  <span className="capitalize font-medium text-[#F5F3EE]">
                    {incomingChallenge.game_type === "ranked" ? "Classée" : "Amicale"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {incomingChallenge.time_control > 0
                      ? `${Math.round(incomingChallenge.time_control / 60)} min`
                      : "Illimité"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <Button
                variant="primary"
                size="md"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white font-bold"
                onClick={handleAcceptIncoming}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                <span>Accepter</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={handleRejectIncoming}
                disabled={isAccepting}
              >
                <X className="w-4 h-4 mr-2" />
                <span>Refuser</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. WAITING FOR OPPONENT DIALOG */}
      {activeSentChallenge && (
        <Modal
          isOpen={true}
          onClose={handleCancelSentChallenge}
          title="Défi en attente"
          maxWidth="sm"
        >
          <div className="text-center py-4 space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#C8A452]/20 border-t-[#C8A452] animate-spin" />
              <Swords className="w-7 h-7 text-[#C8A452]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#F5F3EE]">
                En attente de {activeSentChallenge.targetName}...
              </h3>
              <p className="text-xs text-[#9E9890]">
                Le joueur a reçu votre notification de défi. La partie débutera dès qu'il acceptera.
              </p>
            </div>

            <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.08] text-xs text-[#9E9890] flex justify-around">
              <div>
                <span className="block text-[10px] uppercase font-semibold text-white/40">Cadence</span>
                <span className="text-[#F5F3EE] font-bold">
                  {activeSentChallenge.timeControl > 0
                    ? `${Math.round(activeSentChallenge.timeControl / 60)} min`
                    : "Illimité"}
                </span>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <span className="block text-[10px] uppercase font-semibold text-white/40">Mode</span>
                <span className="text-[#C8A452] font-bold capitalize">
                  {activeSentChallenge.gameType === "ranked" ? "Classée" : "Amicale"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={handleCancelSentChallenge}
              >
                Annuler le défi
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 3. SEND CHALLENGE MODAL (CHESS.COM STYLE CONFIGURATION) */}
      {isCreateModalOpen && pendingTargetUser && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          title="Défier un joueur"
          maxWidth="md"
        >
          <div className="space-y-5 text-sm">
            {/* Target Player Card */}
            <div className="flex items-center gap-3.5 p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.08]">
              <img
                src={
                  pendingTargetUser.avatar_url ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                    pendingTargetUser.username
                  )}`
                }
                alt={pendingTargetUser.username}
                className="w-12 h-12 rounded-xl object-cover border border-[#C8A452]/40 bg-[#1C1A18]"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-serif font-bold text-[#F5F3EE] truncate">
                  {pendingTargetUser.username}
                </h4>
                <div className="flex items-center gap-2 text-xs pt-0.5">
                  <span className="font-mono text-[#C8A452] font-semibold">
                    ID: {pendingTargetUser.player_id || "—"}
                  </span>
                  <span className="text-[#9E9890]">•</span>
                  <span className="text-[#9E9890] flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#C8A452] text-[#C8A452]" />
                    {pendingTargetUser.isa || 1200} Isa
                  </span>
                </div>
              </div>
            </div>

            {/* Time Control Options */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C8A452]" />
                <span>Cadence de jeu</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedTimeControl(opt.value)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedTimeControl === opt.value
                        ? "bg-[#C8A452]/20 border-[#C8A452] text-[#F5F3EE] shadow-md shadow-[#C8A452]/10"
                        : "bg-white/[0.03] border-white/[0.08] text-[#9E9890] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[10px] opacity-70 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Game Type: Ranked vs Casual */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#C8A452]" />
                <span>Type de partie</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGameType("ranked")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedGameType === "ranked"
                      ? "bg-[#C8A452]/20 border-[#C8A452] text-[#F5F3EE]"
                      : "bg-white/[0.03] border-white/[0.08] text-[#9E9890] hover:border-white/20 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold text-[#F5F3EE] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#C8A452]" />
                    <span>Partie Classée</span>
                  </div>
                  <div className="text-[10px] text-[#9E9890] mt-1">
                    Affecte les points de classement Isa des deux joueurs.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGameType("casual")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedGameType === "casual"
                      ? "bg-[#C8A452]/20 border-[#C8A452] text-[#F5F3EE]"
                      : "bg-white/[0.03] border-white/[0.08] text-[#9E9890] hover:border-white/20 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold text-[#F5F3EE] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Partie Amicale</span>
                  </div>
                  <div className="text-[10px] text-[#9E9890] mt-1">
                    Pour s'entraîner sans impact sur le classement.
                  </div>
                </button>
              </div>
            </div>

            {/* Piece Color */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider">
                Couleur de vos pièces
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Aléatoire", value: "random" as const, icon: "🎲" },
                  { label: "Blancs (1er tour)", value: "white" as const, icon: "⚪" },
                  { label: "Noirs", value: "black" as const, icon: "⚫" },
                ].map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => setSelectedColor(col.value)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      selectedColor === col.value
                        ? "bg-[#C8A452]/20 border-[#C8A452] text-[#F5F3EE]"
                        : "bg-white/[0.03] border-white/[0.08] text-[#9E9890] hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span>{col.icon}</span>
                    <span>{col.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <Button variant="ghost" size="sm" onClick={closeCreateModal}>
                Annuler
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSendChallenge}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Swords className="w-4 h-4 mr-2 text-[#C8A452]" />
                )}
                <span>Envoyer le défi</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
