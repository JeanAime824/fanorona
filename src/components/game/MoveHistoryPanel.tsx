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
    <div className="w-full bg-[#141210] border border-[#2E241C] rounded-2xl p-4 shadow-xl flex flex-col h-64 sm:h-80">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#2E241C]">
        <div className="flex items-center gap-2 text-xs font-serif font-bold tracking-widest text-[#D4AF37] uppercase">
          <History className="w-4 h-4 text-[#D4AF37]" />
          <span>Historique des coups</span>
        </div>
        <span className="text-[11px] text-white/40">
          {history.length} coup{history.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Moves list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-1"
      >
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-white/30 italic">
            Aucun coup joué pour le moment.
          </div>
        ) : (
          history.map((record, idx) => {
            const isCapture = record.captures.length > 0;
            const isWhite = record.player === "white";

            return (
              <div
                key={record.id || idx}
                className="flex items-center justify-between p-2 rounded-xl bg-[#1A1612] border border-[#2E241C]/60 text-xs hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white/30 font-mono w-5">
                    {idx + 1}.
                  </span>
                  <div
                    className={`w-3.5 h-3.5 rounded-full border shadow-xs shrink-0 ${
                      isWhite
                        ? "bg-gradient-to-br from-white to-[#D5D0C0] border-[#E8E8E0]"
                        : "bg-gradient-to-br from-[#38332C] to-[#0A0908] border-[#33302C]"
                    }`}
                  />
                  <span className="font-mono font-medium text-white/90">
                    {record.notation}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isCapture ? (
                    <Badge variant="primary" size="sm">
                      <Swords className="w-2.5 h-2.5" />
                      <span>
                        {record.captureType === "approach" ? "Tomboky" : "Faly"} (+
                        {record.captures.length})
                      </span>
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">
                      Paika
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
