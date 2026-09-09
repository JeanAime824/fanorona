import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import { createInitialGame, applyMove, endTurn, resignGame } from "../src/game/engine/gameEngine";
import { GameState, Move, Player, GameMode, AiDifficulty } from "../src/game/types/gameTypes";

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

interface ServerUser {
  uid: string;
  id?: string;
  username: string;
  displayName: string;
  email: string;
  photoURL: string;
  avatar_url?: string;
  player_id?: string;
  isa?: number;
  games_played?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  win_rate?: number;
  createdAt: string;
  created_at?: string;
  last_activity?: string;
  status?: string;
}

interface ServerGameSession {
  id: string;
  whitePlayerId: string;
  blackPlayerId: string | null;
  whitePlayerName: string;
  blackPlayerName: string | null;
  timeControl: number; // in seconds
  gameState: GameState;
  createdAt: string;
  updatedAt: string;
}

interface ServerFriendship {
  id: string;
  userId: string;
  friendId: string;
  status: "pending" | "accepted";
  createdAt: string;
}

const activeGames = new Map<string, ServerGameSession>();
const registeredUsers = new Map<string, ServerUser>();
const friendships = new Map<string, ServerFriendship>();

// Helper to generate 6-character player ID
function generatePlayerId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// User Registration API
app.post(["/api/auth/register", "/api/auth/register/"], (req, res) => {
  const { username, email, password, avatar_url, photoURL } = req.body;
  if (!username || typeof username !== "string" || !username.trim()) {
    return res.status(400).json({ error: "Le nom d'utilisateur est requis" });
  }

  const cleanName = username.trim();
  const normalizedKey = cleanName.toLowerCase();

  if (registeredUsers.has(normalizedKey)) {
    return res.status(400).json({ error: "Ce nom d'utilisateur est déjà utilisé" });
  }

  const uniqueId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const playerId = generatePlayerId();
  const avatar = avatar_url || photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;

  const user: ServerUser = {
    uid: uniqueId,
    id: uniqueId,
    username: cleanName,
    displayName: cleanName,
    email: email ? email.trim() : `${normalizedKey}@fanorona.local`,
    photoURL: avatar,
    avatar_url: avatar,
    player_id: playerId,
    isa: 1200,
    games_played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    win_rate: 0,
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
    status: "ONLINE",
  };

  registeredUsers.set(normalizedKey, user);

  res.status(201).json({
    message: "Inscription réussie !",
    token: `token_${uniqueId}`,
    user,
  });
});

// User Authentication API - Login or Auto-Register
app.post(["/api/auth/login", "/api/auth/login/"], (req, res) => {
  const { username, email, photoURL, avatar_url } = req.body;
  const rawIdentifier = username || email || "";
  if (!rawIdentifier || typeof rawIdentifier !== "string" || !rawIdentifier.trim()) {
    return res.status(400).json({ error: "Le nom d'utilisateur est requis" });
  }

  const cleanName = rawIdentifier.trim();
  const normalizedKey = cleanName.toLowerCase();

  let user = registeredUsers.get(normalizedKey);
  if (!user) {
    // Generate permanent unique user ID
    const uniqueId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const playerId = generatePlayerId();
    const avatar = avatar_url || photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;
    user = {
      uid: uniqueId,
      id: uniqueId,
      username: cleanName,
      displayName: cleanName,
      email: email || `${normalizedKey}@fanorona.local`,
      photoURL: avatar,
      avatar_url: avatar,
      player_id: playerId,
      isa: 1200,
      games_played: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      win_rate: 0,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      status: "ONLINE",
    };
    registeredUsers.set(normalizedKey, user);
  }

  res.json({
    message: "Connexion réussie !",
    token: `token_${user.uid}`,
    user,
  });
});

// Friends Management API
app.post("/api/friends/request", (req, res) => {
  const { userId, targetUserId } = req.body;
  if (!userId || !targetUserId) {
    return res.status(400).json({ error: "IDs utilisateur requis" });
  }

  const friendshipId = `${userId}_${targetUserId}`;
  const record: ServerFriendship = {
    id: friendshipId,
    userId,
    friendId: targetUserId,
    status: "accepted", // Auto-accept custom backend friend requests for smooth gameplay
    createdAt: new Date().toISOString(),
  };

  friendships.set(friendshipId, record);
  res.json({ success: true, friendship: record });
});

app.get("/api/friends/:userId", (req, res) => {
  const { userId } = req.params;
  const userFriends = Array.from(friendships.values()).filter(
    (f) => (f.userId === userId || f.friendId === userId) && f.status === "accepted"
  );
  res.json(userFriends);
});

app.get("/api/friends/pending/:userId", (req, res) => {
  const { userId } = req.params;
  const pending = Array.from(friendships.values()).filter(
    (f) => f.friendId === userId && f.status === "pending"
  );
  res.json(pending);
});

// List Users / Players
app.get("/api/users", (req, res) => {
  res.json(Array.from(registeredUsers.values()));
});

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    activeGames: activeGames.size,
    totalUsers: registeredUsers.size,
    timestamp: new Date().toISOString(),
  });
});

