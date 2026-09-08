/**
 * @file NewGameModal.tsx
 * Dialog allowing configuration of game mode, AI difficulty, and starting player color.
 * Now includes multiplayer friend challenges!
 */

import { Bot, Clock, Play, Sparkles, User, Users, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AiDifficulty, GameMode, Player } from "../../game/types/gameTypes";
import { useAuth } from "../../context/AuthContext";
import { useMultiplayer } from "../../hooks/useMultiplayer";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (
    mode: GameMode,
    difficulty: AiDifficulty,
    playerColor: Player,
    speedMode?: boolean,
    timeLimit?: number,
    multiplayerGameId?: string,
    multiplayerOpponentId?: string
  ) => void;
  initialDifficulty?: AiDifficulty;
  initialSpeedMode?: boolean;
  initialTimeLimit?: number;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  initialDifficulty = "medium",
  initialSpeedMode = false,
  initialTimeLimit = 30,
}) => {
  const { user } = useAuth();
  const [multiState, multiActions] = useMultiplayer(user?.uid);
  const [selectedMode, setSelectedMode] = useState<GameMode>("ai");
  const [selectedDifficulty, setSelectedDifficulty] = useState<AiDifficulty>(initialDifficulty);
  const [selectedColor, setSelectedColor] = useState<Player>("white");
  const [speedMode, setSpeedMode] = useState<boolean>(initialSpeedMode);
  const [timeLimit, setTimeLimit] = useState<number>(initialTimeLimit);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  if (!isOpen) return null;

  const handleStart = async () => {
    if (selectedMode === "multiplayer" && selectedFriendId) {
      setIsCreatingGame(true);
      try {
        const friend = multiState.friends.find((f) => f.friendId === selectedFriendId);
        if (!friend) throw new Error("Ami non trouvé");

        // Créer la session de jeu multiplayer
        const gameId = await multiActions.createLiveGame(
          selectedFriendId,
          selectedFriendId,
          "",
          selectedColor,
          timeLimit
        );
        onStartGame("multiplayer", "medium", selectedColor, false, timeLimit, gameId, selectedFriendId);
        onClose();
      } catch (error) {
        console.error("Erreur création partie:", error);
      } finally {
        setIsCreatingGame(false);
      }
    } else {
      // Mode AI ou PvP
      const aiColor: Player = selectedColor === "white" ? "black" : "white";
      onStartGame(selectedMode, selectedDifficulty, aiColor, speedMode, timeLimit);
      onClose();
    }
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
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMode("ai")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                selectedMode === "ai"
                  ? "bg-[#161616] border-[#D4AF37] shadow-md shadow-[#D4AF37]/10"
                  : "bg-[#111111] border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#E6E6E6]">
                <Bot className="w-3 h-3 text-[#D4AF37]" />
                <span>IA</span>
              </div>
              <p className="text-[9px] text-white/50">Minimax</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("pvp")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                selectedMode === "pvp"
                  ? "bg-[#161616] border-[#D4AF37] shadow-md shadow-[#D4AF37]/10"
                  : "bg-[#111111] border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#E6E6E6]">
                <Users className="w-3 h-3 text-[#D4AF37]" />
                <span>Local</span>
              </div>
              <p className="text-[9px] text-white/50">Pass & Play</p>
            </button>

            {user && multiState.friends.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedMode("multiplayer")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                  selectedMode === "multiplayer"
                    ? "bg-[#161616] border-[#D4AF37] shadow-md shadow-[#D4AF37]/10"
                    : "bg-[#111111] border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#E6E6E6]">
                  <Zap className="w-3 h-3 text-[#D4AF37]" />
                  <span>Ami</span>
                </div>
                <p className="text-[9px] text-white/50">Multiplayer</p>
              </button>
            )}
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
                  { id: "easy", label: "Facile", desc: "Débuter" },
                  { id: "medium", label: "Moyen", desc: "2 coups" },
                  { id: "hard", label: "Difficile", desc: "3 coups" },
                ] as const
              ).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDifficulty(d.id)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                    selectedDifficulty === d.id
                      ? "bg-[#181818] border-[#D4AF37] text-[#D4AF37] shadow-sm font-bold"
                      : "bg-[#111111] border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold">{d.label}</div>
                  <div className="text-[9px] text-white/40 mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Friend Selection (if Multiplayer mode) */}
        {selectedMode === "multiplayer" && multiState.friends.length > 0 && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
              Sélectionner un ami
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-white/[0.03] rounded-lg border border-white/[0.08]">
              {multiState.friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => setSelectedFriendId(friend.friendId)}
                  className={`w-full p-2 rounded text-left text-xs transition-colors ${
                    selectedFriendId === friend.friendId
                      ? "bg-[#C8A452]/20 text-[#C8A452] border border-[#C8A452]"
                      : "bg-white/[0.02] text-[#9E9890] hover:bg-white/[0.08]"
                  }`}
                >
                  {friend.friendId}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player color choice */}
        {selectedMode !== "multiplayer" ? (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
              Votre couleur
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedColor("white")}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                  selectedColor === "white"
                    ? "bg-[#161616] border-[#D4AF37]"
                    : "bg-[#111111] border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#F5F5F0] border border-[#E0E0D8] shadow-xs" />
                <div className="text-left">
                  <div className="text-xs font-bold text-[#E6E6E6]">Blancs</div>
                  <div className="text-[9px] text-white/40">1er</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedColor("black")}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                  selectedColor === "black"
                    ? "bg-[#161616] border-[#D4AF37]"
                    : "bg-[#111111] border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#252525] border border-white/20 shadow-xs" />
                <div className="text-left">
                  <div className="text-xs font-bold text-[#E6E6E6]">Noirs</div>
                  <div className="text-[9px] text-white/40">2nd</div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
              Votre couleur (aléatoire possible)
            </label>
            <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.08] text-[10px] text-[#9E9890]">
              Vous jouerez à{" "}
              <span className="font-semibold text-[#C8A452]">
                {selectedColor === "white" ? "Blanc (1er)" : "Noir (2nd)"}
              </span>
            </div>
          </div>
        )}

        {/* Speed Mode & Countdown Timer Configuration */}
        <div className="p-3 rounded-xl border border-[#3E3224] bg-[#14110E] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs ${
                speedMode ? "bg-[#D4AF37] text-black" : "bg-white/10 text-white/40"
              }`}>
                <Zap className={`w-3 h-3 ${speedMode ? "fill-current" : ""}`} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#E6E6E6]">Mode Vitesse (Chronomètre)</div>
                <div className="text-[9px] text-white/40">Limite de temps par coup</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSpeedMode(!speedMode)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                speedMode ? "bg-[#D4AF37]" : "bg-white/20"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  speedMode ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {speedMode && (
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <div className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">
                Temps par coup
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { sec: 10, label: "10s" },
                  { sec: 15, label: "15s" },
                  { sec: 30, label: "30s" },
                  { sec: 45, label: "45s" },
                  { sec: 60, label: "60s" },
                ].map((item) => (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => setTimeLimit(item.sec)}
                    className={`py-1 rounded-lg border text-center font-mono text-xs transition-all cursor-pointer ${
                      timeLimit === item.sec
                        ? "bg-[#D4AF37] text-black border-[#D4AF37] font-bold"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
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
            disabled={isCreatingGame || (selectedMode === "multiplayer" && !selectedFriendId)}
            icon={<Play className="w-4 h-4 fill-current" />}
          >
            {isCreatingGame ? "Création..." : "Lancer la partie"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
