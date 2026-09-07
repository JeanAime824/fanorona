/**
 * @file HistoryPage.tsx
 * Cultural, historical, and philosophical legacy of Fanorona in Madagascar.
 */

import { Castle, Compass, Crown, Flame, Scroll, Sparkles } from "lucide-react";
import React from "react";
import { Card } from "../components/ui/Card";

export const HistoryPage: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-white/80">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#D4AF37]/30 text-xs text-[#D4AF37] font-serif font-bold uppercase tracking-widest">
          <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Héritage malgache & Philosophie</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-wide text-[#E6E6E6]">
          L'Histoire Royale du Fanorona
        </h1>
        <p className="text-xs sm:text-sm text-white/50 max-w-2xl mx-auto leading-relaxed">
          Bien plus qu'un simple passe-temps, le Fanorona est au cœur de l'histoire politique, de la royauté et de la pensée stratégique de Madagascar depuis plusieurs siècles.
        </p>
      </div>

      <div className="space-y-6">
        {/* Origines et royauté */}
        <Card variant="elevated" className="space-y-3">
          <div className="flex items-center gap-3 text-base sm:text-lg font-bold font-serif text-[#E6E6E6]">
            <Crown className="w-5 h-5 text-[#D4AF37]" />
            <span>Le Jeu des Rois et de la Royauté Merina</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            Attesté dès le XVIe siècle sur les hauts plateaux de l'Imerina, le Fanorona était intimement lié à l'exercice du pouvoir. Les souverains malgaches, tels que le roi <strong className="text-white">Ralambo</strong> et le roi <strong className="text-white">Andrianjaka</strong>, considéraient la maîtrise du Fanorona comme une condition essentielle pour commander les armées et régner avec sagesse.
          </p>
          <p className="text-xs leading-relaxed text-white/70">
            Des plateaux gravés dans la roche nue sont encore visibles aujourd'hui dans les sites sacrés de l'histoire malgache, notamment sur la colline royale d'<strong className="text-white">Ambohimanga</strong> (classée au patrimoine mondial de l'UNESCO) et au <strong className="text-white">Rova d'Antananarivo</strong> (Palais de la Reine).
          </p>
        </Card>

        {/* La célèbre légende du trône perdu */}
        <Card variant="accent" className="space-y-3">
          <div className="flex items-center gap-3 text-base sm:text-lg font-bold font-serif text-[#E6E6E6]">
            <Castle className="w-5 h-5 text-[#D4AF37]" />
            <span>La Légende du Trône d'Andriantompokoindrindra</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            L'une des histoires les plus célèbres des <em>Tantara ny Andriana</em> (Chroniques des Nobles) raconte comment le prince héritier <strong className="text-white">Andriantompokoindrindra</strong>, fils aîné du roi Ralambo, perdit la couronne royale :
          </p>
          <div className="p-4 rounded-lg bg-[#141414] border border-white/10 text-xs leading-relaxed text-white/75 italic space-y-2">
            <p>
              « Alors que son père mourant envoya des messagers pour convoquer d'urgence son héritier à son chevet afin de lui transmettre le sceptre royal, le prince était au milieu d'une partie de Fanorona d'une intensité absolue. Refusant de quitter le plateau avant d'avoir terminé la manœuvre en cours, il fit répondre : "Attendez que je finisse ma partie !". »
            </p>
            <p>
              « Son jeune frère Andrianjaka se précipita immédiatement auprès du roi et reçut la bénédiction royale ainsi que le trône. Le prince passionné conserva néanmoins les honneurs et les terres d'Ambohimalaza. »
            </p>
          </div>
        </Card>

        {/* Philosophie et stratégie */}
        <Card variant="elevated" className="space-y-3">
          <div className="flex items-center gap-3 text-base sm:text-lg font-bold font-serif text-[#E6E6E6]">
            <Scroll className="w-5 h-5 text-[#D4AF37]" />
            <span>La Philosophie Stratégique : Fihavanana et Fahaizana</span>
          </div>
          <p className="text-xs leading-relaxed text-white/70">
            Le Fanorona incarne une vision originale de la guerre et des relations :
          </p>
          <ul className="text-xs space-y-2 text-white/60 pl-1">
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37] font-bold">•</span>
              <span><strong className="text-white">Pas de destruction gratuite :</strong> Capturer exige un engagement physique le long d'une ligne précise. Toute avidité excessive expose à un contre-coup dévastateur.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37] font-bold">•</span>
              <span><strong className="text-white">La valeur du mouvement d'éloignement :</strong> Savoir se retirer (<em>Faly</em>) n'est pas une fuite mais une frappe tactique. L'art de la feinte et du retrait stratégique y est tout aussi puissant que l'assaut frontal.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#D4AF37] font-bold">•</span>
              <span><strong className="text-white">L'équilibre des forces :</strong> Contrairement à de nombreux jeux asymétriques, les deux camps disposent d'un matériel strictement équivalent (22 pièces chacun) avec une ouverture d'une richesse combinatoire infinie.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};
