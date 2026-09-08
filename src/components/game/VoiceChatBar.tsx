/**
 * @file VoiceChatBar.tsx
 * WebRTC Voice Chat bar for real-time player audio communication during matches.
 */

import { Mic, MicOff, Volume2, VolumeX, Radio, PhoneOff, AlertCircle } from "lucide-react";
import React from "react";
import { useVoiceChat } from "../../hooks/useVoiceChat";
import { Button } from "../ui/Button";

interface VoiceChatBarProps {
  gameId?: string | null;
  opponentName?: string;
}

export const VoiceChatBar: React.FC<VoiceChatBarProps> = ({
  gameId,
  opponentName = "Adversaire",
}) => {
  const {
    isVoiceActive,
    isMuted,
    isConnected,
    peerMuted,
    error,
    startVoiceChat,
    stopVoiceChat,
    toggleMute,
  } = useVoiceChat(gameId);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 py-2 rounded-xl bg-[#141210] border border-white/[0.08] flex items-center justify-between gap-3 text-xs">
      {/* Status & Mic Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${
          isVoiceActive
            ? isConnected
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-[#C8A452]/10 text-[#C8A452] border border-[#C8A452]/20"
            : "bg-white/5 text-[#9E9890] border border-white/10"
        }`}>
          <Radio className={`w-3.5 h-3.5 ${isVoiceActive ? "animate-pulse" : ""}`} />
        </div>

        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 font-medium text-[#F5F3EE]">
            <span>Chat Vocal Direct</span>
            {isVoiceActive && (
              <span className={`px-1.5 py-0.2 text-[9px] rounded font-mono font-semibold uppercase ${
                isConnected
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-yellow-500/20 text-yellow-300"
              }`}>
                {isConnected ? "En direct" : "Connexion..."}
              </span>
            )}
          </div>
          <div className="text-[10px] text-[#9E9890] truncate">
            {!isVoiceActive ? (
              "Parlez de vive voix avec votre adversaire"
            ) : peerMuted ? (
              `${opponentName} a coupé son micro`
            ) : (
              `Connecté avec ${opponentName}`
            )}
          </div>
        </div>
      </div>

      {/* Error Message if Any */}
      {error && (
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {!isVoiceActive ? (
          <button
            type="button"
            onClick={startVoiceChat}
            className="px-3 py-1.5 rounded-lg bg-[#C8A452] hover:bg-[#D4AF37] text-black font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Activer le micro</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleMute}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 px-2.5 ${
                isMuted
                  ? "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
              }`}
              title={isMuted ? "Réactiver le micro" : "Couper le micro"}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="text-[11px] font-medium hidden sm:inline">
                {isMuted ? "Micro coupé" : "Micro actif"}
              </span>
            </button>

            <button
              type="button"
              onClick={stopVoiceChat}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/15 text-white/70 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
              title="Quitter le chat vocal"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
