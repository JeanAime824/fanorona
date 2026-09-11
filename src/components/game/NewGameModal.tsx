/**
 * @file NewGameModal.tsx
 * Dialog allowing configuration of game mode, AI difficulty, and starting player color.
 * Now includes multiplayer friend challenges!
 */

import { Bot, Clock, Globe, Play, Sparkles, User, Users, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { AiDifficulty, GameMode, Player } from "../../game/types/gameTypes";
import { useAuth } from "../../context/AuthContext";
import { useMultiplayer } from "../../hooks/useMultiplayer";
import { api } from "../../services/api";
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
    multiplayerOpponentId?: string,
    opponentName?: string,
    opponentIsa?: number
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
  const [friendsList, setFriendsList] = useState<{ id: string; friend: any }[]>([]);
  const [lobbyGames, setLobbyGames] = useState<any[]>([]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getFriends().then((res) => {
        if (Array.isArray(res)) setFriendsList(res);
      }).catch(() => {});

      api.getLobbyGames().then((res) => {
        if (Array.isArray(res)) setLobbyGames(res);
      }).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleCustomOpen = (e: any) => {
      if (e.detail?.friendId) {
        setSelectedMode("multiplayer");
        setSelectedFriendId(e.detail.friendId);
      }
    };
    window.addEventListener("open-new-game-modal", handleCustomOpen);
    return () => window.removeEventListener("open-new-game-modal", handleCustomOpen);
  }, []);

  if (!isOpen) return null;

  const handleStart = async () => {
    if (selectedMode === "multiplayer" && selectedFriendId) {
      setIsCreatingGame(true);
      try {
        const friendObj = friendsList.find(
          (f) => f.friend.id === selectedFriendId || f.friend.player_id === selectedFriendId
        )?.friend;

        // Challenge friend via authoritative server
        await api.sendChallenge(selectedFriendId, "friendly", timeLimit).catch(() => {});

        // Create online game room
        const roomRes = await api.createGame({
          game_type: "casual",
          time_control: timeLimit,
          player_black_id: selectedFriendId,
        });

        const gameId = roomRes.game?.id || `game_${Date.now()}`;
        onStartGame(
          "multiplayer",
          "medium",
          selectedColor,
          false,
          timeLimit,
          gameId,
          selectedFriendId,
          friendObj?.username || "Ami",
          friendObj?.isa || 1200
        );
        onClose();
      } catch (error) {
        console.error("Erreur création partie:", error);
      } finally {
        setIsCreatingGame(false);
      }
    } else if ((selectedMode as string) === "online_match") {
      setIsCreatingGame(true);
      try {
        const matchRes = await api.quickMatch(timeLimit);
        const game = matchRes.game;
        const gameId = game?.id || matchRes.game_id || `game_${Date.now()}`;
        const myColor = matchRes.matched
          ? game?.player_white_id === user?.id
            ? "white"
            : "black"
          : "white";
        const oppName = myColor === "white" ? game?.player_black_name : game?.player_white_name;
        const oppIsa = myColor === "white" ? game?.player_black_isa : game?.player_white_isa;

        onStartGame(
          "multiplayer",
          "medium",
          myColor,
          false,
          timeLimit,
          gameId,
          undefined,
          oppName,
          oppIsa
        );
        onClose();
      } catch (error) {
        console.error("Erreur matchmaking:", error);
      } finally {
        setIsCreatingGame(false);
      }
    } else {
      // Mode AI ou Local PvP
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                <Bot className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Contre IA</span>
              </div>
              <p className="text-[9px] text-white/50">Minimax Solo</p>
            </button>

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
                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Contre Ami</span>
              </div>
              <p className="text-[9px] text-white/50">Défier un ami</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode("online_match" as GameMode)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                (selectedMode as string) === "online_match"
                  ? "bg-[#161616] border-[#D4AF37] shadow-md shadow-[#D4AF37]/10"
                  : "bg-[#111111] border-white/10 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#E6E6E6]">
                <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>En Ligne</span>
              </div>
              <p className="text-[9px] text-white/50">Choix au hasard</p>
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
                <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Local</span>
              </div>
              <p className="text-[9px] text-white/50">Pass & Play</p>
            </button>
          </div>
        </div>

        {/* Online Challenges Lobby (if Online Match mode - Chess.com style) */}
        {(selectedMode as string) === "online_match" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-[#C8A452]">
                Salon des Défis en Ligne
              </label>
              <button
                type="button"
                onClick={() => {
                  api.getLobbyGames().then((res) => {
                    if (Array.isArray(res)) setLobbyGames(res);
                  });
                }}
                className="text-[10px] text-[#9E9890] hover:text-[#F5F3EE] underline cursor-pointer"
              >
                Actualiser
              </button>
            </div>

            {lobbyGames.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center space-y-2">
                <Globe className="w-6 h-6 mx-auto text-[#C8A452]" />
                <div className="text-xs font-semibold text-[#F5F3EE]">Aucun défi en attente actuellement</div>
                <p className="text-[10px] text-[#9E9890]">
                  Cliquez sur <strong className="text-[#C8A452]">Lancer la partie</strong> ci-dessous pour créer un défi et rechercher automatiquement un adversaire.
                </p>
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                {lobbyGames.map((game) => (
                  <div
                    key={game.id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 hover:border-[#C8A452]/40 transition-all"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#F5F3EE] flex items-center gap-1.5">
                        <span>{game.host_name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#C8A452]/20 text-[#C8A452]">
                          {game.host_isa} Isa
                        </span>
                      </div>
                      <div className="text-[10px] text-[#9E9890] pt-0.5">
                        Code: <span className="font-mono text-white/70">{game.unique_game_code}</span> · {game.time_control}s
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setIsCreatingGame(true);
                        try {
                          await api.joinGame(game.id, user?.displayName || user?.username || "Joueur");
                          onStartGame(
                            "multiplayer",
                            "medium",
                            "black",
                            false,
                            game.time_control,
                            game.id,
                            undefined,
                            game.host_name,
                            game.host_isa
                          );
                          onClose();
                        } catch (err) {
                          console.error("Erreur rejoindre partie:", err);
                        } finally {
                          setIsCreatingGame(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#C8A452] hover:bg-[#D4AF37] text-black text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      Défier
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
        {selectedMode === "multiplayer" && (
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">
              Sélectionner un ami pour le duel
            </label>
            {friendsList.length === 0 && multiState.friends.length === 0 ? (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-center text-xs text-[#9E9890]">
                Aucun ami dans votre liste pour le moment. Ajoutez des amis depuis l'onglet <strong className="text-[#F5F3EE]">Amis</strong>.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-white/[0.03] rounded-xl border border-white/[0.08]">
                {friendsList.map(({ id: friendshipId, friend }) => {
                  const isSelected = selectedFriendId === friend.id || selectedFriendId === friend.player_id;
                  return (
                    <button
                      key={friendshipId}
                      type="button"
                      onClick={() => setSelectedFriendId(friend.id)}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#C8A452]/20 border-[#C8A452] text-[#F5F3EE]"
                          : "bg-white/[0.02] border-white/5 text-[#9E9890] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={friend.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.username}`}
                          alt={friend.username}
                          className="w-7 h-7 rounded-lg object-cover border border-white/10"
                        />
                        <div>
                          <div className="text-xs font-bold text-[#F5F3EE]">{friend.username}</div>
                          <div className="text-[10px] font-mono text-[#C8A452]">ID: {friend.player_id}</div>
                        </div>
                      </div>
                      <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-[#C8A452] text-black" : "bg-white/10 text-[#9E9890]"
                      }`}>
                        {isSelected ? "Sélectionné" : "Défier"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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