// List Public Active Games
app.get("/api/games", (req, res) => {
  const gamesList = Array.from(activeGames.values()).map((g) => ({
    id: g.id,
    whitePlayerName: g.whitePlayerName,
    blackPlayerName: g.blackPlayerName,
    status: g.gameState.status,
    currentPlayer: g.gameState.currentPlayer,
    turnNumber: g.gameState.turnNumber,
    timeControl: g.timeControl,
    createdAt: g.createdAt,
  }));
  res.json(gamesList);
});

// Create Game via REST
app.post("/api/games", (req, res) => {
  const { playerId, playerName, playerColor = "white", timeControl = 30 } = req.body;
  const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const initialGameState = createInitialGame("multiplayer", "medium", "black", gameId);

  const newSession: ServerGameSession = {
    id: gameId,
    whitePlayerId: playerColor === "white" ? playerId : "",
    blackPlayerId: playerColor === "black" ? playerId : null,
    whitePlayerName: playerColor === "white" ? playerName : "En attente...",
    blackPlayerName: playerColor === "black" ? playerName : null,
    timeControl,
    gameState: initialGameState,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  activeGames.set(gameId, newSession);
  res.json({ gameId, gameSession: newSession });
});

// Socket.io Handlers
io.on("connection", (socket: Socket) => {
  console.log(`[Socket.io] Player connected: ${socket.id}`);

  // Create a new game room
  socket.on("create_game", ({ playerId, playerName, playerColor = "white", timeControl = 30 }) => {
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const initialGameState = createInitialGame("multiplayer", "medium", "black", gameId);

    const newSession: ServerGameSession = {
      id: gameId,
      whitePlayerId: playerColor === "white" ? playerId || socket.id : "",
      blackPlayerId: playerColor === "black" ? playerId || socket.id : null,
      whitePlayerName: playerColor === "white" ? playerName || "Joueur Blanc" : "En attente...",
      blackPlayerName: playerColor === "black" ? playerName || "Joueur Noir" : null,
      timeControl,
      gameState: initialGameState,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    activeGames.set(gameId, newSession);
    socket.join(gameId);

    socket.emit("game_created", { gameId, gameSession: newSession });
    io.to(gameId).emit("game_updated", newSession);
  });

  // Join an existing game room
  socket.on("join_game", ({ gameId, playerId, playerName }) => {
    const session = activeGames.get(gameId);
    if (!session) {
      socket.emit("error", { message: "Partie introuvable" });
      return;
    }

    // Assign player to open slot
    if (!session.blackPlayerId && session.whitePlayerId !== playerId) {
      session.blackPlayerId = playerId || socket.id;
      session.blackPlayerName = playerName || "Joueur Noir";
    } else if (!session.whitePlayerId && session.blackPlayerId !== playerId) {
      session.whitePlayerId = playerId || socket.id;
      session.whitePlayerName = playerName || "Joueur Blanc";
    }

    session.updatedAt = new Date().toISOString();
    socket.join(gameId);

    io.to(gameId).emit("game_updated", session);
    socket.emit("game_joined", { gameId, gameSession: session });
  });

  // Make a move
  socket.on("make_move", ({ gameId, move }: { gameId: string; move: Move }) => {
    const session = activeGames.get(gameId);
    if (!session) {
      socket.emit("error", { message: "Partie introuvable" });
      return;
    }

    try {
      const nextState = applyMove(session.gameState, move);
      session.gameState = nextState;
      session.updatedAt = new Date().toISOString();

      io.to(gameId).emit("game_updated", session);
      io.to(gameId).emit("move_made", { move, nextState });
    } catch (err) {
      console.error(`[Server] Failed to apply move in game ${gameId}:`, err);
      socket.emit("error", { message: err instanceof Error ? err.message : "Coup invalide" });
    }
  });

  // End turn voluntarily during multiple capture sequence
  socket.on("end_turn", ({ gameId }: { gameId: string }) => {
    const session = activeGames.get(gameId);
    if (!session) return;

    try {
      const nextState = endTurn(session.gameState);
      session.gameState = nextState;
      session.updatedAt = new Date().toISOString();

      io.to(gameId).emit("game_updated", session);
    } catch (err) {
      console.error(`[Server] Failed to end turn in game ${gameId}:`, err);
    }
  });

  // Resign match
  socket.on("resign", ({ gameId, player }: { gameId: string; player: Player }) => {
    const session = activeGames.get(gameId);
    if (!session) return;

    try {
      const nextState = resignGame(session.gameState, player);
      session.gameState = nextState;
      session.updatedAt = new Date().toISOString();

      io.to(gameId).emit("game_updated", session);
      io.to(gameId).emit("game_over", { winner: nextState.winner, reason: nextState.reason });
    } catch (err) {
      console.error(`[Server] Failed to resign game ${gameId}:`, err);
    }
  });

  // Chat message in game room
  socket.on("send_message", ({ gameId, senderName, text }) => {
    io.to(gameId).emit("chat_message", {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      senderName,
      text,
      timestamp: Date.now(),
    });
  });

  // WebRTC Voice Chat Signaling Handlers
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

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`[Socket.io] Player disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`[Server] Fanorona Backend running on http://localhost:${PORT}`);
});
