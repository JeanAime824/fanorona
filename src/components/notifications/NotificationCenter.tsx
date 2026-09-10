/**
 * @file NotificationCenter.tsx
 * Real-time notification dropdown & badge for Fanorona platform.
 * Supports friend requests, game invitations, rating changes, and turn alerts.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  UserPlus,
  Gamepad2,
  Trophy,
  Info,
  Clock,
  ExternalLink,
} from "lucide-react";
import { api } from "../../services/api";
import { socketService } from "../../services/socketService";
import { NotificationItem } from "../../game/types/userTypes";
import { useAuth } from "../../context/AuthContext";

interface NotificationCenterProps {
  onNavigate: (route: string) => void;
  onSelectPlayer?: (playerId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNavigate,
  onSelectPlayer,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const items = await api.getNotifications();
      setNotifications(items);
    } catch (err) {
      console.warn("Could not load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen to real-time notifications from socket service
    const handleNotif = (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
    };
    socketService.onNotificationReceived(handleNotif);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.warn(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.warn(err);
    }
  };

  const getIconForType = (type: NotificationItem["type"]) => {
    switch (type) {
      case "FRIEND_REQUEST":
      case "FRIEND_ACCEPTED":
        return <UserPlus className="w-4 h-4 text-[#C8A452]" />;
      case "GAME_INVITATION":
      case "GAME_STARTED":
      case "YOUR_TURN":
        return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      case "RATING_CHANGED":
      case "GAME_FINISHED":
        return <Trophy className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-[#9E9890]" />;
    }
  };

  const handleClickNotification = (notif: NotificationItem) => {
    handleMarkAsRead(notif.id);
    setIsOpen(false);

    if (notif.type === "FRIEND_REQUEST" || notif.type === "FRIEND_ACCEPTED") {
      onNavigate("amis");
    } else if (notif.type === "GAME_INVITATION" || notif.type === "GAME_STARTED") {
      onNavigate("game");
    } else if (notif.type === "RATING_CHANGED") {
      onNavigate("profil");
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#F5F3EE] transition-colors relative cursor-pointer"
        title="Centre de notifications"
      >
        <Bell className="w-4 h-4 text-[#9E9890] hover:text-[#F5F3EE]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#141210] border border-[#C8A452]/30 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 bg-[#0D0B0A] border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F5F3EE] uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-semibold">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-[#C8A452] hover:text-[#D4AF37] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tout marquer lu</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.06]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#9E9890] space-y-1">
                <Bell className="w-6 h-6 mx-auto text-[#9E9890]/30" />
                <p>Aucune notification pour l'instant.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                    !n.is_read
                      ? "bg-[#C8A452]/[0.06] hover:bg-[#C8A452]/[0.10]"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                    {getIconForType(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-[#F5F3EE] truncate">{n.title}</div>
                      <span className="text-[10px] text-[#9E9890] whitespace-nowrap ml-2">
                        {new Date(n.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[#D8D4CE] leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    {n.type === "GAME_INVITATION" && n.data?.invite_id && !n.is_read && (
                      <div className="flex items-center gap-2 pt-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await api.acceptChallenge(n.data.invite_id);
                              handleMarkAsRead(n.id);
                              setIsOpen(false);
                              if (res.game_id) {
                                onNavigate("game");
                                setTimeout(() => {
                                  window.dispatchEvent(
                                    new CustomEvent("start-online-game", { detail: { gameId: res.game_id } })
                                  );
                                }, 50);
                              }
                            } catch (err: any) {
                              alert(err?.message || "Erreur acceptation du défi");
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#A8432E] hover:bg-[#C45A3C] text-white text-[11px] font-bold transition-all cursor-pointer shadow-sm"
                        >
                          Accepter le défi
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.rejectChallenge(n.data.invite_id);
                              handleMarkAsRead(n.id);
                            } catch (err) {
                              console.warn(err);
                            }
                          }}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#9E9890] text-[11px] transition-colors cursor-pointer"
                        >
                          Refuser
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-[#C8A452]">
                        {n.data?.player_id ? `ID: ${n.data.player_id}` : ""}
                      </span>
                      {!n.is_read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          className="text-[10px] text-[#9E9890] hover:text-[#C8A452] transition-colors"
                          title="Marquer comme lu"
                        >
                          Marquer lu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
