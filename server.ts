import express, { Request, Response, NextFunction } from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { Server, Socket } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { createInitialGame, applyMove, endTurn, resignGame } from "./src/game/engine/gameEngine";
import { GameState, Move, Player } from "./src/game/types/gameTypes";

const JWT_SECRET = process.env.JWT_SECRET || "fanorona_secret_jwt_key_madagascar_2026";
const JWT_EXPIRES_IN = "7d";

// Generates unique 6-digit numeric Player ID (e.g. 849201)
function generate6CharPlayerId(existingIds: Set<string>): string {
  let id = "";
  let attempts = 0;
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString();
    attempts++;
  } while (existingIds.has(id) && attempts < 100);
  return id;
}

interface UserDbRecord {
  id: string;
  firebase_uid?: string;
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

interface GameInvitationDbRecord {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  game_type: "casual" | "ranked";
  status: "pending" | "accepted" | "rejected" | "expired" | "cancelled";
  game_id?: string;
  time_control: number;
  player_color?: "white" | "black" | "random";
  created_at: string;
  updated_at: string;
}

const gameInvitations = new Map<string, GameInvitationDbRecord>();

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

// In-Memory Database collections with persistent disk fallback
const users = new Map<string, UserDbRecord>(); // by user ID
const usersByPlayerId = new Map<string, UserDbRecord>(); // by 6-char player_id
const usersByUsername = new Map<string, UserDbRecord>(); // by lowercase username
const ratingHistories = new Map<string, RatingHistoryDbRecord[]>(); // by user ID
const friendRequests = new Map<string, FriendRequestDbRecord>(); // by request ID
const friendships = new Map<string, FriendshipDbRecord>(); // by friendship ID
const notifications = new Map<string, NotificationDbRecord>(); // by notification ID
const games = new Map<string, GameDbRecord>(); // by game ID or code
const gamesByCode = new Map<string, GameDbRecord>();

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "fanorona_store.json");

function loadFromDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) {
        for (const u of data.users) {
          users.set(u.id, u);
          usersByPlayerId.set(u.player_id.toUpperCase(), u);
          usersByUsername.set(u.username.toLowerCase(), u);
        }
      }
      if (Array.isArray(data.friendships)) {
        for (const f of data.friendships) friendships.set(f.id, f);
      }
      if (Array.isArray(data.friendRequests)) {
        for (const fr of data.friendRequests) friendRequests.set(fr.id, fr);
      }
      if (Array.isArray(data.gameInvitations)) {
        for (const gi of data.gameInvitations) gameInvitations.set(gi.id, gi);
      }
      if (Array.isArray(data.games)) {
        for (const g of data.games) {
          games.set(g.id, g);
          if (g.unique_game_code) gamesByCode.set(g.unique_game_code, g);
        }
      }
      if (Array.isArray(data.notifications)) {
        for (const n of data.notifications) notifications.set(n.id, n);
      }
      if (data.ratingHistories && typeof data.ratingHistories === "object") {
        for (const [k, v] of Object.entries(data.ratingHistories)) {
          ratingHistories.set(k, v as RatingHistoryDbRecord[]);
        }
      }
      console.log(`[Storage] Restored ${users.size} users, ${friendships.size} friendships, ${games.size} games from persistent storage.`);
    }
  } catch (err) {
    console.error("[Storage] Error loading data from disk:", err);
  }
}

function saveToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const rhObj: Record<string, RatingHistoryDbRecord[]> = {};
    for (const [k, v] of ratingHistories.entries()) {
      rhObj[k] = v;
    }
    const data = {
      users: Array.from(users.values()),
      friendships: Array.from(friendships.values()),
      friendRequests: Array.from(friendRequests.values()),
      gameInvitations: Array.from(gameInvitations.values()),
      games: Array.from(games.values()).slice(-200),
      notifications: Array.from(notifications.values()).slice(-500),
      ratingHistories: rhObj,
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Storage] Error saving data to disk:", err);
  }
}

function clearAllData() {
  users.clear();
  usersByPlayerId.clear();
  usersByUsername.clear();
  friendships.clear();
  friendRequests.clear();
  gameInvitations.clear();
  games.clear();
  gamesByCode.clear();
  notifications.clear();
  ratingHistories.clear();
  saveToDisk();
  console.log("[Storage] Database cleared completely upon administrative reset.");
}

// Initial restoration from storage
loadFromDisk();

