/**
 * @file boardThemes.ts
 * Definitions and styling configurations for Fanorona board themes.
 * Allows users to choose between Modern Minimalist, Luxury Woodwork, Zen Bamboo,
 * Royal Malagasy Rosewood, and Contemporary Slate.
 */

import type React from "react";
import { BoardTheme } from "../../game/types/gameTypes";

export interface ThemeDefinition {
  id: BoardTheme;
  name: string;
  tagline: string;
  description: string;
  category: "modern" | "woodwork" | "zen" | "traditional" | "slate";

  // Board frame & surface
  frameClass: string;
  surfaceClass: string;
  surfaceStyle?: React.CSSProperties;
  innerBevelClass: string;

  // Grid lines & SVG
  grid: {
    lineStroke: string;
    lineWidth: number;
    diagStroke: string;
    diagWidth: number;
    filterId: string;
    outerFrameStroke: string;
    coordinateColor: string;
    dotFill: string;
    dotRadius: number;
    hasWoodGrainPattern: boolean;
    hasCornerAccents: boolean;
    cornerStudColor?: string;
  };

  // Stones appearance
  pieces: {
    white: {
      name: string;
      background: string;
      border: string;
      innerRing: string;
      specular: string;
      boxShadow: string;
    };
    black: {
      name: string;
      background: string;
      border: string;
      innerRing: string;
      specular: string;
      boxShadow: string;
    };
  };

  // Selection & movement indicators
  indicators: {
    selectionRing: string;
    selectionGlow: string;
    captureDestinationRing: string;
    captureDestinationBg?: string;
    captureDestinationDot: string;
    paikaDestinationRing: string;
    paikaDestinationBg?: string;
    paikaDestinationDot: string;
    comboRing: string;
    choiceBadgeBg: string;
    choiceBadgeText: string;
  };

  // Mini preview swatch colors
  preview: {
    boardColor: string;
    frameColor: string;
    whitePiece: string;
    blackPiece: string;
    accent: string;
  };
}

