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

const activeGames = new Map<string, ServerGameSession>();

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", activeGames: activeGames.size, timestamp: new Date().toISOString() });
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

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`[Socket.io] Player disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`[Server] Fanorona Backend running on http://localhost:${PORT}`);
});