// Helper to sanitize public user profile
function toPublicProfile(u: UserDbRecord) {
  const winRate = u.games_played > 0 ? Math.round((u.wins / u.games_played) * 1000) / 10 : 0;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    player_id: u.player_id,
    isa: Math.max(100, u.isa),
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

const DB_FILE = path.join(process.cwd(), "fanorona_db.json");

function persistDb() {
  try {
    const data = {
      users: Array.from(users.values()),
      friendships: Array.from(friendships.values()),
      friendRequests: Array.from(friendRequests.values()),
      ratingHistories: Array.from(ratingHistories.entries()),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("[DB] Failed to persist database to file:", err);
  }
}

function loadPersistedDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.users)) {
        for (const u of data.users) {
          users.set(u.id, u);
          usersByPlayerId.set(u.player_id.toUpperCase(), u);
          usersByUsername.set(u.username.toLowerCase(), u);
        }
      }
      if (Array.isArray(data.friendships)) {
        for (const f of data.friendships) {
          friendships.set(f.id, f);
        }
      }
      if (Array.isArray(data.friendRequests)) {
        for (const r of data.friendRequests) {
          friendRequests.set(r.id, r);
        }
      }
      if (Array.isArray(data.ratingHistories)) {
        for (const [uid, entries] of data.ratingHistories) {
          ratingHistories.set(uid, entries);
        }
      }
      console.log(`[DB] Loaded ${users.size} persisted players from ${DB_FILE}`);
    }
  } catch (err) {
    console.warn("[DB] Failed to load persisted database:", err);
  }
}

// Real registered players persisted to disk
function seedDefaultData() {
  loadPersistedDb();
}

