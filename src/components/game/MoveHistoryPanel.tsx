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
    <div className="w-full bg-[#161514] border border-white/[0.06] rounded-lg p-3 flex flex-col h-full min-h-[280px] lg:min-h-[420px] lg:max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-xs font-serif font-semibold tracking-wider text-[#F5F3EE] uppercase">
          <History className="w-3.5 h-3.5 text-[#C8A452]" />
          <span>Historique</span>
        </div>
        <span className="text-[10px] font-mono text-[#9E9890]">
          {history.length}
        </span>
      </div>

      {/* Compact moves list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-0.5 pr-1.5 font-mono text-[11px]"
      >
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#9E9890]/50 italic">
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
                className={`flex items-center justify-between px-2 py-1 rounded-md transition-colors ${
                  isLatest
                    ? "bg-white/[0.08] text-[#F5F3EE] border border-[#C8A452]/40"
                    : "text-[#9E9890] hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#6B655E] text-[10px] font-mono w-5 shrink-0">
                    {moveNumber}
                  </span>
                  {/* Piece color dot */}
                  <span
                    className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                      isWhite
                        ? "bg-[#EDE8DE] border border-[#CCC4B4]"
                        : "bg-[#1C1A18] border border-[#3A3734]"
                    }`}
                  />
                  <span className="text-[10px] font-mono font-semibold text-[#F5F3EE] tracking-tight truncate">
                    {record.notation}
                  </span>
                </div>

                {isCapture && (
                  <span className="text-[9px] text-[#C8A452] font-bold px-1 py-0.5 rounded bg-[#C8A452]/10 shrink-0 ml-1">
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
