/**
 * @file App.tsx
 * Master application router and layout for Fanorona Web Edition.
 * Connects Game, Friends, Global Leaderboard, Player Profiles, Auth, and Rules.
 */

import React, { useEffect, useState } from "react";
import { Navbar } from "./components/layout/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FanoronaProvider, useFanoronaGame } from "./hooks/useFanoronaGame";
import { GamePage } from "./pages/GamePage";
import { FriendsPage } from "./pages/FriendsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { RulesPage } from "./pages/RulesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PublicProfilePage } from "./pages/PublicProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { socketService } from "./services/socketService";

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>("game");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const { settings, updateSettings, stats } = useFanoronaGame();
  const { user } = useAuth();

  // Handle URL path on load and history popstate
  useEffect(() => {
    const handleUrlRoute = () => {
      const pathname = window.location.pathname.replace(/\/$/, "");
      if (pathname === "/connexion" || pathname === "/login") {
        setCurrentTab("connexion");
      } else if (pathname === "/inscription" || pathname === "/register") {
        setCurrentTab("inscription");
      } else if (pathname === "/profil" || pathname === "/profile") {
        setCurrentTab("profil");
      } else if (pathname === "/classement" || pathname === "/leaderboard") {
        setCurrentTab("classement");
      } else if (pathname === "/amis" || pathname === "/friends") {
        setCurrentTab("friends");
      } else if (pathname.startsWith("/joueur/")) {
        const id = pathname.split("/joueur/")[1];
        if (id) {
          setSelectedPlayerId(id);
          setCurrentTab("public_profile");
        }
      }
    };

    handleUrlRoute();
    window.addEventListener("popstate", handleUrlRoute);
    return () => window.removeEventListener("popstate", handleUrlRoute);
  }, []);

  // Sync route navigation to browser history
  const handleNavigate = (route: string, playerId?: string) => {
    if (route === "public_profile" || route.startsWith("joueur_")) {
      const pId = playerId || route.replace("joueur_", "");
      setSelectedPlayerId(pId);
      setCurrentTab("public_profile");
      window.history.pushState({}, "", `/joueur/${pId}`);
      return;
    }

    setSelectedPlayerId("");
    setCurrentTab(route);

    if (route === "connexion") {
      window.history.pushState({}, "", "/connexion");
    } else if (route === "inscription") {
      window.history.pushState({}, "", "/inscription");
    } else if (route === "profil") {
      window.history.pushState({}, "", "/profil");
    } else if (route === "classement") {
      window.history.pushState({}, "", "/classement");
    } else if (route === "friends" || route === "amis") {
      window.history.pushState({}, "", "/amis");
    } else if (route === "game") {
      window.history.pushState({}, "", "/");
    }
  };

  const handleSelectPlayer = (playerId: string) => {
    handleNavigate("public_profile", playerId);
  };

  const handleToggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  return (
    <div className="min-h-screen bg-[#0C0E12] text-[#E6E6E6] flex flex-col selection:bg-[#C8A452]/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenNewGame={() => {
          handleNavigate("game");
          setTimeout(() => {
            window.dispatchEvent(new Event("open-new-game-modal"));
          }, 50);
        }}
      />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col">
        {currentTab === "game" && <GamePage />}
        {currentTab === "friends" && (
          <FriendsPage
            onNavigate={handleNavigate}
            onSelectPlayer={handleSelectPlayer}
            onInviteToGame={(friend) => {
              handleNavigate("game");
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent("open-new-game-modal", {
                    detail: { friendId: friend.id, friendName: friend.username },
                  })
                );
              }, 50);
            }}
          />
        )}
        {currentTab === "classement" && (
          <LeaderboardPage
            onNavigate={handleNavigate}
            onSelectPlayer={handleSelectPlayer}
          />
        )}
        {currentTab === "profil" && <ProfilePage onNavigate={handleNavigate} />}
        {currentTab === "public_profile" && (
          <PublicProfilePage
            playerId={selectedPlayerId}
            onNavigate={handleNavigate}
            onStartGameWithUser={(target) => {
              setCurrentTab("game");
            }}
          />
        )}
        {currentTab === "connexion" && <LoginPage onNavigate={handleNavigate} />}
        {currentTab === "inscription" && <LoginPage onNavigate={handleNavigate} />}
        {currentTab === "rules" && <RulesPage />}
        {currentTab === "history" && <HistoryPage />}
        {currentTab === "settings" && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={updateSettings}
            stats={stats}
          />
        )}
      </main>

      {/* Cultural Sophisticated Footer */}
      <footer className="w-full border-t border-white/10 bg-[#0A0C10] py-5 px-4 text-center text-xs text-white/40">
        <div className="w-[90%] max-w-[90vw] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-[#C8A452] tracking-[0.2em] uppercase text-xs">
              FANORONA
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[11px] text-white/40 tracking-wider">
              Le jeu traditionnel de Madagascar · Édition Officielle
            </span>
          </div>

          <div className="flex items-center gap-5 text-[11px] uppercase tracking-wider text-white/40">
            <button
              onClick={() => handleNavigate("game")}
              className="hover:text-[#C8A452] transition-colors cursor-pointer"
            >
              Jouer
            </button>
            <button
              onClick={() => handleNavigate("classement")}
              className="hover:text-[#C8A452] transition-colors cursor-pointer"
            >
              Classement Isa
            </button>
            <button
              onClick={() => handleNavigate("friends")}
              className="hover:text-[#C8A452] transition-colors cursor-pointer"
            >
              Amis
            </button>
            <button
              onClick={() => handleNavigate("rules")}
              className="hover:text-[#C8A452] transition-colors cursor-pointer"
            >
              Règles
            </button>
            <button
              onClick={() => handleNavigate("history")}
              className="hover:text-[#C8A452] transition-colors cursor-pointer"
            >
              Histoire
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FanoronaProvider>
        <AppContent />
      </FanoronaProvider>
    </AuthProvider>
  );
}
