/**
 * @file MoveHistoryPanel.tsx
 * Chronological log of moves played in the match with algebraic coordinates and capture details.
 */

import { History, Swords } from "lucide-react";
import React, { useEffect, useRef } from "react";
import { MoveHistoryEntry } from "../../game/types/gameTypes";
import { Badge } from "../ui/Badge";

export interface MoveHistoryPanelProps {
  history: MoveHistoryEntry[];
}

export const MoveHistoryPanel: React.FC<MoveHistoryPanelProps> = ({ history }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="w-full bg-[#161514] border border-white/[0.06] rounded-xl p-3.5 flex flex-col h-full min-h-[220px] max-h-[340px] lg:max-h-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs font-serif font-semibold tracking-wider text-[#F5F3EE] uppercase">
          <History className="w-3.5 h-3.5 text-[#C8A452]" />
          <span>Historique</span>
        </div>
        <span className="text-[11px] font-mono text-[#9E9890]">
          {history.length} coup{history.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Compact moves list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-xs"
      >
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#9E9890]/60 italic">
            Partie en attente du premier coup.
          </div>
        ) : (
          history.map((record, idx) => {
            const isCapture = record.captures.length > 0;
            const isWhite = record.player === "white";
            const isLatest = idx === history.length - 1;
            const moveNumber = String(idx + 1).padStart(2, "0");

            return (
              <div
                key={record.id || idx}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                  isLatest
                    ? "bg-white/[0.06] text-[#F5F3EE] border border-[#C8A452]/30"
                    : "text-[#9E9890] hover:bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[#6B655E] text-[11px] w-5">
                    {moveNumber}
                  </span>
                  {/* Subtle piece stone dot */}
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      isWhite
                        ? "bg-[#EDE8DE] border border-[#CCC4B4]"
                        : "bg-[#1C1A18] border border-[#3A3734]"
                    }`}
                  />
                  <span className="text-xs font-sans font-medium text-[#F5F3EE]/90">
                    {isWhite ? "Blanc" : "Noir"}
                  </span>
                  <span className="text-xs font-mono font-medium text-[#F5F3EE] tracking-tight">
                    {record.notation}
                  </span>
                </div>

                {isCapture && (
                  <span className="text-[10px] text-[#C8A452] font-semibold px-1.5 py-0.5 rounded bg-[#C8A452]/10">
                    +{record.captures.length}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
