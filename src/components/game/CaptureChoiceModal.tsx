/**
 * @file CaptureChoiceModal.tsx
 * Modal presented when a move enables both Approach (Tomboky) and Withdrawal (Faly) captures.
 * Provides the player with the authentic strategic choice.
 */

import { ArrowDownLeft, ArrowUpRight, Swords } from "lucide-react";
import React from "react";
import { PendingAmbiguousMove } from "../../hooks/useFanoronaGame";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export interface CaptureChoiceModalProps {
  pendingChoice: PendingAmbiguousMove | null;
  onSelectChoice: (type: "approach" | "withdrawal") => void;
  onCancel: () => void;
}

export const CaptureChoiceModal: React.FC<CaptureChoiceModalProps> = ({
  pendingChoice,
  onSelectChoice,
  onCancel,
}) => {
  if (!pendingChoice) return null;

  const approachCount = pendingChoice.approachMove.captures.length;
  const withdrawalCount = pendingChoice.withdrawalMove.captures.length;

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={
        <div className="flex items-center gap-2 text-[#D4AF37] font-serif font-bold uppercase tracking-widest text-sm">
          <Swords className="w-5 h-5 text-[#D4AF37]" />
          <span>Choix du type de capture</span>
        </div>
      }
      maxWidth="md"
    >
      <div className="space-y-4 text-white/80">
        <p className="text-xs leading-relaxed text-white/70">
          Votre déplacement produit à la fois une capture par <strong className="text-white">Approche (Tomboky)</strong> et par <strong className="text-white">Éloignement (Faly)</strong>. Selon les règles traditionnelles du Fanorona, vous devez choisir laquelle exécuter :
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Approach (Tomboky) Option */}
          <button
            type="button"
            onClick={() => onSelectChoice("approach")}
            className="p-4 rounded-xl bg-[#141414] border border-white/10 hover:border-[#D4AF37] hover:bg-white/5 text-left transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <div className="flex items-center gap-2 text-[#D4AF37] font-serif font-bold text-xs uppercase tracking-wider mb-1 group-hover:translate-x-0.5 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
              <span>Approche (Tomboky)</span>
            </div>
            <p className="text-xs text-white/50 mb-3">
              Capture les pièces adverses situées dans la direction de votre mouvement.
            </p>
            <div className="inline-flex items-center px-2 py-1 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37]">
              +{approachCount} pièce{approachCount > 1 ? "s" : ""}
            </div>
          </button>

          {/* Withdrawal (Faly) Option */}
          <button
            type="button"
            onClick={() => onSelectChoice("withdrawal")}
            className="p-4 rounded-xl bg-[#141414] border border-white/10 hover:border-[#D4AF37] hover:bg-white/5 text-left transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <div className="flex items-center gap-2 text-[#D4AF37] font-serif font-bold text-xs uppercase tracking-wider mb-1 group-hover:translate-x-0.5 transition-transform">
              <ArrowDownLeft className="w-4 h-4" />
              <span>Éloignement (Faly)</span>
            </div>
            <p className="text-xs text-white/50 mb-3">
              Capture les pièces adverses situées derrière vous à l'intersection de départ.
            </p>
            <div className="inline-flex items-center px-2 py-1 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-xs font-semibold text-[#D4AF37]">
              +{withdrawalCount} pièce{withdrawalCount > 1 ? "s" : ""}
            </div>
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Annuler le coup
          </Button>
        </div>
      </div>
    </Modal>
  );
};
