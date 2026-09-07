/**
 * @file NewGameModal.tsx
 * Dialog allowing configuration of game mode, AI difficulty, and starting player color.
 */

import { Bot, Play, Sparkles, User, Users } from "lucide-react";
import React, { useState } from "react";
import { AiDifficulty, GameMode, Player } from "../../game/types/gameTypes";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (mode: GameMode, difficulty: AiDifficulty, playerColor: Player) => void;
  initialDifficulty?: AiDifficulty;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  initialDifficulty = "medium",
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>("ai");
  const [selectedDifficulty, setSelectedDifficulty] = useState<AiDifficulty>(initialDifficulty);
  const [selectedColor, setSelectedColor] = useState<Player>("white");

  if (!isOpen) return null;

  const handleStart = () => {
    // If player chooses White in AI mode, AI plays Black; and vice versa
    const aiColor: Player = selectedColor === "white" ? "black" : "white";
    onStartGame(selectedMode, selectedDifficulty, aiColor);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurer une nouvelle partie"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Mode selection */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
            Mode de jeu
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedMode("ai")}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                selectedMode === "ai"
                  ? "bg-[#161616] border-[#D4AF37] shadow-md shadow-[#D4AF37]/10"
                  : "bg-[#111111] border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-[#E6E6E6]">
                <Bot className="w-4 h-4 text-[#D4AF37]" />
                <span>Contre l'IA</span>
              </div>
              <p className="text-xs text-white/50">
                Affrontez l'algorithme Minimax Alpha-Beta.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("pvp")}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                selectedMode === "pvp"
                  ? "bg-[#161616] border-[#D4AF37] shadow-md shadow-[#D4AF37]/10"
                  : "bg-[#111111] border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-[#E6E6E6]">
                <Users className="w-4 h-4 text-[#D4AF37]" />
                <span>2 Joueurs (Pass & Play)</span>
              </div>
              <p className="text-xs text-white/50">
                Jouez à tour de rôle sur le même appareil.
              </p>
            </button>
          </div>
        </div>

        {/* AI Difficulty (if AI mode) */}
        {selectedMode === "ai" && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
              Niveau de difficulté
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "easy", label: "Facile", desc: "Idéal pour débuter" },
                  { id: "medium", label: "Moyen", desc: "Minimax 2 coups" },
                  { id: "hard", label: "Difficile", desc: "Minimax 3 coups optimisé" },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDifficulty(d.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    selectedDifficulty === d.id
                      ? "bg-[#181818] border-[#D4AF37] text-[#D4AF37] shadow-sm font-bold"
                      : "bg-[#111111] border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">{d.label}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player color choice */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
            Votre couleur
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedColor("white")}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                selectedColor === "white"
                  ? "bg-[#161616] border-[#D4AF37]"
                  : "bg-[#111111] border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#F5F5F0] border border-[#E0E0D8] shadow-xs" />
              <div className="text-left">
                <div className="text-xs font-bold text-[#E6E6E6]">Blancs</div>
                <div className="text-[10px] text-white/40">Joue en 1er</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedColor("black")}
              className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                selectedColor === "black"
                  ? "bg-[#161616] border-[#D4AF37]"
                  : "bg-[#111111] border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[#252525] border border-white/20 shadow-xs" />
              <div className="text-left">
                <div className="text-xs font-bold text-[#E6E6E6]">Noirs</div>
                <div className="text-[10px] text-white/40">Joue en 2nd</div>
              </div>
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <Button variant="ghost" size="md" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleStart}
            icon={<Play className="w-4 h-4 fill-current" />}
          >
            Lancer la partie
          </Button>
        </div>
      </div>
    </Modal>
  );
};
