/**
 * @file RulesPage.tsx
 * Complete illustrated guide and Malagasy rules reference for Fanorona.
 */

import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Repeat,
  ShieldAlert,
  Swords,
} from "lucide-react";
import React from "react";
import { Card } from "../components/ui/Card";

export const RulesPage: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-white/80">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-serif font-bold uppercase tracking-widest">
          <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Guide officiel & Règles traditionnelles</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-wide text-[#E6E6E6]">
          Les Règles du Fanorona
        </h1>
        <p className="text-xs sm:text-sm text-white/50 max-w-2xl mx-auto leading-relaxed">
          Fanoron-tsivy (le grand Fanorona à 9 colonnes et 5 rangées) est un jeu de stratégie combinatoire abstrait d'une rare élégance tactique, originaire de Madagascar.
        </p>
      </div>

      {/* Grid of Rule Concepts */}
      <div className="space-y-6">
        {/* Section 1: Le Plateau et les Intersections */}
        <Card variant="elevated" className="space-y-3">
          <div className="flex items-center gap-3 text-base sm:text-lg font-bold font-serif text-[#E6E6E6]">
            <div className="w-7 h-7 rounded-lg bg-[#141414] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-serif font-bold">
              1
            </div>
            <span>Le Plateau (Fanoron-tsivy)</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            Le jeu se déroule sur une grille de <strong className="text-white">9 colonnes sur 5 rangées</strong> formant <strong className="text-white">45 intersections</strong> reliées par des lignes horizontales, verticales et diagonales.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-[#141414] border border-white/5">
              <strong className="text-[#D4AF37] block mb-1">Intersections Fortes (25 points)</strong>
              Où la somme (rangée + colonne) est paire. La pièce peut s'y déplacer dans <strong>8 directions</strong> (4 orthogonales + 4 diagonales). Le centre (E3) est une intersection forte.
            </div>
            <div className="p-3 rounded-lg bg-[#141414] border border-white/5">
              <strong className="text-[#D4AF37] block mb-1">Intersections Faibles (20 points)</strong>
              Où la somme est impaire. La pièce ne peut s'y déplacer que dans <strong>4 directions orthogonales</strong> (haut, bas, gauche, droite).
            </div>
          </div>
        </Card>

        {/* Section 2: Disposition initiale */}
        <Card variant="elevated" className="space-y-3">
          <div className="flex items-center gap-3 text-base sm:text-lg font-bold font-serif text-[#E6E6E6]">
            <div className="w-7 h-7 rounded-lg bg-[#141414] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-serif font-bold">
              2
            </div>
            <span>Disposition initiale (Vava)</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            Le plateau compte <strong className="text-white">44 pièces</strong> au départ : 22 blanches et 22 noires.
          </p>
          <ul className="text-xs space-y-1.5 list-disc list-inside text-white/60 pl-1 leading-relaxed">
            <li>Les deux rangées supérieures sont entièrement occupées par les <strong className="text-white">Noirs</strong>.</li>
            <li>Les deux rangées inférieures sont entièrement occupées par les <strong className="text-white">Blancs</strong>.</li>
            <li>
              La rangée médiane alterne : <em>Noir, Blanc, Noir, Blanc, <strong className="text-[#D4AF37]">VIDE (Centre E3)</strong>, Noir, Blanc, Noir, Blanc</em>.
            </li>
            <li>Les <strong className="text-white">Blancs jouent toujours le premier coup</strong>.</li>
          </ul>
        </Card>

        {/* Section 3: Mécanismes de Capture : Approche vs Éloignement */}
        <Card variant="accent" className="space-y-4">
          <div className="flex items-center gap-3 text-base sm:text-lg font-bold font-serif text-[#E6E6E6]">
            <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] text-xs font-serif font-bold">
              3
            </div>
            <span>Deux modes de capture uniques : Approche & Éloignement</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            Contrairement aux Dames ou aux Échecs où l'on capture en sautant ou en remplaçant une pièce, au Fanorona on capture <strong className="text-white">par contact à distance</strong> le long des lignes de déplacement.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Tomboky */}
            <div className="p-3.5 rounded-lg bg-[#141414] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37] font-serif font-bold text-xs uppercase tracking-wider">
                <ArrowUpRight className="w-4 h-4" />
                <span>Capture par Approche (Tomboky)</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Votre pièce avance d'une intersection adjacente vers une intersection vide qui entre directement en contact avec une pièce ennemie alignée. <strong className="text-white">La pièce ennemie et toute la chaîne continue de pièces ennemies situées directement derrière elle sont capturées.</strong>
              </p>
            </div>

            {/* Faly */}
            <div className="p-3.5 rounded-lg bg-[#141414] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-[#D4AF37] font-serif font-bold text-xs uppercase tracking-wider">
                <ArrowDownLeft className="w-4 h-4" />
                <span>Capture par Éloignement (Faly)</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Votre pièce est en contact avec une pièce ennemie et se déplace dans la direction opposée vers une intersection vide adjacente. <strong className="text-white">La pièce ennemie dont vous vous éloignez et toute la chaîne continue de pièces ennemies situées derrière elle sont capturées.</strong>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#141414] border border-white/10 text-xs text-white/70 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">Cas de choix simultané :</strong> Si un déplacement produit à la fois une capture par Approche devant et par Éloignement derrière, le joueur choisit obligatoirement l'une des deux captures (il ne peut pas capturer les deux en un seul coup).
            </span>
          </div>
        </Card>

        {/* Section 4: Enchaînements de captures (Combo) */}
        <Card variant="elevated" className="space-y-3">
          <div className="flex items-center gap-3 text-base sm:text-lg font-bold font-serif text-[#E6E6E6]">
            <div className="w-7 h-7 rounded-lg bg-[#141414] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-serif font-bold">
              4
            </div>
            <span>Enchaînements de Captures (Séquences multiples)</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            Après une capture réussie, si la même pièce peut immédiatement exécuter une nouvelle capture depuis sa nouvelle position, le joueur peut continuer son tour.
          </p>
          <div className="space-y-2 text-xs text-white/60">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong className="text-white">Même pièce :</strong> Seule la pièce ayant initié le coup peut continuer la chaîne.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong className="text-white">Changement de direction obligatoire :</strong> Le coup suivant ne peut pas continuer dans la même direction vectorielle que le coup précédent.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong className="text-white">Pas de retour :</strong> La pièce ne peut pas repasser par une intersection déjà visitée lors du même tour.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <span><strong className="text-white">Arrêt volontaire :</strong> Contrairement au premier coup qui est obligatoire si une capture existe, le joueur peut décider d'interrompre son enchaînement à tout moment via le bouton « Terminer le tour ».</span>
            </div>
          </div>
        </Card>

        {/* Section 5: Capture Obligatoire */}
        <Card variant="elevated" className="space-y-3">
          <div className="flex items-center gap-3 text-base sm:text-lg font-bold font-serif text-[#E6E6E6]">
            <ShieldAlert className="w-5 h-5 text-[#D4AF37]" />
            <span>Règle de Capture Obligatoire</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            Si au début d'un tour, un ou plusieurs coups avec capture sont possibles sur le plateau, <strong className="text-white">le joueur est obligé d'effectuer une capture</strong>. Il ne peut pas jouer un simple déplacement sans capture (coup <em>Paika</em>) tant qu'une capture est disponible.
          </p>
        </Card>

        {/* Section 6: Victoire et Partie Nulle */}
        <Card variant="elevated" className="space-y-3">
          <div className="flex items-center gap-3 text-base sm:text-lg font-bold font-serif text-[#E6E6E6]">
            <Swords className="w-5 h-5 text-[#D4AF37]" />
            <span>Fin de Partie, Victoire & Match Nul</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            La partie prend fin selon les conditions suivantes :
          </p>
          <ul className="text-xs space-y-1.5 list-disc list-inside text-white/60 pl-1 leading-relaxed">
            <li><strong className="text-white">Élimination totale :</strong> Toutes les pièces de l'adversaire ont été capturées (0 pièce restante).</li>
            <li><strong className="text-white">Blocage complet :</strong> L'adversaire a encore des pièces, mais aucune d'entre elles ne peut effectuer de déplacement légal (pat).</li>
            <li><strong className="text-[#D4AF37]">Partie nulle (Match nul) :</strong> S'il ne reste qu'une seule pièce de chaque côté (1 pièce Blanche et 1 pièce Noire), la partie est immédiatement déclarée nulle.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
