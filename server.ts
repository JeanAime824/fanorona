import express, { Request, Response, NextFunction } from "express";
import http from "http";
import path from "path";
import { Server, Socket } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { createInitialGame, applyMove, endTurn, resignGame } from "./src/game/engine/gameEngine";
import { GameState, Move, Player } from "./src/game/types/gameTypes";

const JWT_SECRET = process.env.JWT_SECRET || "fanorona_secret_jwt_key_madagascar_2026";
const JWT_EXPIRES_IN = "7d";

// Allowed characters for 6-character Player ID (excluding O, 0, I, 1, L to prevent ambiguity)
const PLAYER_ID_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generate6CharPlayerId(existingIds: Set<string>): string {
  let id = "";
  let attempts = 0;
  do {
    id = "";
    for (let i = 0; i < 6; i++) {
      id += PLAYER_ID_CHARS.charAt(Math.floor(Math.random() * PLAYER_ID_CHARS.length));
    }
    attempts++;
  } while (existingIds.has(id) && attempts < 100);
  return id;
}

interface UserDbRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  player_id: string; // 6 characters
  isa: number; // default 1200
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  last_activity: string;
  status: "ONLINE" | "IN_GAME" | "OFFLINE";
}

interface RatingHistoryDbRecord {
  id: string;
  user_id: string;
  game_id?: string;
  opponent_name?: string;
  old_rating: number;
  new_rating: number;
  rating_change: number;
  reason: string;
  created_at: string;
}

interface FriendRequestDbRecord {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  updated_at: string;
}