export const BOARD_THEMES: Record<BoardTheme, ThemeDefinition> = {
  // 1. MINIMALISTE & MODERNE (Lichess / Chess.com aesthetic)
  modern_minimal: {
    id: "modern_minimal",
    name: "Moderne & Studio",
    tagline: "Inspiré de Lichess & Chess.com",
    description: "Surface claire en frêne sablé, lignes anthracite nettes et galets céramiques soignés.",
    category: "modern",

    frameClass: "bg-[#1E2228] border-2 border-[#333D4B] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)]",
    surfaceClass: "bg-[#E6DFD1]",
    surfaceStyle: {
      backgroundColor: "#E6DFD1",
      backgroundImage: `
        radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.4) 0%, transparent 70%),
        repeating-linear-gradient(90deg, rgba(0,0,0,0.015) 0px, rgba(0,0,0,0.015) 4px, transparent 4px, transparent 18px),
        repeating-linear-gradient(0deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 2px, transparent 2px, transparent 12px)
      `,
    },
    innerBevelClass: "border border-[#C8BEAB] shadow-[inset_0_2px_8px_rgba(0,0,0,0.12)]",

    grid: {
      lineStroke: "#334155", // crisp slate-700
      lineWidth: 2.2,
      diagStroke: "#475569", // slate-600
      diagWidth: 1.8,
      filterId: "minimalCrisp",
      outerFrameStroke: "#64748B",
      coordinateColor: "#475569",
      dotFill: "#1E293B",
      dotRadius: 4.5,
      hasWoodGrainPattern: false,
      hasCornerAccents: false,
    },

    pieces: {
      white: {
        name: "Céramique Ivoire",
        background: "radial-gradient(circle at 35% 28%, #FFFFFF 0%, #F8FAFC 45%, #E2E8F0 85%, #CBD5E1 100%)",
        border: "border-[#CBD5E1]",
        innerRing: "border-[#94A3B8]/30",
        specular: "from-white/95 to-transparent",
        boxShadow: "shadow-[inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_5px_rgba(148,163,184,0.35)]",
      },
      black: {
        name: "Ardoise Mate",
        background: "radial-gradient(circle at 35% 28%, #334155 0%, #1E293B 48%, #0F172A 85%, #020617 100%)",
        border: "border-[#334155]",
        innerRing: "border-white/10",
        specular: "from-white/30 to-transparent",
        boxShadow: "shadow-[inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-3px_5px_rgba(0,0,0,0.85)]",
      },
    },

    indicators: {
      selectionRing: "border-[#0284C7]", // Modern cyan-blue
      selectionGlow: "shadow-[0_0_14px_rgba(2,132,199,0.7)]",
      captureDestinationRing: "border-[#0284C7] bg-[#0284C7]/20",
      captureDestinationDot: "bg-[#0284C7]",
      paikaDestinationRing: "border-[#475569] bg-[#475569]/20",
      paikaDestinationDot: "bg-[#334155]",
      comboRing: "border-[#0EA5E9] shadow-[0_0_16px_rgba(14,165,233,0.8)]",
      choiceBadgeBg: "bg-[#0284C7]",
      choiceBadgeText: "text-white",
    },

    preview: {
      boardColor: "#E6DFD1",
      frameColor: "#1E2228",
      whitePiece: "#F8FAFC",
      blackPiece: "#1E293B",
      accent: "#0284C7",
    },
  },

  // 2. ÉBÉNISTERIE & BOIS PRÉCIEUX (Luxe & Prestige)
  luxury_wood: {
    id: "luxury_wood",
    name: "Noyer & Ébénisterie",
    tagline: "Salon feutré & ébène royale",
    description: "Plateau en noyer américain satiné, chanfrein biseauté et marqueterie de laiton fin.",
    category: "woodwork",

    frameClass: "wood-frame shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)]",
    surfaceClass: "bg-[#281710]",
    surfaceStyle: {
      backgroundColor: "#281710",
      backgroundImage: `
        radial-gradient(ellipse at 50% 30%, rgba(212, 175, 55, 0.07) 0%, transparent 65%),
        repeating-linear-gradient(
          90deg,
          rgba(28, 16, 11, 0.98) 0px,
          rgba(45, 26, 17, 0.95) 7px,
          rgba(60, 34, 23, 0.97) 16px,
          rgba(40, 22, 15, 0.98) 26px,
          rgba(25, 14, 9, 0.99) 36px,
          rgba(55, 30, 20, 0.94) 48px,
          rgba(36, 20, 13, 0.96) 62px,
          rgba(30, 17, 11, 0.98) 78px
        ),
        repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(255,255,255,0.015) 2px, transparent 4px, rgba(0,0,0,0.10) 8px)
      `,
    },
    innerBevelClass: "border border-[#D4AF37]/35 shadow-[inset_0_4px_30px_rgba(0,0,0,0.95)]",

    grid: {
      lineStroke: "#D4AF37", // Warm antique brass
      lineWidth: 2.2,
      diagStroke: "#D4AF37",
      diagWidth: 1.8,
      filterId: "woodCarve",
      outerFrameStroke: "#D4AF37",
      coordinateColor: "#D4AF37",
      dotFill: "#D4AF37",
      dotRadius: 4.8,
      hasWoodGrainPattern: true,
      hasCornerAccents: true,
      cornerStudColor: "#D4AF37",
    },

    pieces: {
      white: {
        name: "Albâtre Marbré",
        background: "radial-gradient(circle at 35% 28%, #FFFFFF 0%, #FAF8F2 42%, #ECE8DD 82%, #D5D0C0 100%)",
        border: "border-[#E8E8E0]",
        innerRing: "border-[#C5BFB0]/50",
        specular: "from-white/95 to-transparent",
        boxShadow: "shadow-[inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_5px_rgba(180,180,170,0.5)]",
      },
      black: {
        name: "Ébène Précieuse",
        background: "radial-gradient(circle at 34% 28%, #36322C 0%, #201D1A 46%, #12100E 85%, #080706 100%)",
        border: "border-[#2D2A26]",
        innerRing: "border-white/10",
        specular: "from-white/30 to-transparent",
        boxShadow: "shadow-[inset_0_2px_3px_rgba(255,255,255,0.25),inset_0_-3px_6px_rgba(0,0,0,0.95)]",
      },
    },

    indicators: {
      selectionRing: "border-[#D4AF37]",
      selectionGlow: "shadow-[0_0_14px_rgba(212,175,55,0.75)]",
      captureDestinationRing: "border-[#D4AF37] bg-[#D4AF37]/25",
      captureDestinationDot: "bg-[#D4AF37]",
      paikaDestinationRing: "border-white/40 bg-white/15",
      paikaDestinationDot: "bg-white/80",
      comboRing: "border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.85)]",
      choiceBadgeBg: "bg-[#D4AF37]",
      choiceBadgeText: "text-black",
    },

    preview: {
      boardColor: "#281710",
      frameColor: "#382015",
      whitePiece: "#FAF8F2",
      blackPiece: "#201D1A",
      accent: "#D4AF37",
    },
  },

  // 3. ZEN & BAMBOU NATUREL (Reposant & Naturel)
  zen_bamboo: {
    id: "zen_bamboo",
    name: "Zen & Bambou",
    tagline: "Naturel, doux pour les yeux",
    description: "Teinte miel dorée, cannes de bambou clair, lignes sépia et galets doux.",
    category: "zen",

    frameClass: "bg-[#422D1F] border-2 border-[#5C3D28] shadow-[0_20px_45px_-10px_rgba(0,0,0,0.85)]",
    surfaceClass: "bg-[#DFCA9E]",
    surfaceStyle: {
      backgroundColor: "#DFCA9E",
      backgroundImage: `
        radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.3) 0%, transparent 65%),
        repeating-linear-gradient(
          90deg,
          rgba(196, 172, 126, 0.4) 0px,
          rgba(235, 218, 176, 0.6) 12px,
          rgba(210, 188, 142, 0.5) 24px,
          rgba(180, 155, 108, 0.4) 26px
        ),
        repeating-linear-gradient(
          0deg,
          rgba(0,0,0,0.03) 0px,
          transparent 2px,
          transparent 8px
        )
      `,
    },
    innerBevelClass: "border border-[#A88C5E] shadow-[inset_0_2px_10px_rgba(74,55,40,0.2)]",

    grid: {
      lineStroke: "#4A3222", // Sepia ink / roasted walnut
      lineWidth: 2.2,
      diagStroke: "#5C3E2A",
      diagWidth: 1.8,
      filterId: "zenCrisp",
      outerFrameStroke: "#7A583E",
      coordinateColor: "#5C3E2A",
      dotFill: "#382417",
      dotRadius: 4.5,
      hasWoodGrainPattern: false,
      hasCornerAccents: false,
    },

    pieces: {
      white: {
        name: "Jade & Quartz Clair",
        background: "radial-gradient(circle at 35% 28%, #FFFFFF 0%, #F5F7F2 45%, #E2E8DD 85%, #CAD4C5 100%)",
        border: "border-[#CAD4C5]",
        innerRing: "border-[#A0AEA0]/30",
        specular: "from-white/95 to-transparent",
        boxShadow: "shadow-[inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_5px_rgba(150,165,145,0.35)]",
      },
      black: {
        name: "Galet de Rivière",
        background: "radial-gradient(circle at 35% 28%, #38423B 0%, #202622 48%, #141815 85%, #0A0D0B 100%)",
        border: "border-[#2D3630]",
        innerRing: "border-white/10",
        specular: "from-white/25 to-transparent",
        boxShadow: "shadow-[inset_0_2px_3px_rgba(255,255,255,0.2),inset_0_-3px_5px_rgba(0,0,0,0.85)]",
      },
    },

    indicators: {
      selectionRing: "border-[#059669]", // Serene jade green
      selectionGlow: "shadow-[0_0_14px_rgba(5,150,105,0.7)]",
      captureDestinationRing: "border-[#059669] bg-[#059669]/20",
      captureDestinationDot: "bg-[#059669]",
      paikaDestinationRing: "border-[#5C3E2A]/50 bg-[#5C3E2A]/20",
      paikaDestinationDot: "bg-[#4A3222]",
      comboRing: "border-[#10B981] shadow-[0_0_16px_rgba(16,185,129,0.8)]",
      choiceBadgeBg: "bg-[#059669]",
      choiceBadgeText: "text-white",
    },

    preview: {
      boardColor: "#DFCA9E",
      frameColor: "#422D1F",
      whitePiece: "#F5F7F2",
      blackPiece: "#202622",
      accent: "#059669",
    },
  },

  // 4. HÉRITAGE MALGACHE ROYAL (Palissandre & Laiton)
  malagasy_wood: {
    id: "malagasy_wood",
    name: "Palissandre Malagasy",
    tagline: "Plateau Solitany Royal de Madagascar",
    description: "Bois de rose malgache violacé, ferrures d'angle en laiton et dorures rituelles.",
    category: "traditional",

    frameClass: "wood-frame shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)]",
    surfaceClass: "bg-board-wood",
    surfaceStyle: undefined,
    innerBevelClass: "border border-[#D4AF37]/35 shadow-[inset_0_4px_30px_rgba(0,0,0,0.95)]",

    grid: {
      lineStroke: "#D4AF37",
      lineWidth: 2.2,
      diagStroke: "#D4AF37",
      diagWidth: 1.8,
      filterId: "woodCarve",
      outerFrameStroke: "#D4AF37",
      coordinateColor: "#D4AF37",
      dotFill: "#D4AF37",
      dotRadius: 4.8,
      hasWoodGrainPattern: true,
      hasCornerAccents: true,
      cornerStudColor: "#D4AF37",
    },

    pieces: {
      white: {
        name: "Quartz d'Antsirabe",
        background: "radial-gradient(circle at 35% 28%, #FFFFFF 0%, #FAF8F2 42%, #ECE8DD 82%, #D5D0C0 100%)",
        border: "border-[#E8E8E0]",
        innerRing: "border-[#C5BFB0]/50",
        specular: "from-white/95 to-transparent",
        boxShadow: "shadow-[inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_5px_rgba(180,180,170,0.5)]",
      },
      black: {
        name: "Obsidienne de l'Itasy",
        background: "radial-gradient(circle at 34% 28%, #36322C 0%, #201D1A 46%, #12100E 85%, #080706 100%)",
        border: "border-[#2D2A26]",
        innerRing: "border-white/10",
        specular: "from-white/30 to-transparent",
        boxShadow: "shadow-[inset_0_2px_3px_rgba(255,255,255,0.25),inset_0_-3px_6px_rgba(0,0,0,0.95)]",
      },
    },

    indicators: {
      selectionRing: "border-[#D4AF37]",
      selectionGlow: "shadow-[0_0_14px_rgba(212,175,55,0.75)]",
      captureDestinationRing: "border-[#D4AF37] bg-[#D4AF37]/25",
      captureDestinationDot: "bg-[#D4AF37]",
      paikaDestinationRing: "border-white/40 bg-white/15",
      paikaDestinationDot: "bg-white/80",
      comboRing: "border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.85)]",
      choiceBadgeBg: "bg-[#D4AF37]",
      choiceBadgeText: "text-black",
    },

    preview: {
      boardColor: "#24140D",
      frameColor: "#382015",
      whitePiece: "#FAF8F2",
      blackPiece: "#201D1A",
      accent: "#D4AF37",
    },
  },

  // 5. ARDOISE CONTEMPORAINE (Pure Precision Dark Mode)
  slate_contemporary: {
    id: "slate_contemporary",
    name: "Ardoise & Craie",
    tagline: "Ultra-contraste minéral & sombre",
    description: "Tablette minérale noire mate, lignes claires gravées à la craie et billes contrastées.",
    category: "slate",

    frameClass: "bg-[#111318] border-2 border-[#242B35] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.95)]",
    surfaceClass: "bg-[#181B20]",
    surfaceStyle: {
      backgroundColor: "#181B20",
      backgroundImage: `
        radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.04) 0%, transparent 70%),
        repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 12px),
        repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 8px)
      `,
    },
    innerBevelClass: "border border-[#2C3440] shadow-[inset_0_3px_15px_rgba(0,0,0,0.9)]",

    grid: {
      lineStroke: "#94A3B8", // Crisp chalk white-gray
      lineWidth: 2.0,
      diagStroke: "#64748B",
      diagWidth: 1.6,
      filterId: "slateCrisp",
      outerFrameStroke: "#64748B",
      coordinateColor: "#94A3B8",
      dotFill: "#E2E8F0",
      dotRadius: 4.2,
      hasWoodGrainPattern: false,
      hasCornerAccents: false,
    },

    pieces: {
      white: {
        name: "Marbre Blanc Pur",
        background: "radial-gradient(circle at 35% 28%, #FFFFFF 0%, #F1F5F9 50%, #CBD5E1 90%, #94A3B8 100%)",
        border: "border-[#E2E8F0]",
        innerRing: "border-[#94A3B8]/30",
        specular: "from-white/95 to-transparent",
        boxShadow: "shadow-[inset_0_2px_4px_rgba(255,255,255,1),inset_0_-3px_5px_rgba(100,116,139,0.5)]",
      },
      black: {
        name: "Onyx Sombre",
        background: "radial-gradient(circle at 35% 28%, #2D333B 0%, #1C2128 48%, #0D1117 85%, #05070A 100%)",
        border: "border-[#30363D]",
        innerRing: "border-white/10",
        specular: "from-white/35 to-transparent",
        boxShadow: "shadow-[inset_0_2px_3px_rgba(255,255,255,0.25),inset_0_-3px_6px_rgba(0,0,0,0.95)]",
      },
    },

    indicators: {
      selectionRing: "border-[#38BDF8]",
      selectionGlow: "shadow-[0_0_14px_rgba(56,189,248,0.7)]",
      captureDestinationRing: "border-[#38BDF8] bg-[#38BDF8]/20",
      captureDestinationDot: "bg-[#38BDF8]",
      paikaDestinationRing: "border-white/30 bg-white/10",
      paikaDestinationDot: "bg-white/70",
      comboRing: "border-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.8)]",
      choiceBadgeBg: "bg-[#38BDF8]",
      choiceBadgeText: "text-black",
    },

    preview: {
      boardColor: "#181B20",
      frameColor: "#111318",
      whitePiece: "#F1F5F9",
      blackPiece: "#1C2128",
      accent: "#38BDF8",
    },
  },
};

export function getBoardTheme(themeId?: BoardTheme): ThemeDefinition {
  if (themeId && BOARD_THEMES[themeId]) {
    return BOARD_THEMES[themeId];
  }
  return BOARD_THEMES.modern_minimal;
}
