# FANORONA — Web Edition
**Le jeu traditionnel de Madagascar**

Application Web complète, moderne et autonome du jeu de stratégie Fanorona (Fanoron-tsivy).

---

## 🌟 Fonctionnalités

* **Moteur de jeu découplé (Pure TypeScript) :**
  * Grille officielle 9×5 (*Fanoron-tsivy*) et 45 intersections.
  * Gestion complète des intersections fortes (8 directions) et faibles (4 directions).
  * Disposition authentique de départ (22 pièces blanches, 22 pièces noires, centre E3 vide).
  * Déplacement simple (*Paika*).
  * Capture par Approche (*Tomboky*) le long de lignes ininterrompues.
  * Capture par Éloignement (*Faly*) le long de lignes ininterrompues.
  * Résolution des choix simultanés Approche / Éloignement.
  * Enchaînements de captures multiples (*combos*) avec interdiction de revisiter une case et obligation de changer de direction vectorielle.
  * Règle de capture obligatoire au premier coup.
  * Conditions de victoire : élimination totale ou blocage complet des pièces adverses.

* **Intelligence Artificielle (IA) intégrée :**
  * Algorithme **Minimax avec élagage Alpha-Beta**.
  * Évaluation heuristique (équilibre matériel, contrôle des intersections fortes/centrales, mobilité).
  * 3 niveaux de difficulté :
    * **Facile :** Coups réactifs avec part d'aléa pour l'apprentissage.
    * **Moyen :** Minimax profondeur 2 avec table positionnelle.
    * **Difficile :** Minimax profondeur 3 avec ordonnancement des coups (*Move Ordering*).
  * Prise de décision rapide et non bloquante.

* **Interface Utilisateur & Design System :**
  * Rendu graphique géométrique précis en SVG du plateau en bois sculpté malgache.
  * Pièces 3D en galet de quartz poli (Blancs) et basalte volcanique (Noirs).
  * Guides visuels interactifs des destinations possibles et cibles de captures.
  * Retours audio immersifs générés par **Web Audio API** procédurale (sans fichiers externes).
  * Historique complet des coups avec notation algébrique officielle (ex: E3 → E4).
  * Annulation / Rétablissement des coups (*Undo/Redo*) illimités.
  * Guide illustré des règles et histoire royale du Fanorona (*Rova d'Antananarivo, Ambohimanga*).
  * Sauvegarde automatique locale dans le `localStorage` et statistiques de parties.
  * Raccourcis clavier : `Ctrl+Z` (annuler), `Ctrl+Y` (rétablir), `Espace` / `Entrée` (terminer le tour), `N` (nouvelle partie).

---

## 🚀 Installation et Lancement

### Prérequis
* Node.js 18+
* npm ou yarn

### Commandes
```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev

# 3. Lancer la suite de tests unitaires
npm run test

# 4. Compiler pour la production
npm run build
```

---

## 📁 Architecture du Code

```
src/
├── game/                    # Moteur de jeu pur (100% découplé de React)
│   ├── types/               # Modèles de données immuables (GameState, Move, etc.)
│   ├── board/               # Graphe du plateau 9x5, coordonnées, voisins
│   ├── capture/             # Moteur de capture (Approche et Éloignement)
│   ├── moves/               # Générateur de coups légaux et captures obligatoires
│   ├── rules/               # Conditions de victoire et statut
│   ├── engine/              # Machine à états immuable (applyMove, endTurn, resign)
│   ├── history/             # Gestionnaire d'historique Undo / Redo
│   ├── transport/           # Contrat abstrait pour futur multijoueur réseau
│   └── ai/                  # Minimax, Alpha-Beta, heuristiques et ordonnancement
├── components/              # Interface utilisateur React & Tailwind CSS
│   ├── ui/                  # Design System (Button, Card, Modal, Badge, IconButton)
│   ├── board/               # Rendu SVG du plateau, intersections et pierres 3D
│   ├── game/                # Panneaux de statut, historique, modales de choix
│   └── layout/              # En-tête de navigation et pied de page
├── hooks/                   # Hook React useFanoronaGame
├── services/                # Persistance LocalStorage et Audio Web Audio API
├── pages/                   # Vues du jeu, règles, histoire et paramètres
└── tests/                   # 28 tests unitaires automatisés (Vitest)
```