interface FriendshipDbRecord {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

interface NotificationDbRecord {
  id: string;
  recipient_id: string;
  type:
    | "FRIEND_REQUEST"
    | "FRIEND_ACCEPTED"
    | "GAME_INVITATION"
    | "GAME_STARTED"
    | "GAME_FINISHED"
    | "YOUR_TURN"
    | "RATING_CHANGED"
    | "SYSTEM";
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

interface GameMoveDbRecord {
  id: string;
  game_id: string;
  move_number: number;
  player: Player;
  from_position: { row: number; col: number };
  to_position: { row: number; col: number };
  captured_positions: { row: number; col: number }[];
  capture_type?: "approach" | "withdrawal";
  created_at: string;
}

interface GameDbRecord {
  id: string;
  unique_game_code: string; // e.g. GAME-8F42KD
  game_type: "casual" | "ranked";
  status: "waiting" | "active" | "finished" | "abandoned" | "cancelled";
  player_white_id: string;
  player_black_id: string | null;
  player_white_name: string;
  player_black_name: string | null;
  player_white_isa: number;
  player_black_isa: number;
  winner: Player | "draw" | null;
  time_control: number; // in seconds (30, 300, 600, etc.)
  current_turn: Player;
  turn_number: number;
  started_at: string;
  finished_at: string | null;
  game_state: GameState;
  moves: GameMoveDbRecord[];
}

// In-Memory Database collections
const users = new Map<string, UserDbRecord>(); // by user ID
const usersByPlayerId = new Map<string, UserDbRecord>(); // by 6-char player_id
const usersByUsername = new Map<string, UserDbRecord>(); // by lowercase username
const ratingHistories = new Map<string, RatingHistoryDbRecord[]>(); // by user ID
const friendRequests = new Map<string, FriendRequestDbRecord>(); // by request ID
const friendships = new Map<string, FriendshipDbRecord>(); // by friendship ID
const notifications = new Map<string, NotificationDbRecord>(); // by notification ID
const games = new Map<string, GameDbRecord>(); // by game ID or code
const gamesByCode = new Map<string, GameDbRecord>();

// Helper to sanitize public user profile
function toPublicProfile(u: UserDbRecord) {
  const winRate = u.games_played > 0 ? Math.round((u.wins / u.games_played) * 1000) / 10 : 0;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    player_id: u.player_id,
    isa: u.isa,
    games_played: u.games_played,
    wins: u.wins,
    losses: u.losses,
    draws: u.draws,
    win_rate: winRate,
    avatar_url: u.avatar_url,
    created_at: u.created_at,
    last_activity: u.last_activity,
    status: u.status,
  };
}

// Elo (Isa) calculation formula
function calculateIsaChange(playerIsa: number, opponentIsa: number, result: 1 | 0.5 | 0): number {
  const K = 32;
  const expectedScore = 1 / (1 + Math.pow(10, (opponentIsa - playerIsa) / 400));
  const change = Math.round(K * (result - expectedScore));
  return change;
}

// Seed initial prominent community players from Madagascar Fanorona community
function seedDefaultData() {
  const existingPlayerIds = new Set<string>();
  const seedUsersData = [
    { username: "FanoronaPro", email: "pro@fanorona.mg", isa: 1824, pid: "F9K2M7" },
    { username: "Malagasy", email: "malagasy@fanorona.mg", isa: 1762, pid: "M4T8QA" },
    { username: "JeanAime", email: "jeanaime@fanorona.mg", isa: 1640, pid: "F7K2M9" },
    { username: "Tiana", email: "tiana@fanorona.mg", isa: 1588, pid: "K4P8XQ" },
    { username: "AndryGasy", email: "andry@fanorona.mg", isa: 1450, pid: "A7P2M9" },
    { username: "SoaLaza", email: "soa@fanorona.mg", isa: 1320, pid: "S3X9KP" },
  ];

  const defaultHash = bcrypt.hashSync("Fanorona2026!", 8);

  for (const item of seedUsersData) {
    const id = `usr_${item.username.toLowerCase()}`;
    const user: UserDbRecord = {
      id,
      username: item.username,
      email: item.email,
      password_hash: defaultHash,
      player_id: item.pid,
      isa: item.isa,
      games_played: 45,
      wins: Math.round(45 * (item.isa / 2400)),
      losses: 45 - Math.round(45 * (item.isa / 2400)) - 3,
      draws: 3,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}`,
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      status: "ONLINE",
    };
    users.set(id, user);
    usersByPlayerId.set(item.pid, user);
    usersByUsername.set(item.username.toLowerCase(), user);
    existingPlayerIds.add(item.pid);

    // Initial rating history
    ratingHistories.set(id, [
      {
        id: `rh_${id}_init`,
        user_id: id,
        old_rating: 1200,
        new_rating: item.isa,
        rating_change: item.isa - 1200,
        reason: "Qualification initiale",
        created_at: user.created_at,
      },
    ]);
  }
}

seedDefaultData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Socket.io setup with HTTP server
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  // Track socket connections for real-time presence & notifications
  const userSockets = new Map<string, string>(); // userId -> socketId
  const socketUsers = new Map<string, string>(); // socketId -> userId

  // JWT Middleware helper
  const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentification requise. Token manquant." });
    }
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
      const user = users.get(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé." });
      }
      (req as any).user = user;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Session expirée ou token invalide." });
    }
  };

  // Optional authentication (for guests or viewing)
  const optionalJwt = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = users.get(decoded.userId);
        if (user) {
          (req as any).user = user;
        }
      } catch {
        // Continue unauthenticated
      }
    }
    next();
  };

  // ==========================================
  // AUTHENTICATION ROUTES (JWT)
  // ==========================================

  // Register
  const handleRegister = async (req: Request, res: Response) => {
    try {
      const { username, email, password, avatar_url } = req.body;
      if (!username || !username.trim()) {
        return res.status(400).json({ error: "Le nom d'utilisateur est requis." });
      }
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Adresse email valide requise." });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit comporter au moins 6 caractères." });
      }

      const cleanUsername = username.trim();
      const lowerUsername = cleanUsername.toLowerCase();
      const lowerEmail = email.trim().toLowerCase();

      // Check unique username
      if (usersByUsername.has(lowerUsername)) {
        return res.status(400).json({ error: "Ce nom d'utilisateur est déjà utilisé." });
      }
      // Check unique email
      for (const u of users.values()) {
        if (u.email.toLowerCase() === lowerEmail) {
          return res.status(400).json({ error: "Cette adresse email est déjà enregistrée." });
        }
      }

      // Generate 6-character Unique Player ID
      const allPlayerIds = new Set(usersByPlayerId.keys());
      const playerId = generate6CharPlayerId(allPlayerIds);

      // Hash password securely with bcrypt
      const passwordHash = await bcrypt.hash(password, 10);
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newUser: UserDbRecord = {
        id: userId,
        username: cleanUsername,
        email: lowerEmail,
        password_hash: passwordHash,
        player_id: playerId,
        isa: 1200, // Initial Isa Rating
        games_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        avatar_url: avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        status: "ONLINE",
      };

      users.set(userId, newUser);
      usersByPlayerId.set(playerId, newUser);
      usersByUsername.set(lowerUsername, newUser);

      // Record initial Isa rating history
      ratingHistories.set(userId, [
        {
          id: `rh_${userId}_init`,
          user_id: userId,
          old_rating: 1200,
          new_rating: 1200,
          rating_change: 0,
          reason: "Attribution initiale de l'Isa",
          created_at: newUser.created_at,
        },
      ]);

      const token = jwt.sign({ userId, username: cleanUsername }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      return res.status(201).json({
        message: "Inscription réussie !",
        token,
        refresh: token,
        user: toPublicProfile(newUser),
      });
    } catch (err: any) {
      console.error("[Register Error]", err);
      return res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
    }
  };

  app.post("/api/auth/register/", handleRegister);
  app.post("/api/auth/register", handleRegister);

  // Login
  const handleLogin = async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      const identifier = (username || email || "").trim();

      if (!identifier) {
        return res.status(400).json({ error: "Nom d'utilisateur ou email requis." });
      }

      let user: UserDbRecord | undefined;
      const lowerIdent = identifier.toLowerCase();

      if (identifier.length === 6 && usersByPlayerId.has(identifier.toUpperCase())) {
        user = usersByPlayerId.get(identifier.toUpperCase());
      } else if (usersByUsername.has(lowerIdent)) {
        user = usersByUsername.get(lowerIdent);
      } else {
        for (const u of users.values()) {
          if (u.email.toLowerCase() === lowerIdent) {
            user = u;
            break;
          }
        }
      }

      if (!user) {
        return res.status(401).json({ error: "Identifiants invalides." });
      }

      // If password provided, verify with bcrypt
      if (password) {
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          return res.status(401).json({ error: "Mot de passe incorrect." });
        }
      }

      user.last_activity = new Date().toISOString();
      user.status = "ONLINE";

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      return res.json({
        message: "Connexion réussie !",
        token,
        refresh: token,
        user: toPublicProfile(user),
      });
    } catch (err: any) {
      console.error("[Login Error]", err);
      return res.status(500).json({ error: "Erreur serveur lors de la connexion." });
    }
  };

  app.post("/api/auth/login/", handleLogin);
  app.post("/api/auth/login", handleLogin);

  // Refresh Session
  const handleRefresh = (req: Request, res: Response) => {
    const { refresh } = req.body;
    if (!refresh) {
      return res.status(400).json({ error: "Token de refresh manquant." });
    }
    try {
      const decoded = jwt.verify(refresh, JWT_SECRET) as { userId: string; username: string };
      const user = users.get(decoded.userId);
      if (!user) return res.status(401).json({ error: "Utilisateur introuvable." });

      const newToken = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });
      return res.json({ token: newToken, refresh: newToken });
    } catch {
      return res.status(401).json({ error: "Token expiré. Veuillez vous reconnecter." });
    }
  };

  app.post("/api/auth/refresh/", handleRefresh);
  app.post("/api/auth/refresh", handleRefresh);

  // Logout
  const handleLogout = (req: Request, res: Response) => {
    res.json({ success: true, message: "Déconnexion réussie." });
  };
  app.post("/api/auth/logout/", handleLogout);
  app.post("/api/auth/logout", handleLogout);

  // Me
  const handleMe = (req: Request, res: Response) => {
    const user = (req as any).user as UserDbRecord;
    res.json(toPublicProfile(user));
  };
  app.get("/api/auth/me/", authenticateJwt, handleMe);
  app.get("/api/auth/me", authenticateJwt, handleMe);

  // Profile GET & PATCH
  const handleProfileMe = (req: Request, res: Response) => {
    const user = (req as any).user as UserDbRecord;
    res.json(toPublicProfile(user));
  };
  app.get("/api/profile/me/", authenticateJwt, handleProfileMe);
  app.get("/api/profile/me", authenticateJwt, handleProfileMe);

  const handleUpdateProfile = (req: Request, res: Response) => {
    const user = (req as any).user as UserDbRecord;
    const { username, avatar_url } = req.body;

    if (username && username.trim()) {
      const clean = username.trim();
      const lower = clean.toLowerCase();
      if (lower !== user.username.toLowerCase() && usersByUsername.has(lower)) {
        return res.status(400).json({ error: "Ce nom d'utilisateur est déjà pris." });
      }
      usersByUsername.delete(user.username.toLowerCase());
      user.username = clean;
      usersByUsername.set(lower, user);
    }

    if (avatar_url) {
      user.avatar_url = avatar_url;
    }

    user.updated_at = new Date().toISOString();
    res.json(toPublicProfile(user));
  };
  app.patch("/api/profile/me/", authenticateJwt, handleUpdateProfile);
  app.patch("/api/profile/me", authenticateJwt, handleUpdateProfile);

  // ==========================================
  // USERS SEARCH & PUBLIC PROFILES
  // ==========================================

  app.get("/api/users/search/", optionalJwt, (req: Request, res: Response) => {
    const q = ((req.query.q as string) || "").trim();
    if (!q) {
      return res.json([]);
    }

    const currentUser = (req as any).user as UserDbRecord | undefined;
    const currentUserId = currentUser?.id;
    const upperQuery = q.toUpperCase();
    const lowerQuery = q.toLowerCase();

    const matches: any[] = [];

    // 1. Direct match on 6-character player_id (highest priority)
    const exactIdUser = usersByPlayerId.get(upperQuery);
    if (exactIdUser && exactIdUser.id !== currentUserId) {
      matches.push(buildSearchResult(exactIdUser, currentUserId));
    }

    // 2. Partial match on username
    for (const u of users.values()) {
      if (u.id === currentUserId || (exactIdUser && u.id === exactIdUser.id)) continue;
      if (u.username.toLowerCase().includes(lowerQuery) || u.player_id.includes(upperQuery)) {
        matches.push(buildSearchResult(u, currentUserId));
      }
      if (matches.length >= 10) break;
    }

    res.json(matches);
  });

  function buildSearchResult(targetUser: UserDbRecord, currentUserId?: string) {
    let relationStatus: "none" | "pending_sent" | "pending_received" | "friends" = "none";
    let friendRequestId: string | undefined;

    if (currentUserId) {
      // Check friendship
      const friendshipKey1 = `${currentUserId}_${targetUser.id}`;
      const friendshipKey2 = `${targetUser.id}_${currentUserId}`;
      if (friendships.has(friendshipKey1) || friendships.has(friendshipKey2)) {
        relationStatus = "friends";
      } else {
        // Check pending requests
        for (const req of friendRequests.values()) {
          if (req.status === "pending") {
            if (req.sender_id === currentUserId && req.receiver_id === targetUser.id) {
              relationStatus = "pending_sent";
              friendRequestId = req.id;
              break;
            } else if (req.sender_id === targetUser.id && req.receiver_id === currentUserId) {
              relationStatus = "pending_received";
              friendRequestId = req.id;
              break;
            }
          }
        }
      }
    }

    return {
      ...toPublicProfile(targetUser),
      relation_status: relationStatus,
      friend_request_id: friendRequestId,
    };
  }

  app.get("/api/users/:playerId/", optionalJwt, (req: Request, res: Response) => {
    const { playerId } = req.params;
    const user = usersByPlayerId.get(playerId.toUpperCase()) || users.get(playerId);
    if (!user) {
      return res.status(404).json({ error: "Joueur introuvable." });
    }
    const currentUser = (req as any).user as UserDbRecord | undefined;
    res.json(buildSearchResult(user, currentUser?.id));
  });

  // ==========================================
  // LEADERBOARD (GLOBAL RANKING)
  // ==========================================

  app.get("/api/leaderboard/", (req: Request, res: Response) => {
    const allUsers = Array.from(users.values())
      .sort((a, b) => b.isa - a.isa)
      .map((u, idx) => ({
        rank: idx + 1,
        id: u.id,
        username: u.username,
        player_id: u.player_id,
        isa: u.isa,
        games_played: u.games_played,
        wins: u.wins,
        losses: u.losses,
        draws: u.draws,
        win_rate: u.games_played > 0 ? Math.round((u.wins / u.games_played) * 1000) / 10 : 0,
        avatar_url: u.avatar_url,
        status: u.status,
      }));

    res.json(allUsers);
  });

  // ==========================================
  // USER STATISTICS & RATING HISTORY
  // ==========================================

  app.get("/api/statistics/me/", authenticateJwt, (req: Request, res: Response) => {
    const user = (req as any).user as UserDbRecord;
    const winRate =
      user.games_played > 0 ? Math.round((user.wins / user.games_played) * 1000) / 10 : 0;
    res.json({
      games_played: user.games_played,
      wins: user.wins,
      losses: user.losses,
      draws: user.draws,
      win_rate: winRate,
      current_isa: user.isa,
    });
  });

  app.get("/api/rating-history/me/", authenticateJwt, (req: Request, res: Response) => {
    const user = (req as any).user as UserDbRecord;
    const history = ratingHistories.get(user.id) || [];
    res.json(history.slice(-30));
  });

  // ==========================================
  // FRIENDS SYSTEM
  // ==========================================

  app.get("/api/friends/", authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const friendList: any[] = [];

    for (const f of friendships.values()) {
      let friendId: string | null = null;
      if (f.user1_id === currentUser.id) friendId = f.user2_id;
      else if (f.user2_id === currentUser.id) friendId = f.user1_id;

      if (friendId) {
        const friendUser = users.get(friendId);
        if (friendUser) {
          friendList.push({
            id: f.id,
            friend: toPublicProfile(friendUser),
            created_at: f.created_at,
          });
        }
      }
    }

    res.json(friendList);
  });

  app.get("/api/friends/requests/", authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const received: any[] = [];
    const sent: any[] = [];

    for (const r of friendRequests.values()) {
      if (r.status === "pending") {
        if (r.receiver_id === currentUser.id) {
          const sender = users.get(r.sender_id);
          if (sender) {
            received.push({
              id: r.id,
              sender: toPublicProfile(sender),
              created_at: r.created_at,
            });
          }
        } else if (r.sender_id === currentUser.id) {
          const receiver = users.get(r.receiver_id);
          if (receiver) {
            sent.push({
              id: r.id,
              receiver: toPublicProfile(receiver),
              created_at: r.created_at,
            });
          }
        }
      }
    }

    res.json({ received, sent });
  });

  // Send friend request
  app.post("/api/friends/request/", authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { target_user_id, player_id } = req.body;

    let targetUser: UserDbRecord | undefined;
    if (target_user_id) {
      targetUser = users.get(target_user_id);
    } else if (player_id) {
      targetUser = usersByPlayerId.get(player_id.toUpperCase());
    }

    if (!targetUser) {
      return res.status(404).json({ error: "Utilisateur destinataire introuvable." });
    }

    if (targetUser.id === currentUser.id) {
      return res.status(400).json({ error: "Vous ne pouvez pas vous ajouter vous-même en ami." });
    }

    // Check if already friends
    const fKey1 = `${currentUser.id}_${targetUser.id}`;
    const fKey2 = `${targetUser.id}_${currentUser.id}`;
    if (friendships.has(fKey1) || friendships.has(fKey2)) {
      return res.status(400).json({ error: "Vous êtes déjà amis avec ce joueur." });
    }

    // Check existing pending requests
    for (const r of friendRequests.values()) {
      if (r.status === "pending") {
        if (r.sender_id === currentUser.id && r.receiver_id === targetUser.id) {
          return res.status(400).json({ error: "Une demande est déjà en attente." });
        }
        if (r.sender_id === targetUser.id && r.receiver_id === currentUser.id) {
          // Auto-accept if symmetrical request
          r.status = "accepted";
          r.updated_at = new Date().toISOString();
          const fId = `${currentUser.id}_${targetUser.id}`;
          friendships.set(fId, {
            id: fId,
            user1_id: currentUser.id,
            user2_id: targetUser.id,
            created_at: new Date().toISOString(),
          });
          return res.json({ success: true, message: "Demande acceptée mutuellement !" });
        }
      }
    }

    const requestId = `freq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReq: FriendRequestDbRecord = {
      id: requestId,
      sender_id: currentUser.id,
      receiver_id: targetUser.id,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    friendRequests.set(requestId, newReq);

    // Create Notification for recipient
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const notif: NotificationDbRecord = {
      id: notifId,
      recipient_id: targetUser.id,
      type: "FRIEND_REQUEST",
      title: "Nouvelle demande d'ami",
      message: `${currentUser.username} (${currentUser.player_id}) vous a envoyé une demande d'ami.`,
      data: {
        request_id: requestId,
        sender_id: currentUser.id,
        sender_name: currentUser.username,
        player_id: currentUser.player_id,
        isa: currentUser.isa,
      },
      is_read: false,
      created_at: new Date().toISOString(),
    };
    notifications.set(notifId, notif);

    // Dispatch real-time notification via WebSocket
    const targetSocketId = userSockets.get(targetUser.id);
    if (targetSocketId) {
      io.to(targetSocketId).emit("notification_received", notif);
      io.to(targetSocketId).emit("friend_request_received", {
        request_id: requestId,
        sender: toPublicProfile(currentUser),
      });
    }

    res.status(201).json({ success: true, message: "Demande d'ami envoyée avec succès !" });
  });

  // Accept friend request
  app.post("/api/friends/:id/accept/", authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { id } = req.params;
    const request = friendRequests.get(id);

    if (!request || request.receiver_id !== currentUser.id) {
      return res.status(404).json({ error: "Demande d'ami introuvable ou non autorisée." });
    }

    request.status = "accepted";
    request.updated_at = new Date().toISOString();

    const friendshipId = `${request.sender_id}_${request.receiver_id}`;
    friendships.set(friendshipId, {
      id: friendshipId,
      user1_id: request.sender_id,
      user2_id: request.receiver_id,
      created_at: new Date().toISOString(),
    });

    // Notify sender that request was accepted
    const sender = users.get(request.sender_id);
    if (sender) {
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const notif: NotificationDbRecord = {
        id: notifId,
        recipient_id: sender.id,
        type: "FRIEND_ACCEPTED",
        title: "Demande d'ami acceptée",
        message: `${currentUser.username} a accepté votre demande d'ami. Vous pouvez maintenant jouer ensemble !`,
        data: {
          friend_id: currentUser.id,
          friend_name: currentUser.username,
          player_id: currentUser.player_id,
        },
        is_read: false,
        created_at: new Date().toISOString(),
      };
      notifications.set(notifId, notif);

      const senderSocketId = userSockets.get(sender.id);
      if (senderSocketId) {
        io.to(senderSocketId).emit("notification_received", notif);
        io.to(senderSocketId).emit("friendship_established", {
          friend: toPublicProfile(currentUser),
        });
      }
    }

    res.json({ success: true, message: "Demande d'ami acceptée !" });
  });

