/**
 * @file FriendsPage.tsx
 * Friends, challenges, and multiplayer social hub.
 */

import { AlertCircle, CheckCircle2, Mail, Swords, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FriendsPanel } from "../components/multiplayer/FriendsPanel";
import { useAuth } from "../context/AuthContext";
import { useMultiplayer } from "../hooks/useMultiplayer";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

export const FriendsPage: React.FC = () => {
  const { user } = useAuth();
  const [multiState, multiActions] = useMultiplayer(user?.uid);
  const [activeTab, setActiveTab] = useState<"friends" | "challenges" | "notifications">("friends");
  const [isAcceptingChallenge, setIsAcceptingChallenge] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    multiActions.refreshFriends();
    multiActions.refreshChallenges();
  }, []);

  if (!user) {
    return (
      <div className="w-full px-3 sm:px-4 py-8 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-[#C8A452]" />
        <div className="text-center">
          <h2 className="text-lg font-serif font-semibold text-[#F5F3EE] mb-2">Connectez-vous</h2>
          <p className="text-sm text-[#9E9890]">
            Vous devez être connecté pour accéder au système d'amis et aux défis multiplayer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5F3EE] mb-2">Amis & Défis</h1>
        <p className="text-sm text-[#9E9890]">Gérez vos amis, acceptez des défis et jouez au Fanorona en multijoueur.</p>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-3xl mx-auto flex gap-2">
        {[
          { id: "friends" as const, label: "Amis", count: multiState.friends.length + multiState.pendingFriendRequests.length },
          { id: "challenges" as const, label: "Défis", count: multiState.pendingChallenges.length },
          { id: "notifications" as const, label: "Notifications", count: multiState.notifications.filter((n) => !n.read).length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? "bg-[#C8A452]/20 text-[#C8A452] border border-[#C8A452]"
                : "bg-white/[0.04] text-[#9E9890] border border-white/[0.08] hover:border-white/[0.15]"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {tab.count > 9 ? "9+" : tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="max-w-3xl mx-auto">
        {/* Friends Tab */}
        {activeTab === "friends" && (
          <FriendsPanel
            friends={multiState.friends}
            pendingRequests={multiState.pendingFriendRequests}
            onChallenge={async (friendId, name, photo, color, time) => {
              const challengeId = await multiActions.challengeFriend(
                friendId,
                name,
                photo,
                color,
                time
              );
              if (challengeId) {
                // Show success message
              }
            }}
            onAcceptRequest={multiActions.acceptFriendRequest}
            onRejectRequest={multiActions.rejectFriendRequest}
            onSendRequest={multiActions.sendFriendRequest}
            isLoading={multiState.isLoading}
          />
        )}

        {/* Challenges Tab */}
        {activeTab === "challenges" && (
          <div className="space-y-3 bg-white/[0.03] rounded-lg border border-white/[0.08] p-4">
            <div className="text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider">
              Défis reçus ({multiState.pendingChallenges.length})
            </div>

            {multiState.pendingChallenges.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#9E9890]">
                Aucun défi pour le moment. Demandez à un ami de vous défier!
              </div>
            ) : (
              <div className="space-y-2">
                {multiState.pendingChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="flex items-center justify-between p-3 bg-white/[0.02] rounded border border-white/[0.08] hover:border-white/[0.15] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {challenge.challengerPhoto && (
                        <img
                          src={challenge.challengerPhoto}
                          alt={challenge.challengerName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[#F5F3EE] truncate">
                          {challenge.challengerName}
                        </div>
                        <div className="text-xs text-[#9E9890]">
                          {challenge.timeControl} min • 
                          {challenge.playerColor === "white"
                            ? "Blanc"
                            : challenge.playerColor === "black"
                              ? "Noir"
                              : "Aléatoire"}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setIsAcceptingChallenge(challenge.id);
                          try {
                            await multiActions.acceptChallenge(challenge.id);
                            await multiActions.refreshChallenges();
                          } finally {
                            setIsAcceptingChallenge(null);
                          }
                        }}
                        disabled={isAcceptingChallenge === challenge.id}
                        className="p-2 rounded hover:bg-green-500/10 text-green-400 transition-colors disabled:opacity-50"
                        title="Accepter"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          await multiActions.rejectChallenge(challenge.id);
                          await multiActions.refreshChallenges();
                        }}
                        className="p-2 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                        title="Refuser"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-3 bg-white/[0.03] rounded-lg border border-white/[0.08] p-4">
            <div className="text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider">
              Notifications ({multiState.notifications.length})
            </div>

            {multiState.notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#9E9890]">
                Aucune notification
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {multiState.notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => multiActions.markNotificationAsRead(notif.id)}
                    className={`p-3 rounded border transition-colors cursor-pointer ${
                      notif.read
                        ? "bg-white/[0.02] border-white/[0.08] opacity-60"
                        : "bg-[#C8A452]/10 border-[#C8A452]/30 hover:bg-[#C8A452]/15"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {notif.senderPhoto && (
                        <img
                          src={notif.senderPhoto}
                          alt={notif.senderName}
                          className="w-8 h-8 rounded-full object-cover mt-0.5"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#F5F3EE]">{notif.title}</div>
                        <div className="text-xs text-[#9E9890] line-clamp-2">{notif.message}</div>
                        <div className="text-[10px] text-[#6B655E] mt-1">
                          {new Date(notif.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {multiState.error && (
        <div className="max-w-3xl mx-auto p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
          Erreur: {multiState.error}
        </div>
      )}
    </div>
  );
};
