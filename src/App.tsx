/**
 * @file App.tsx
 * Master application layout and view router for Fanorona Web Edition.
 */

import React, { useEffect, useState } from "react";
import { Navbar, NavTab } from "./components/layout/Navbar";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FanoronaProvider, useFanoronaGame } from "./hooks/useFanoronaGame";
import { useMultiplayer } from "./hooks/useMultiplayer";
import { GamePage } from "./pages/GamePage";
import { FriendsPage } from "./pages/FriendsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { RulesPage } from "./pages/RulesPage";
import { SettingsPage } from "./pages/SettingsPage";

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>("game");
  const { settings, updateSettings, stats } = useFanoronaGame();
  const { user } = useAuth();
  const [multiState] = useMultiplayer(user?.uid);
  const [notificationCount, setNotificationCount] = useState(0);

  // Count unread notifications
  useEffect(() => {
    const unreadCount = multiState.notifications.filter((n) => !n.read).length;
    setNotificationCount(unreadCount);
  }, [multiState.notifications]);

  const handleToggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  return (
    <div className="min-h-screen bg-[#0C0E12] text-[#E6E6E6] flex flex-col selection:bg-[#D4AF37]/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
        notificationCount={notificationCount}
      />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col">
        {currentTab === "game" && <GamePage />}
        {currentTab === "friends" && <FriendsPage />}
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
            <span className="font-serif font-bold text-[#D4AF37] tracking-[0.2em] uppercase text-xs">
              FANORONA
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[11px] text-white/40 tracking-wider">Le jeu traditionnel de Madagascar</span>
          </div>

          <div className="flex items-center gap-5 text-[11px] uppercase tracking-wider text-white/40">
            <button
              onClick={() => setCurrentTab("rules")}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Règles
            </button>
            <button
              onClick={() => setCurrentTab("history")}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Histoire
            </button>
            <button
              onClick={() => setCurrentTab("friends")}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Amis
            </button>
            <button
              onClick={() => setCurrentTab("settings")}
              className="hover:text-[#D4AF37] transition-colors cursor-pointer"
            >
              Paramètres
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