  // Reject friend request
  app.post("/api/friends/:id/reject/", authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { id } = req.params;
    const request = friendRequests.get(id);

    if (!request || request.receiver_id !== currentUser.id) {
      return res.status(404).json({ error: "Demande d'ami introuvable." });
    }

    request.status = "rejected";
    request.updated_at = new Date().toISOString();
    res.json({ success: true, message: "Demande refusée." });
  });

  // Cancel friend request
  app.post("/api/friends/:id/cancel/", authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { id } = req.params;
    const request = friendRequests.get(id);

    if (!request || request.sender_id !== currentUser.id) {
      return res.status(404).json({ error: "Demande introuvable." });
    }

    request.status = "cancelled";
    request.updated_at = new Date().toISOString();
    res.json({ success: true, message: "Demande annulée." });
  });

  // Delete friend
  app.delete("/api/friends/:id/", authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { id } = req.params;

    // Check if id is a friendship id or user id
    let targetFriendshipId = id;
    if (!friendships.has(id)) {
      for (const [fid, f] of friendships.entries()) {
        if (
          (f.user1_id === currentUser.id && f.user2_id === id) ||
          (f.user2_id === currentUser.id && f.user1_id === id)
        ) {
          targetFriendshipId = fid;
          break;
        }
      }
    }

    if (friendships.has(targetFriendshipId)) {
      friendships.delete(targetFriendshipId);
      return res.json({ success: true, message: "Ami retiré de votre liste." });
    }

    return res.status(404).json({ error: "Relation d'amitié introuvable." });
  });

  // ==========================================
  // NOTIFICATIONS SYSTEM
  // ==========================================

  app.get("/api/notifications/", authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const userNotifs = Array.from(notifications.values())
      .filter((n) => n.recipient_id === currentUser.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);

    res.json(userNotifs);
  });

  app.post("/api/notifications/:id/read/", authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { id } = req.params;
    const notif = notifications.get(id);

    if (notif && notif.recipient_id === currentUser.id) {
      notif.is_read = true;
    }

    res.json({ success: true });
  });

  app.post("/api/notifications/read-all/", authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    for (const notif of notifications.values()) {
      if (notif.recipient_id === currentUser.id) {
        notif.is_read = true;
      }
    }
    res.json({ success: true, message: "Toutes les notifications ont été marquées comme lues." });
  });

  // ==========================================
  // GAMES & MULTIPLAYER API
  // ==========================================

  app.get("/api/games/", (req: Request, res: Response) => {
    const list = Array.from(games.values()).map((g) => ({
      id: g.id,
      unique_game_code: g.unique_game_code,
      game_type: g.game_type,
      status: g.status,
      player_white_name: g.player_white_name,
      player_black_name: g.player_black_name,
      player_white_isa: g.player_white_isa,
      player_black_isa: g.player_black_isa,
      turn_number: g.turn_number,
      current_turn: g.current_turn,
      time_control: g.time_control,
      started_at: g.started_at,
    }));
    res.json(list);
  });

  app.post("/api/games/", optionalJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord | undefined;
    const {
      game_type = "ranked",
      time_control = 300,
      player_color = "white",
      player_name,
    } = req.body;

    const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomCodeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const gameCode = `GAME-${randomCodeSuffix}`;

    const hostName = currentUser ? currentUser.username : player_name || "Joueur Blanc";
    const hostId = currentUser ? currentUser.id : `guest_${Date.now()}`;
    const hostIsa = currentUser ? currentUser.isa : 1200;

    const initialGameState = createInitialGame("multiplayer", "medium", "black", gameId);

    const newGame: GameDbRecord = {
      id: gameId,
      unique_game_code: gameCode,
      game_type: game_type === "casual" ? "casual" : "ranked",
      status: "waiting",
      player_white_id: player_color === "white" ? hostId : "",
      player_black_id: player_color === "black" ? hostId : null,
      player_white_name: player_color === "white" ? hostName : "En attente...",
      player_black_name: player_color === "black" ? hostName : null,
      player_white_isa: player_color === "white" ? hostIsa : 1200,
      player_black_isa: player_color === "black" ? hostIsa : 1200,
      winner: null,
      time_control: Number(time_control) || 300,
      current_turn: "white",
      turn_number: 1,
      started_at: new Date().toISOString(),
      finished_at: null,
      game_state: initialGameState,
      moves: [],
    };

    games.set(gameId, newGame);
    gamesByCode.set(gameCode, newGame);

    res.status(201).json({
      game_id: gameId,
      unique_game_code: gameCode,
      game: newGame,
    });
  });

  app.get("/api/games/:id/", (req: Request, res: Response) => {
    const { id } = req.params;
    const game = games.get(id) || gamesByCode.get(id.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: "Partie introuvable." });
    }
    res.json(game);
  });

  app.get("/api/games/:id/moves/", (req: Request, res: Response) => {
    const { id } = req.params;
    const game = games.get(id) || gamesByCode.get(id.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: "Partie introuvable." });
    }
    res.json(game.moves);
  });

  app.post("/api/games/:id/join/", optionalJwt, (req: Request, res: Response) => {
    const { id } = req.params;
    const currentUser = (req as any).user as UserDbRecord | undefined;
    const { player_name } = req.body;

    const game = games.get(id) || gamesByCode.get(id.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: "Partie introuvable." });
    }

    const joinerId = currentUser ? currentUser.id : `guest_${Date.now()}`;
    const joinerName = currentUser ? currentUser.username : player_name || "Joueur";
    const joinerIsa = currentUser ? currentUser.isa : 1200;

    if (!game.player_black_id && game.player_white_id !== joinerId) {
      game.player_black_id = joinerId;
      game.player_black_name = joinerName;
      game.player_black_isa = joinerIsa;
      game.status = "active";
    } else if (!game.player_white_id && game.player_black_id !== joinerId) {
      game.player_white_id = joinerId;
      game.player_white_name = joinerName;
      game.player_white_isa = joinerIsa;
      game.status = "active";
    }

    res.json({ success: true, game });
  });

  // Health check
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      platform: "Fanorona Professional Web Edition",
      registered_users: users.size,
      active_games: games.size,
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // ==========================================
  // REAL-TIME WEBSOCKET (SOCKET.IO)
  // ==========================================

  io.on("connection", (socket: Socket) => {
    // Authenticate socket user
    socket.on("authenticate", ({ token, userId }) => {
      let uid = userId;
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
          uid = decoded.userId;
        } catch {
          // fallback
        }
      }
      if (uid) {
        userSockets.set(uid, socket.id);
        socketUsers.set(socket.id, uid);

        const u = users.get(uid);
        if (u) {
          u.status = "ONLINE";
          u.last_activity = new Date().toISOString();
          io.emit("user_presence_changed", { userId: uid, status: "ONLINE" });
        }
      }
    });

    // Game Room Join
    socket.on("join_game_room", ({ gameId, user }) => {
      socket.join(gameId);
      const game = games.get(gameId) || gamesByCode.get(gameId.toUpperCase());
      if (game) {
        if (user && user.id) {
          if (!game.player_black_id && game.player_white_id !== user.id) {
            game.player_black_id = user.id;
            game.player_black_name = user.username;
            game.player_black_isa = user.isa || 1200;
            game.status = "active";
          }
        }
        io.to(gameId).emit("game_room_state", game);
      }
    });

    // Make move (Validated by server authority)
    socket.on("make_move", ({ gameId, move }: { gameId: string; move: Move }) => {
      const game = games.get(gameId) || gamesByCode.get(gameId.toUpperCase());
      if (!game) {
        socket.emit("error", { message: "Partie introuvable" });
        return;
      }

      try {
        // Apply move through authoritative Fanorona game engine
        const nextState = applyMove(game.game_state, move);
        game.game_state = nextState;
        game.current_turn = nextState.currentPlayer;
        game.turn_number = nextState.turnNumber;

        // Record Move in Game History
        const moveRecord: GameMoveDbRecord = {
          id: `mv_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          game_id: game.id,
          move_number: nextState.turnNumber,
          player: nextState.currentPlayer === "white" ? "black" : "white",
          from_position: move.from,
          to_position: move.to,
          captured_positions: move.captures,
          capture_type: move.captureType,
          created_at: new Date().toISOString(),
        };
        game.moves.push(moveRecord);

        // Check if game reached terminal state
        if (nextState.status === "game_over") {
          game.status = "finished";
          game.winner = nextState.winner;
          game.finished_at = new Date().toISOString();

          // If ranked game, compute Isa updates on server!
          let whiteIsaChange = 0;
          let blackIsaChange = 0;

          if (game.game_type === "ranked") {
            const whiteUser = users.get(game.player_white_id);
            const blackUser = game.player_black_id ? users.get(game.player_black_id) : undefined;

            if (whiteUser && blackUser) {
              if (nextState.winner === "white") {
                whiteIsaChange = calculateIsaChange(whiteUser.isa, blackUser.isa, 1);
                blackIsaChange = calculateIsaChange(blackUser.isa, whiteUser.isa, 0);
              } else if (nextState.winner === "black") {
                whiteIsaChange = calculateIsaChange(whiteUser.isa, blackUser.isa, 0);
                blackIsaChange = calculateIsaChange(blackUser.isa, whiteUser.isa, 1);
              } else {
                whiteIsaChange = calculateIsaChange(whiteUser.isa, blackUser.isa, 0.5);
                blackIsaChange = calculateIsaChange(blackUser.isa, whiteUser.isa, 0.5);
              }

              // Update user records
              const oldWhiteIsa = whiteUser.isa;
              const oldBlackIsa = blackUser.isa;

              whiteUser.isa = Math.max(100, whiteUser.isa + whiteIsaChange);
              blackUser.isa = Math.max(100, blackUser.isa + blackIsaChange);

              whiteUser.games_played++;
              blackUser.games_played++;

              if (nextState.winner === "white") {
                whiteUser.wins++;
                blackUser.losses++;
              } else if (nextState.winner === "black") {
                blackUser.wins++;
                whiteUser.losses++;
              } else {
                whiteUser.draws++;
                blackUser.draws++;
              }

              // Save Rating Histories
              const rhWhite: RatingHistoryDbRecord = {
                id: `rh_${Date.now()}_w`,
                user_id: whiteUser.id,
                game_id: game.id,
                opponent_name: blackUser.username,
                old_rating: oldWhiteIsa,
                new_rating: whiteUser.isa,
                rating_change: whiteIsaChange,
                reason: `Partie classée vs ${blackUser.username}`,
                created_at: new Date().toISOString(),
              };
              const rhBlack: RatingHistoryDbRecord = {
                id: `rh_${Date.now()}_b`,
                user_id: blackUser.id,
                game_id: game.id,
                opponent_name: whiteUser.username,
                old_rating: oldBlackIsa,
                new_rating: blackUser.isa,
                rating_change: blackIsaChange,
                reason: `Partie classée vs ${whiteUser.username}`,
                created_at: new Date().toISOString(),
              };

              const wList = ratingHistories.get(whiteUser.id) || [];
              wList.push(rhWhite);
              ratingHistories.set(whiteUser.id, wList);

              const bList = ratingHistories.get(blackUser.id) || [];
              bList.push(rhBlack);
              ratingHistories.set(blackUser.id, bList);

              // Notify both players of rating changes
              const wSock = userSockets.get(whiteUser.id);
              if (wSock) {
                io.to(wSock).emit("isa_updated", {
                  oldIsa: oldWhiteIsa,
                  newIsa: whiteUser.isa,
                  change: whiteIsaChange,
                });
              }
              const bSock = userSockets.get(blackUser.id);
              if (bSock) {
                io.to(bSock).emit("isa_updated", {
                  oldIsa: oldBlackIsa,
                  newIsa: blackUser.isa,
                  change: blackIsaChange,
                });
              }
            }
          }

          io.to(gameId).emit("game_over", {
            winner: nextState.winner,
            reason: nextState.reason,
            whiteIsaChange,
            blackIsaChange,
          });
        }

        io.to(gameId).emit("move_made", { move, nextState, game });
      } catch (err: any) {
        socket.emit("error", { message: err?.message || "Coup invalide." });
      }
    });

    // End Turn
    socket.on("end_turn", ({ gameId }) => {
      const game = games.get(gameId) || gamesByCode.get(gameId.toUpperCase());
      if (!game) return;

      try {
        const nextState = endTurn(game.game_state);
        game.game_state = nextState;
        game.current_turn = nextState.currentPlayer;
        io.to(gameId).emit("turn_ended", { nextState, game });
      } catch (err: any) {
        socket.emit("error", { message: err?.message || "Erreur lors de la fin du tour." });
      }
    });

    // Resign
    socket.on("resign", ({ gameId, player }) => {
      const game = games.get(gameId) || gamesByCode.get(gameId.toUpperCase());
      if (!game) return;

      try {
        const nextState = resignGame(game.game_state, player);
        game.game_state = nextState;
        game.status = "finished";
        game.winner = nextState.winner;
        game.finished_at = new Date().toISOString();

        io.to(gameId).emit("game_over", {
          winner: nextState.winner,
          reason: nextState.reason,
        });
      } catch (err: any) {
        console.error("Resign error:", err);
      }
    });

    // Game Invitation
    socket.on("send_game_invitation", ({ sender, targetUserId, gameType = "ranked" }) => {
      const targetSocket = userSockets.get(targetUserId);
      if (targetSocket) {
        const inviteCode = `GAME-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        io.to(targetSocket).emit("game_invitation_received", {
          sender,
          inviteCode,
          gameType,
        });
      }
    });

    // WebRTC Signaling for Voice Chat
    socket.on("voice_offer", ({ gameId, offer }) => {
      socket.to(gameId).emit("voice_offer", { offer, senderId: socket.id });
    });

    socket.on("voice_answer", ({ gameId, answer }) => {
      socket.to(gameId).emit("voice_answer", { answer, senderId: socket.id });
    });

    socket.on("voice_candidate", ({ gameId, candidate }) => {
      socket.to(gameId).emit("voice_candidate", { candidate, senderId: socket.id });
    });

    socket.on("voice_status", ({ gameId, isMuted, isSpeaking }) => {
      socket.to(gameId).emit("voice_status", { senderId: socket.id, isMuted, isSpeaking });
    });

    // Heartbeat ping
    socket.on("presence_ping", ({ userId }) => {
      if (userId && users.has(userId)) {
        users.get(userId)!.last_activity = new Date().toISOString();
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        userSockets.delete(userId);
        socketUsers.delete(socket.id);

        const u = users.get(userId);
        if (u) {
          u.status = "OFFLINE";
          u.last_activity = new Date().toISOString();
          io.emit("user_presence_changed", { userId, status: "OFFLINE" });
        }
      }
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Fanorona Full-Stack Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
