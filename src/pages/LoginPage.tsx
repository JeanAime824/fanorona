/**
 * @file LoginPage.tsx
 * Google Authentication Only Login Page for Fanorona.
 * Respects Malagasy earth theme and official Google Sign-In style.
 */

import React, { useState } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface LoginPageProps {
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onNavigate("game");
    } catch (err: any) {
      setError(err?.message || "Impossible de se connecter avec Google. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[75vh]">
      <div className="w-full bg-[#171513] border border-[#C89B52]/30 rounded-2xl p-8 shadow-2xl space-y-8 text-center relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#A8432E]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#A8432E]/20 border border-[#A8432E]/40 text-[#F1E8D5] shadow-inner mb-2">
            <span className="font-serif font-extrabold text-2xl tracking-widest text-[#C89B52]">
              ✦
            </span>
          </div>
          <h1 className="text-3xl font-serif font-black tracking-widest text-[#F1E8D5] uppercase">
            FANORONA
          </h1>
          <p className="text-sm font-medium text-[#D9C7A0]/90 italic">
            Le jeu traditionnel de Madagascar
          </p>
          <div className="w-12 h-0.5 bg-[#C89B52]/40 mx-auto mt-2" />
          <p className="text-xs text-[#AFA493] pt-2">
            Connectez-vous pour jouer, suivre votre classement Isa et affronter vos amis.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-[#A8432E]/15 border border-[#A8432E]/40 rounded-xl flex items-start gap-2.5 text-xs text-[#F1E8D5] text-left relative z-10">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C45A3C]" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action Button: Google Sign-In */}
        <div className="space-y-4 relative z-10">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-5 rounded-xl bg-[#F1E8D5] hover:bg-[#F3EBDD] active:scale-[0.99] text-[#171513] font-semibold text-sm shadow-lg transition-all flex items-center justify-center gap-3.5 cursor-pointer border border-[#D9C7A0] group disabled:opacity-60"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.24 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.24 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isLoading ? "Connexion Google en cours..." : "Continuer avec Google"}</span>
          </button>

          <p className="text-[11px] text-[#AFA493] leading-relaxed px-2">
            En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </div>

        {/* Security badge */}
        <div className="pt-4 border-t border-[#30261F] relative z-10">
          <p className="text-[11px] text-[#AFA493] flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#C89B52]" />
            <span>Authentification sécurisée par Google & Firebase</span>
          </p>
        </div>
      </div>
    </div>
  );
};