seedDefaultData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Prevent API caching (no-store to avoid Vercel CDN 304 Not Modified cache hits on dynamic search)
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Early health check for container readiness probes
  app.get(["/api/health", "/health", "/api/health/"], (req: Request, res: Response) => {
    res.json({
      status: "ok",
      platform: "Fanorona Professional Web Edition",
      registered_users: users.size,
      active_games: games.size,
      timestamp: new Date().toISOString(),
    });
  });

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

  // JWT Middleware helper with auto-restoration for server restarts & guest support
  const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let token = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (!token) {
      token = (req.query.token as string) || (req.body && req.body.token) || "";
    }

    if (!token) {
      return res.status(401).json({ error: "Authentification requise. Token manquant." });
    }

    try {
      let userId: string = "";
      let username: string = "";

      if (token.startsWith("gst_token_") || token.startsWith("token_") || token.startsWith("gst_")) {
        userId = token.replace(/^(gst_token_|token_)/, "");
        username = userId.startsWith("gst_") ? "Invité" : "Joueur";
      } else {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
          userId = decoded.userId;
          username = decoded.username || "Joueur";
        } catch {
          userId = token;
          username = "Joueur";
        }
      }

      let user = users.get(userId);
      if (!user) {
        // Auto-restore user in memory if missing (e.g. after server restart or fallback session)
        const allPlayerIds = new Set(usersByPlayerId.keys());
        const playerId = generate6CharPlayerId(allPlayerIds);
        const lowerUsername = username.toLowerCase();
        user = {
          id: userId,
          username: username || `Joueur_${playerId.substring(0, 4)}`,
          email: `${lowerUsername}@fanorona.local`,
          password_hash: "",
          player_id: playerId,
          isa: 100, // Initial Isa Floor
          games_played: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username || playerId}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          status: "ONLINE",
        };
        users.set(userId, user);
        usersByPlayerId.set(playerId, user);
        usersByUsername.set(lowerUsername, user);
        persistDb();
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
        isa: 100, // Initial Isa Rating Floor
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
          old_rating: 100,
          new_rating: 100,
          rating_change: 0,
          reason: "Attribution initiale de l'Isa (100 min)",
          created_at: newUser.created_at,
        },
      ]);
      persistDb();

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

  // Google Firebase Authentication
  const handleGoogleAuth = async (req: Request, res: Response) => {
    try {
      const { uid, email, displayName, photoURL } = req.body;

      if (!uid || !email) {
        return res.status(400).json({ error: "Jeton Google/Firebase invalide ou informations manquantes." });
      }

      const lowerEmail = email.trim().toLowerCase();
      let user: UserDbRecord | undefined;

      // 1. Search by Firebase UID
      for (const u of users.values()) {
        if (u.firebase_uid === uid) {
          user = u;
          break;
        }
      }

      // 2. If not found by UID, search by email (migration/linking)
      if (!user) {
        for (const u of users.values()) {
          if (u.email.toLowerCase() === lowerEmail) {
            user = u;
            user.firebase_uid = uid; // Link Google UID to existing account
            break;
          }
        }
      }

      // 3. If still not found, create new account automatically
      if (!user) {
        const allPlayerIds = new Set(usersByPlayerId.keys());
        const playerId = generate6CharPlayerId(allPlayerIds);
        const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const cleanName = (displayName && displayName.trim()) || `Joueur_${playerId}`;
        let lowerUsername = cleanName.toLowerCase();

        // Ensure username uniqueness
        if (usersByUsername.has(lowerUsername)) {
          lowerUsername = `${lowerUsername}_${playerId.substring(0, 3)}`.toLowerCase();
        }

        user = {
          id: userId,
          firebase_uid: uid,
          username: cleanName,
          email: lowerEmail,
          password_hash: "",
          player_id: playerId,
          isa: 100, // Initial Isa Rating Floor
          games_played: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          avatar_url: photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanName}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          status: "ONLINE",
        };

        users.set(userId, user);
        usersByPlayerId.set(playerId, user);
        usersByUsername.set(user.username.toLowerCase(), user);

        // Record initial Isa rating history
        ratingHistories.set(userId, [
          {
            id: `rh_${userId}_init`,
            user_id: userId,
            old_rating: 100,
            new_rating: 100,
            rating_change: 0,
            reason: "Attribution initiale de l'Isa (100 min)",
            created_at: user.created_at,
          },
        ]);
      } else {
        user.last_activity = new Date().toISOString();
        user.status = "ONLINE";
        if (photoURL && !user.avatar_url) {
          user.avatar_url = photoURL;
        }
        // Ensure registered in user maps
        users.set(user.id, user);
        usersByPlayerId.set(user.player_id, user);
        usersByUsername.set(user.username.toLowerCase(), user);
      }

      persistDb();

      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      return res.json({
        message: "Connexion Google réussie !",
        token,
        refresh: token,
        user: toPublicProfile(user),
      });
    } catch (err: any) {
      console.error("[Google Auth Error]", err);
      return res.status(500).json({ error: "Erreur lors de l'authentification avec Google." });
    }
  };

  app.post("/api/auth/google/", handleGoogleAuth);
  app.post("/api/auth/google", handleGoogleAuth);

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

  app.get(["/api/users/search", "/api/users/search/"], optionalJwt, (req: Request, res: Response) => {
    const rawQ = ((req.query.q as string) || "").trim();
    const currentUser = (req as any).user as UserDbRecord | undefined;
    const currentUserId = currentUser?.id;

    const matches: any[] = [];
    const addedIds = new Set<string>();

    if (!rawQ) {
      // Return all active registered players when query is empty (excluding self from friend suggestions)
      for (const u of users.values()) {
        if (u.id === currentUserId) continue;
        matches.push(buildSearchResult(u, currentUserId));
        addedIds.add(u.id);
        if (matches.length >= 25) break;
      }
      return res.json(matches);
    }

    const cleanId = rawQ.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const lowerQuery = rawQ.toLowerCase();

    // 1. Direct match on 6-character player_id (highest priority, including self if searched)
    if (cleanId.length >= 2) {
      const exactIdUser = usersByPlayerId.get(cleanId);
      if (exactIdUser) {
        matches.push(buildSearchResult(exactIdUser, currentUserId));
        addedIds.add(exactIdUser.id);
      }
    }

    // 2. Exact username match
    const exactUsernameUser = usersByUsername.get(lowerQuery);
    if (exactUsernameUser && !addedIds.has(exactUsernameUser.id)) {
      matches.push(buildSearchResult(exactUsernameUser, currentUserId));
      addedIds.add(exactUsernameUser.id);
    }

    // 3. Partial match on username, player_id, or email
    for (const u of users.values()) {
      if (addedIds.has(u.id)) continue;
      const uPid = (u.player_id || "").toUpperCase();
      const uName = (u.username || "").toLowerCase();
      const uEmail = (u.email || "").toLowerCase();

      if (
        (cleanId.length >= 2 && uPid.includes(cleanId)) ||
        uName.includes(lowerQuery) ||
        uEmail.includes(lowerQuery)
      ) {
        matches.push(buildSearchResult(u, currentUserId));
        addedIds.add(u.id);
      }
      if (matches.length >= 25) break;
    }

    res.json(matches);
  });

  function buildSearchResult(targetUser: UserDbRecord, currentUserId?: string) {
    let relationStatus: "none" | "pending_sent" | "pending_received" | "friends" | "self" = "none";
    let friendRequestId: string | undefined;

    if (currentUserId && targetUser.id === currentUserId) {
      return {
        ...toPublicProfile(targetUser),
        relation_status: "self" as const,
        friend_request_id: undefined,
        is_self: true,
      };
    }

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
      is_self: false,
    };
  }

  // Community players list (all registered players, sorted by online status then Isa rating)
  app.get(["/api/users/community", "/api/users/community/"], optionalJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord | undefined;
    const currentUserId = currentUser?.id;

    const list = Array.from(users.values())
      .filter((u) => !currentUserId || u.id !== currentUserId)
      .map((u) => buildSearchResult(u, currentUserId))
      .sort((a, b) => {
        // Status hierarchy: ONLINE (0) > IN_GAME (1) > OFFLINE (2)
        const order = { ONLINE: 0, IN_GAME: 1, OFFLINE: 2 };
        const orderDiff =
          (order[a.status as keyof typeof order] ?? 2) - (order[b.status as keyof typeof order] ?? 2);
        if (orderDiff !== 0) return orderDiff;
        return b.isa - a.isa;
      });

    res.json(list);
  });

  app.get(["/api/users/:playerId", "/api/users/:playerId/"], optionalJwt, (req: Request, res: Response) => {
    const { playerId } = req.params;
    const user = usersByPlayerId.get(playerId.toUpperCase()) || users.get(playerId);
    if (!user) {
      return res.status(404).json({ error: "Joueur introuvable." });
    }
    const currentUser = (req as any).user as UserDbRecord | undefined;
    res.json(buildSearchResult(user, currentUser?.id));
  });

  // Admin endpoint to clear/reset local database
  app.post(["/api/admin/clear-db", "/api/admin/clear-db/"], (req: Request, res: Response) => {
    clearAllData();
    res.json({ message: "Base de données réinitialisée et vidée avec succès." });
  });

  // ==========================================
  // LEADERBOARD (GLOBAL RANKING)
  // ==========================================

  app.get(["/api/leaderboard", "/api/leaderboard/"], (req: Request, res: Response) => {
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

  app.get(["/api/statistics/me", "/api/statistics/me/"], authenticateJwt, (req: Request, res: Response) => {
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

  app.get(["/api/rating-history/me", "/api/rating-history/me/"], authenticateJwt, (req: Request, res: Response) => {
    const user = (req as any).user as UserDbRecord;
    const history = ratingHistories.get(user.id) || [];
    res.json(history.slice(-30));
  });

  // ==========================================
  // FRIENDS SYSTEM
  // ==========================================

  app.get(["/api/friends", "/api/friends/"], authenticateJwt, (req: Request, res: Response) => {
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

  app.get(["/api/friends/requests", "/api/friends/requests/"], authenticateJwt, (req: Request, res: Response) => {
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
  app.post(["/api/friends/request", "/api/friends/request/"], authenticateJwt, (req: Request, res: Response) => {
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
  app.post(["/api/friends/:id/accept", "/api/friends/:id/accept/"], authenticateJwt, (req: Request, res: Response) => {
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
  app.post(["/api/friends/:id/reject", "/api/friends/:id/reject/"], authenticateJwt, (req: Request, res: Response) => {
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
  app.post(["/api/friends/:id/cancel", "/api/friends/:id/cancel/"], authenticateJwt, (req: Request, res: Response) => {
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
  app.delete(["/api/friends/:id", "/api/friends/:id/"], authenticateJwt, (req: Request, res: Response) => {
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
  // CHALLENGES & GAME INVITATIONS SYSTEM
  // ==========================================

  app.get(["/api/challenges/received", "/api/challenges/received/"], authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const list = Array.from(gameInvitations.values()).filter(
      (inv) => inv.receiver_id === currentUser.id && inv.status === "pending"
    );
    res.json(list);
  });

  app.post(["/api/challenges/send", "/api/challenges/send/"], authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { target_user_id, player_id, game_type = "ranked", time_control = 300, player_color = "random" } = req.body;

    let targetUser: UserDbRecord | undefined;
    if (target_user_id) {
      targetUser = users.get(target_user_id);
    } else if (player_id) {
      targetUser = usersByPlayerId.get(player_id.toUpperCase());
    }

    if (!targetUser) {
      return res.status(404).json({ error: "Joueur destinataire introuvable." });
    }

    // Check existing active pending invitation
    for (const inv of gameInvitations.values()) {
      if (
        inv.status === "pending" &&
        inv.sender_id === currentUser.id &&
        inv.receiver_id === targetUser.id
      ) {
        return res.json({ success: true, message: "Une invitation est déjà en attente.", invite: inv });
      }
    }

    const inviteId = `ginv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newInvite: GameInvitationDbRecord = {
      id: inviteId,
      sender_id: currentUser.id,
      sender_name: currentUser.username,
      receiver_id: targetUser.id,
      game_type: game_type === "casual" ? "casual" : "ranked",
      status: "pending",
      time_control: Number(time_control) || 300,
      player_color: player_color === "white" || player_color === "black" ? player_color : "random",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    gameInvitations.set(inviteId, newInvite);

    // Create Notification for recipient
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const notif: NotificationDbRecord = {
      id: notifId,
      recipient_id: targetUser.id,
      type: "GAME_INVITATION",
      title: "Invitation à jouer",
      message: `${currentUser.username} (${currentUser.player_id}) vous a défié pour une partie de Fanorona !`,
      data: {
        invite_id: inviteId,
        sender_id: currentUser.id,
        sender_name: currentUser.username,
        player_id: currentUser.player_id,
        game_type,
        time_control,
        player_color: newInvite.player_color,
      },
      is_read: false,
      created_at: new Date().toISOString(),
    };
    notifications.set(notifId, notif);

    // Push socket events (both game_invitation_received and challenge_received for complete compatibility)
    const targetSocketId = userSockets.get(targetUser.id);
    if (targetSocketId) {
      io.to(targetSocketId).emit("notification_received", notif);
      io.to(targetSocketId).emit("game_invitation_received", {
        invite_id: inviteId,
        sender: toPublicProfile(currentUser),
        game_type,
        time_control: newInvite.time_control,
        player_color: newInvite.player_color,
      });
      io.to(targetSocketId).emit("challenge_received", {
        id: inviteId,
        sender_id: currentUser.id,
        sender_username: currentUser.username,
        sender_avatar: currentUser.avatar_url,
        sender_isa: currentUser.isa,
        player_id: currentUser.player_id,
        time_control: newInvite.time_control,
        game_type: newInvite.game_type,
        player_color: newInvite.player_color,
        created_at: newInvite.created_at,
      });
    }

    saveToDisk();
    res.status(201).json({ success: true, message: "Invitation de défi envoyée !", invite: newInvite });
  });

  app.post(["/api/challenges/:id/cancel", "/api/challenges/:id/cancel/"], authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { id } = req.params;
    const invite = gameInvitations.get(id);

    if (!invite || invite.sender_id !== currentUser.id) {
      return res.status(404).json({ error: "Invitation introuvable." });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ error: `Impossible d'annuler une invitation déjà ${invite.status}.` });
    }

    invite.status = "cancelled";
    invite.updated_at = new Date().toISOString();

    const targetSocketId = userSockets.get(invite.receiver_id);
    if (targetSocketId) {
      io.to(targetSocketId).emit("challenge_cancelled", { invite_id: invite.id });
    }

    saveToDisk();
    res.json({ success: true, message: "Défi annulé." });
  });

  app.post(["/api/challenges/:id/accept", "/api/challenges/:id/accept/"], authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { id } = req.params;
    const invite = gameInvitations.get(id);

    if (!invite || invite.receiver_id !== currentUser.id) {
      return res.status(404).json({ error: "Invitation introuvable ou invalide." });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ error: `L'invitation a déjà été ${invite.status}.` });
    }

    // Create active game room session
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomCodeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const gameCode = `GAME-${randomCodeSuffix}`;
    const initialGameState = createInitialGame("multiplayer", "medium", "black", gameId);

    const senderUser = users.get(invite.sender_id);

    // Color resolution based on invitation's requested player_color
    let whiteId = invite.sender_id;
    let blackId = currentUser.id;
    if (invite.player_color === "black") {
      whiteId = currentUser.id;
      blackId = invite.sender_id;
    } else if (invite.player_color === "random") {
      if (Math.random() < 0.5) {
        whiteId = currentUser.id;
        blackId = invite.sender_id;
      }
    }

    const whiteUser = users.get(whiteId);
    const blackUser = users.get(blackId);

    const newGame: GameDbRecord = {
      id: gameId,
      unique_game_code: gameCode,
      game_type: invite.game_type,
      status: "active",
      player_white_id: whiteId,
      player_black_id: blackId,
      player_white_name: whiteUser?.username || "Joueur Blanc",
      player_black_name: blackUser?.username || "Joueur Noir",
      player_white_isa: whiteUser?.isa || 1200,
      player_black_isa: blackUser?.isa || 1200,
      winner: null,
      time_control: invite.time_control,
      current_turn: "white",
      turn_number: 1,
      started_at: new Date().toISOString(),
      finished_at: null,
      game_state: initialGameState,
      moves: [],
    };

    games.set(gameId, newGame);
    gamesByCode.set(gameCode, newGame);

    invite.status = "accepted";
    invite.game_id = gameId;
    invite.updated_at = new Date().toISOString();

    // Mark both players presence as IN_GAME
    if (senderUser) {
      senderUser.status = "IN_GAME";
      io.emit("user_presence_changed", { userId: senderUser.id, status: "IN_GAME" });
    }
    currentUser.status = "IN_GAME";
    io.emit("user_presence_changed", { userId: currentUser.id, status: "IN_GAME" });

    saveToDisk();

    // Full accepted payload for client navigation and state initialization
    const acceptedPayload = {
      invite_id: invite.id,
      game_id: gameId,
      game_code: gameCode,
      time_control: invite.time_control,
      game_type: invite.game_type,
      white_player_id: newGame.player_white_id,
      black_player_id: newGame.player_black_id,
      white_player: {
        id: newGame.player_white_id,
        username: newGame.player_white_name,
        isa: newGame.player_white_isa,
        avatar_url: whiteUser?.avatar_url,
      },
      black_player: {
        id: newGame.player_black_id,
        username: newGame.player_black_name,
        isa: newGame.player_black_isa,
        avatar_url: blackUser?.avatar_url,
      },
      opponent: toPublicProfile(senderUser || currentUser),
      game: newGame,
    };

    // Notify both sender and receiver via Socket.io to launch match room simultaneously
    const senderSocketId = userSockets.get(invite.sender_id);
    if (senderSocketId) {
      io.to(senderSocketId).emit("challenge_accepted", acceptedPayload);
    }
    const receiverSocketId = userSockets.get(currentUser.id);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("challenge_accepted", acceptedPayload);
    }

    res.json({ success: true, message: "Défi accepté ! Lancement de la partie...", game_id: gameId, game: newGame, payload: acceptedPayload });
  });

  app.post(["/api/challenges/:id/reject", "/api/challenges/:id/reject/"], authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { id } = req.params;
    const invite = gameInvitations.get(id);

    if (!invite || invite.receiver_id !== currentUser.id) {
      return res.status(404).json({ error: "Invitation introuvable." });
    }

    invite.status = "rejected";
    invite.updated_at = new Date().toISOString();
    saveToDisk();

    const senderSocketId = userSockets.get(invite.sender_id);
    if (senderSocketId) {
      io.to(senderSocketId).emit("challenge_declined", {
        invite_id: invite.id,
        opponent_name: currentUser.username,
      });
      io.to(senderSocketId).emit("challenge_rejected", {
        invite_id: invite.id,
        opponent_name: currentUser.username,
      });
    }

    res.json({ success: true, message: "Invitation refusée." });
  });

  // ==========================================
  // NOTIFICATIONS SYSTEM
  // ==========================================

  app.get(["/api/notifications", "/api/notifications/"], authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const userNotifs = Array.from(notifications.values())
      .filter((n) => n.recipient_id === currentUser.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);

    res.json(userNotifs);
  });

  app.post(["/api/notifications/:id/read", "/api/notifications/:id/read/"], authenticateJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord;
    const { id } = req.params;
    const notif = notifications.get(id);

    if (notif && notif.recipient_id === currentUser.id) {
      notif.is_read = true;
    }

    res.json({ success: true });
  });

  app.post(["/api/notifications/read-all", "/api/notifications/read-all/"], authenticateJwt, (req: Request, res: Response) => {
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

  app.get(["/api/games", "/api/games/"], (req: Request, res: Response) => {
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

  app.post(["/api/games", "/api/games/"], optionalJwt, (req: Request, res: Response) => {
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

  app.get(["/api/games/:id", "/api/games/:id/"], (req: Request, res: Response) => {
    const { id } = req.params;
    const game = games.get(id) || gamesByCode.get(id.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: "Partie introuvable." });
    }
    res.json(game);
  });

  app.get(["/api/games/:id/moves", "/api/games/:id/moves/"], (req: Request, res: Response) => {
    const { id } = req.params;
    const game = games.get(id) || gamesByCode.get(id.toUpperCase());
    if (!game) {
      return res.status(404).json({ error: "Partie introuvable." });
    }
    res.json(game.moves);
  });

  app.post(["/api/games/:id/join", "/api/games/:id/join/"], optionalJwt, (req: Request, res: Response) => {
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

  // Online Open Challenges Lobby (Chess.com style)
  app.get(["/api/games/lobby", "/api/games/lobby/"], (req: Request, res: Response) => {
    const waitingList = Array.from(games.values())
      .filter((g) => g.status === "waiting")
      .map((g) => ({
        id: g.id,
        unique_game_code: g.unique_game_code,
        host_name: g.player_white_name || g.player_black_name || "Joueur",
        host_isa: g.player_white_isa || g.player_black_isa || 1200,
        host_id: g.player_white_id || g.player_black_id,
        time_control: g.time_control,
        created_at: g.started_at,
      }));
    res.json(waitingList);
  });

  // Quick Online Matchmaking (random selection)
  app.post(["/api/games/quick-match", "/api/games/quick-match/"], optionalJwt, (req: Request, res: Response) => {
    const currentUser = (req as any).user as UserDbRecord | undefined;
    const { player_name, time_control = 300 } = req.body;

    const playerId = currentUser ? currentUser.id : `guest_${Date.now()}`;
    const playerName = currentUser ? currentUser.username : player_name || "Joueur";
    const playerIsa = currentUser ? currentUser.isa : 1200;

    // Search for existing waiting game
    for (const g of games.values()) {
      if (
        g.status === "waiting" &&
        g.player_white_id !== playerId &&
        (!g.player_black_id || g.player_black_id !== playerId)
      ) {
        // Join this game!
        if (!g.player_black_id) {
          g.player_black_id = playerId;
          g.player_black_name = playerName;
          g.player_black_isa = playerIsa;
        } else if (!g.player_white_id) {
          g.player_white_id = playerId;
          g.player_white_name = playerName;
          g.player_white_isa = playerIsa;
        }
        g.status = "active";
        return res.json({ matched: true, game: g });
      }
    }

    // No existing waiting game found: Create a new room
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomCodeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const gameCode = `GAME-${randomCodeSuffix}`;
    const initialGameState = createInitialGame("multiplayer", "medium", "black", gameId);

    const newGame: GameDbRecord = {
      id: gameId,
      unique_game_code: gameCode,
      game_type: "ranked",
      status: "waiting",
      player_white_id: playerId,
      player_black_id: null,
      player_white_name: playerName,
      player_black_name: null,
      player_white_isa: playerIsa,
      player_black_isa: 1200,
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

    res.status(201).json({ matched: false, game: newGame });
  });

  // Health check
  app.get(["/api/health", "/api/health/"], (req: Request, res: Response) => {
    res.json({
      status: "ok",
      platform: "Fanorona Professional Web Edition",
      registered_users: users.size,
      active_games: games.size,
      timestamp: new Date().toISOString(),
    });
  });

  // Catch-all fallback for any unknown API route: ALWAYS return JSON, never HTML
  app.all("/api/*", (req: Request, res: Response) => {
    res.status(404).json({ error: `Route API introuvable : ${req.method} ${req.path}` });
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
      if (!gameId) return;
      const cleanKey = gameId.toString().trim();
      const game = games.get(cleanKey) || gamesByCode.get(cleanKey.toUpperCase());

      socket.join(cleanKey);
      if (game) {
        socket.join(game.id);
        if (game.unique_game_code) {
          socket.join(game.unique_game_code);
        }

        const uid = user?.id || user?.uid;
        const uname = user?.username || user?.displayName || user?.name;
        const uisa = user?.isa || 1200;

        if (uid) {
          if (!game.player_black_id && game.player_white_id !== uid) {
            game.player_black_id = uid;
            game.player_black_name = uname || "Joueur Noir";
            game.player_black_isa = uisa;
            game.status = "active";
          }
          const u = users.get(uid);
          if (u) {
            u.status = "IN_GAME";
            io.emit("user_presence_changed", { userId: uid, status: "IN_GAME" });
          }
        }
        saveToDisk();

        // Broadcast to all potential room identifiers
        io.to(game.id).emit("game_room_state", game);
        if (game.unique_game_code && game.unique_game_code !== game.id) {
          io.to(game.unique_game_code).emit("game_room_state", game);
        }
        if (cleanKey !== game.id && cleanKey !== game.unique_game_code) {
          io.to(cleanKey).emit("game_room_state", game);
        }
      }
    });

    // Make move (Validated by server authority)
    socket.on("make_move", ({ gameId, move }: { gameId: string; move: Move }) => {
      const cleanKey = gameId?.toString?.().trim();
      const game = games.get(cleanKey) || gamesByCode.get(cleanKey.toUpperCase());
      if (!game) {
        socket.emit("error", { message: "Partie introuvable" });
        return;
      }

      const emitToGame = (event: string, payload: any) => {
        io.to(game.id).emit(event, payload);
        if (game.unique_game_code && game.unique_game_code !== game.id) {
          io.to(game.unique_game_code).emit(event, payload);
        }
        if (cleanKey && cleanKey !== game.id && cleanKey !== game.unique_game_code) {
          io.to(cleanKey).emit(event, payload);
        }
      };

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

          // Restore presence
          if (game.player_white_id) {
            const uW = users.get(game.player_white_id);
            if (uW && userSockets.has(game.player_white_id)) {
              uW.status = "ONLINE";
              io.emit("user_presence_changed", { userId: game.player_white_id, status: "ONLINE" });
            }
          }
          if (game.player_black_id) {
            const uB = users.get(game.player_black_id);
            if (uB && userSockets.has(game.player_black_id)) {
              uB.status = "ONLINE";
              io.emit("user_presence_changed", { userId: game.player_black_id, status: "ONLINE" });
            }
          }

          emitToGame("game_over", {
            winner: nextState.winner,
            reason: nextState.reason,
            whiteIsaChange,
            blackIsaChange,
          });
        }

        saveToDisk();
        emitToGame("move_made", { move, nextState, game });
        emitToGame("game_room_state", game);
      } catch (err: any) {
        socket.emit("error", { message: err?.message || "Coup invalide." });
      }
    });

    // End Turn
    socket.on("end_turn", ({ gameId }) => {
      const cleanKey = gameId?.toString?.().trim();
      const game = games.get(cleanKey) || gamesByCode.get(cleanKey.toUpperCase());
      if (!game) return;

      try {
        const nextState = endTurn(game.game_state);
        game.game_state = nextState;
        game.current_turn = nextState.currentPlayer;
        saveToDisk();

        const emitToGame = (event: string, payload: any) => {
          io.to(game.id).emit(event, payload);
          if (game.unique_game_code && game.unique_game_code !== game.id) {
            io.to(game.unique_game_code).emit(event, payload);
          }
          if (cleanKey && cleanKey !== game.id && cleanKey !== game.unique_game_code) {
            io.to(cleanKey).emit(event, payload);
          }
        };

        emitToGame("turn_ended", { nextState, game });
        emitToGame("game_room_state", game);
      } catch (err: any) {
        socket.emit("error", { message: err?.message || "Erreur lors de la fin du tour." });
      }
    });

    // Resign
    socket.on("resign", ({ gameId, player }) => {
      const cleanKey = gameId?.toString?.().trim();
      const game = games.get(cleanKey) || gamesByCode.get(cleanKey.toUpperCase());
      if (!game) return;

      try {
        const nextState = resignGame(game.game_state, player);
        game.game_state = nextState;
        game.status = "finished";
        game.winner = nextState.winner;
        game.finished_at = new Date().toISOString();

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
            }

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
            }

            const rhWhite: RatingHistoryDbRecord = {
              id: `rh_${Date.now()}_w`,
              user_id: whiteUser.id,
              game_id: game.id,
              opponent_name: blackUser.username,
              old_rating: oldWhiteIsa,
              new_rating: whiteUser.isa,
              rating_change: whiteIsaChange,
              reason: `Abandon adverse vs ${blackUser.username}`,
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
              reason: `Abandon vs ${whiteUser.username}`,
              created_at: new Date().toISOString(),
            };

            const wList = ratingHistories.get(whiteUser.id) || [];
            wList.push(rhWhite);
            ratingHistories.set(whiteUser.id, wList);

            const bList = ratingHistories.get(blackUser.id) || [];
            bList.push(rhBlack);
            ratingHistories.set(blackUser.id, bList);

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

        // Restore presence
        if (game.player_white_id) {
          const uW = users.get(game.player_white_id);
          if (uW && userSockets.has(game.player_white_id)) {
            uW.status = "ONLINE";
            io.emit("user_presence_changed", { userId: game.player_white_id, status: "ONLINE" });
          }
        }
        if (game.player_black_id) {
          const uB = users.get(game.player_black_id);
          if (uB && userSockets.has(game.player_black_id)) {
            uB.status = "ONLINE";
            io.emit("user_presence_changed", { userId: game.player_black_id, status: "ONLINE" });
          }
        }

        saveToDisk();

        const emitToGame = (event: string, payload: any) => {
          io.to(game.id).emit(event, payload);
          if (game.unique_game_code && game.unique_game_code !== game.id) {
            io.to(game.unique_game_code).emit(event, payload);
          }
          if (cleanKey && cleanKey !== game.id && cleanKey !== game.unique_game_code) {
            io.to(cleanKey).emit(event, payload);
          }
        };

        emitToGame("game_over", {
          winner: nextState.winner,
          reason: nextState.reason,
          whiteIsaChange,
          blackIsaChange,
        });
        emitToGame("game_room_state", game);
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
