/**
 * @file ChallengeFriendModal.tsx
 * Modal to send a challenge to a friend with color and time control options.
 * Inspired by Chess.com's challenge interface.
 */

import { Clock, Flag, Zap } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export interface ChallengeFriendModalProps {
  isOpen: boolean;
  friendName: string;
  friendPhoto: string;
  onClose: () => void;
  onChallenge: (playerColor: "white" | "black" | "random", timeControl: number) => Promise<void>;
  isLoading?: boolean;
}

const TIME_CONTROLS = [
  { label: "1 min", value: 1 },
  { label: "3 min", value: 3 },
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
];

export const ChallengeFriendModal: React.FC<ChallengeFriendModalProps> = ({
  isOpen,
  friendName,
  friendPhoto,
  onClose,
  onChallenge,
  isLoading = false,
}) => {
  const [selectedColor, setSelectedColor] = useState<"white" | "black" | "random">("random");
  const [selectedTime, setSelectedTime] = useState(5);
  const [isSending, setIsSending] = useState(false);

  const handleChallenge = async () => {
    setIsSending(true);
    try {
      await onChallenge(selectedColor, selectedTime);
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Défi de partie" maxWidth="md">
      <div className="space-y-5 text-sm">
        {/* Opponent Info */}
        <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.08]">
          {friendPhoto && (
            <img
              src={friendPhoto}
              alt={friendName}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div>
            <div className="font-semibold text-[#F5F3EE]">Défier {friendName}</div>
            <div className="text-xs text-[#9E9890]">Au Fanorona</div>
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider">
            Couleur des pièces
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Blanc", value: "white" as const },
              { label: "Aléatoire", value: "random" as const },
              { label: "Noir", value: "black" as const },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedColor(option.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  selectedColor === option.value
                    ? "bg-[#C8A452]/20 border-[#C8A452] text-[#C8A452]"
                    : "bg-white/[0.04] border-white/[0.08] text-[#9E9890] hover:border-white/[0.15]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Control Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#F5F3EE] uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Cadence
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_CONTROLS.map((tc) => (
              <button
                key={tc.value}
                onClick={() => setSelectedTime(tc.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  selectedTime === tc.value
                    ? "bg-[#C8A452]/20 border-[#C8A452] text-[#C8A452]"
                    : "bg-white/[0.04] border-white/[0.08] text-[#9E9890] hover:border-white/[0.15]"
                }`}
              >
                {tc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 bg-white/[0.04] rounded-lg border border-white/[0.08] text-xs text-[#9E9890]">
          <div className="flex items-center justify-between mb-2">
            <span>Résumé du défi</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Adversaire</span>
              <span className="text-[#F5F3EE] font-medium">{friendName}</span>
            </div>
            <div className="flex justify-between">
              <span>Votre couleur</span>
              <span className="text-[#F5F3EE] font-medium capitalize">
                {selectedColor === "random" ? "Aléatoire" : selectedColor === "white" ? "Blanc" : "Noir"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Temps par joueur</span>
              <span className="text-[#F5F3EE] font-medium">{selectedTime} min</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleChallenge}
            disabled={isSending || isLoading}
            icon={<Flag className="w-4 h-4" />}
          >
            {isSending ? "Envoi..." : "Envoyer le défi"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
