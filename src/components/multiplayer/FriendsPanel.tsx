/**
 * @file FriendsPanel.tsx
 * Panel showing friends list and friend requests.
 */

import { Check, Minus, Plus, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { ChallengeFriendModal } from "./ChallengeFriendModal";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { FriendshipRecord } from "../../game/types/multiplayerTypes";

export interface FriendsPanelProps {
  friends: FriendshipRecord[];
  pendingRequests: FriendshipRecord[];
  onChallenge: (friendId: string, friendName: string, friendPhoto: string, playerColor: "white" | "black" | "random", timeControl: number) => Promise<void>;
  onAcceptRequest: (friendshipId: string) => Promise<void>;
  onRejectRequest: (friendshipId: string) => Promise<void>;
  onSendRequest: (targetUserId: string, targetUserName: string) => Promise<void>;
  isLoading?: boolean;
}

export const FriendsPanel: React.FC<FriendsPanelProps> = ({
  friends,
  pendingRequests,
  onChallenge,
  onAcceptRequest,
  onRejectRequest,
  onSendRequest,
  isLoading = false,
}) => {
  const [selectedFriend, setSelectedFriend] = useState<FriendshipRecord | null>(null);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleChallengeClick = (friend: FriendshipRecord) => {
    setSelectedFriend(friend);
    setIsChallengeModalOpen(true);
  };

  const handleChallengeSend = async (
    playerColor: "white" | "black" | "random",
    timeControl: number
  ) => {
    if (selectedFriend) {
      await onChallenge(
        selectedFriend.friendId,
        selectedFriend.friendId, // friendName - should come from friend data
        "", // friendPhoto - should come from friend data
        playerColor,
        timeControl
      );
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.08]">
          <div className="text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider mb-2">
            Demandes en attente ({pendingRequests.length})
          </div>
          <div className="space-y-1">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-2 bg-white/[0.02] rounded text-xs"
              >
                <span className="text-[#9E9890]">{request.userId}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onAcceptRequest(request.id)}
                    className="p-1 rounded hover:bg-green-500/10 text-green-400 transition-colors"
                    title="Accepter"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRejectRequest(request.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                    title="Rejeter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.08]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider">
            Amis ({friends.length})
          </div>
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-1 rounded hover:bg-white/[0.1] text-[#9E9890] transition-colors"
            title="Ajouter un ami"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {isSearchOpen && (
          <div className="mb-2 p-2 bg-white/[0.02] rounded border border-white/[0.08]">
            <input
              type="text"
              placeholder="ID utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white/[0.05] border border-white/[0.1] rounded text-[#F5F3EE] placeholder-[#9E9890] focus:outline-none focus:border-[#C8A452]"
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => {
                  if (searchQuery.trim()) {
                    onSendRequest(searchQuery, searchQuery);
                    setSearchQuery("");
                    setIsSearchOpen(false);
                  }
                }}
                className="flex-1 px-2 py-1 text-xs font-medium bg-[#C8A452] text-black rounded hover:bg-[#D4AF37] transition-colors"
              >
                Envoyer
              </button>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-2 py-1 text-xs font-medium bg-white/[0.1] text-[#9E9890] rounded hover:bg-white/[0.15] transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="flex items-center justify-between p-2 bg-white/[0.02] rounded text-xs hover:bg-white/[0.05] transition-colors"
            >
              <span className="text-[#F5F3EE] font-medium truncate flex-1">
                {friend.friendId}
              </span>
              <button
                onClick={() => handleChallengeClick(friend)}
                className="ml-2 p-1 rounded hover:bg-[#C8A452]/10 text-[#C8A452] transition-colors"
                title="Défier"
                disabled={isLoading}
              >
                <Zap className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {friends.length === 0 && !isSearchOpen && (
          <div className="text-center py-4 text-xs text-[#9E9890]">
            Aucun ami pour le moment
          </div>
        )}
      </div>

      {/* Challenge Modal */}
      {selectedFriend && (
        <ChallengeFriendModal
          isOpen={isChallengeModalOpen}
          friendName={selectedFriend.friendId}
          friendPhoto=""
          onClose={() => {
            setIsChallengeModalOpen(false);
            setSelectedFriend(null);
          }}
          onChallenge={handleChallengeSend}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
