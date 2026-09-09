/**
 * @file LeaderboardPage.tsx
 * Global Leaderboard Page (`/classement`).
 * Displays official Isa ratings, ranks, win rates, and direct links to public player profiles.
 */

import React, { useState, useEffect } from "react";
import { Trophy, Star, Medal, ArrowRight, User } from "lucide-react";
import { api } from "../services/api";
import { UserProfile } from "../game/types/userTypes";
import { useAuth } from "../context/AuthContext";

interface LeaderboardPageProps {
  onNavigate: (route: string) => void;
  onSelectPlayer: (playerId: string) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  onNavigate,
  onSelectPlayer,
}) => {
  const { user: currentUser } = useAuth();
  const [players, setPlayers] = useState<(UserProfile & { rank: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLeaderboard()
      .then(setPlayers)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-black font-extrabold text-xs flex items-center justify-center shadow-md shadow-amber-500/20">
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-black font-bold text-xs flex items-center justify-center">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-[#F5F3EE] font-bold text-xs flex items-center justify-center">
          3
        </div>
      );
    }
    return (
      <span className="w-7 text-center font-mono text-xs text-[#9E9890] font-semibold">
        #{rank}
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 space-y-6">
      {/* Header */}
      <div className="bg-[#141210] border border-[#C8A452]/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-[#C8A452] uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-[#C8A452]" />
            <span>Classement Officiel Fanorona</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-[#F5F3EE]">
            Tableau des Maîtres d'Isa
          </h1>
          <p className="text-xs text-[#9E9890]">
            Calculé en temps réel par le moteur de notation selon les résultats des parties classées.
          </p>
        </div>

        {currentUser && (
          <div className="p-3 rounded-xl bg-[#1E1B17] border border-[#C8A452]/40 text-center min-w-[140px]">
            <div className="text-[10px] uppercase font-semibold text-[#9E9890]">Votre Classement</div>
            <div className="text-lg font-bold text-[#F5F3EE] flex items-center justify-center gap-1.5 pt-0.5">
              <Star className="w-4 h-4 fill-[#C8A452] text-[#C8A452]" />
              <span>{currentUser.isa} Isa</span>
            </div>
            <div className="text-[10px] font-mono text-[#C8A452]">{currentUser.player_id}</div>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-[#141210] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#9E9890] animate-pulse">
            Chargement du classement depuis la base de données...
          </div>
        ) : players.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Trophy className="w-10 h-10 mx-auto text-[#9E9890]/40" />
            <div className="text-sm font-semibold text-[#F5F3EE]">Aucun joueur classé pour le moment</div>
            <p className="text-xs text-[#9E9890] max-w-sm mx-auto">
              Jouez une partie en ligne ou inscrivez-vous pour apparaître dans le classement officiel.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {/* Table Header */}
            <div className="px-4 sm:px-6 py-3 bg-[#0D0B0A]/80 flex items-center text-[11px] font-semibold text-[#9E9890] uppercase tracking-wider">
              <span className="w-10">Rang</span>
              <span className="flex-1">Joueur</span>
              <span className="w-20 text-center hidden sm:inline">Parties</span>
              <span className="w-20 text-center hidden sm:inline">Victoires</span>
              <span className="w-28 text-right font-bold text-[#C8A452]">Isa</span>
              <span className="w-10 text-right"></span>
            </div>

            {players.map((player) => {
              const isCurrent = currentUser && currentUser.id === player.id;
              return (
                <div
                  key={player.id}
                  onClick={() => onSelectPlayer(player.player_id)}
                  className={`px-4 sm:px-6 py-3.5 flex items-center transition-colors cursor-pointer group ${
                    isCurrent
                      ? "bg-[#C8A452]/10 hover:bg-[#C8A452]/15 border-l-2 border-[#C8A452]"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 flex items-center">{getRankBadge(player.rank)}</div>

                  {/* Player info */}
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <img
                      src={
                        player.avatar_url ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                          player.username
                        )}`
                      }
                      alt={player.username}
                      className="w-9 h-9 rounded-xl object-cover border border-white/10 bg-[#1A1816]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#F5F3EE] truncate group-hover:text-[#C8A452] transition-colors">
                          {player.username}
                        </span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#C8A452]/20 text-[#C8A452]">
                            VOUS
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-[#9E9890]">
                        ID: {player.player_id}
                      </div>
                    </div>
                  </div>

                  {/* Games played */}
                  <div className="w-20 text-center text-xs text-[#9E9890] hidden sm:block">
                    {player.games_played}
                  </div>

                  {/* Win rate / wins */}
                  <div className="w-20 text-center text-xs text-emerald-400/90 font-medium hidden sm:block">
                    {player.wins} ({player.win_rate}%)
                  </div>

                  {/* Isa Rating */}
                  <div className="w-28 text-right">
                    <span className="text-base font-serif font-extrabold text-[#F5F3EE] tracking-wide">
                      {player.isa}
                    </span>
                    <span className="text-[10px] text-[#C8A452] ml-1 font-semibold">Isa</span>
                  </div>

                  {/* Arrow */}
                  <div className="w-10 flex justify-end">
                    <ArrowRight className="w-4 h-4 text-[#9E9890] group-hover:text-[#C8A452] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
