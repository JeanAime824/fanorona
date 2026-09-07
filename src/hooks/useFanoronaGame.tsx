/**
 * @file useFanoronaGame.ts
 * React hook bridging the pure Fanorona game engine, history manager,
 * AI agent, sound synthesizer, and storage service.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { chooseBestMove } from "../game/ai/aiPlayer";
import { isSamePosition } from "../game/board/boardGraph";
import { applyMove, createInitialGame, endTurn, resignGame } from "../game/engine/gameEngine";
import { HistoryManager } from "../game/history/historyManager";
import { getLegalMoves } from "../game/moves/moveGenerator";
import {
  AiDifficulty,
  GameMode,
  GameSettings,
  GameState,
  GameStats,
  Move,
  Player,
  Position,
} from "../game/types/gameTypes";
import { sound } from "../services/audio/soundSynthesizer";
import { storageService } from "../services/storage/storageService";

export interface PendingAmbiguousMove {
  from: Position;
  to: Position;
  approachMove: Move;
  withdrawalMove: Move;
}

export type FanoronaGameReturn = ReturnType<typeof useFanoronaGameEngine>;

const FanoronaContext = createContext<FanoronaGameReturn | null>(null);

export const FanoronaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const game = useFanoronaGameEngine();
  return <FanoronaContext.Provider value={game}>{children}</FanoronaContext.Provider>;
};

export function useFanoronaGame(): FanoronaGameReturn {
  const context = useContext(FanoronaContext);
  if (context) {
    return context;
  }
  // Fallback if rendered outside provider
  return useFanoronaGameEngine();
}

export function useFanoronaGameEngine() {
  const [settings, setSettings] = useState<GameSettings>(() => storageService.loadSettings());
  const [stats, setStats] = useState<GameStats>(() => storageService.loadStats());
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<PendingAmbiguousMove | null>(null);

  // Sound sync
  useEffect(() => {
    sound.setSoundEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // History Manager
  const historyManagerRef = useRef<HistoryManager>(new HistoryManager());

  // Initialize GameState: load saved game if valid, or new initial game
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = storageService.loadGame();
    if (saved && saved.status === "playing") {
      return saved;
    }
    return createInitialGame("pvp", "medium", "black");
  });

  // Track undo/redo capability
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateHistoryState = useCallback(() => {
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
  }, []);

  // Persist game state on changes
  useEffect(() => {
    storageService.saveGame(gameState);
    updateHistoryState();
  }, [gameState, updateHistoryState]);

  // Record stats on game over
  const hasRecordedGameOverRef = useRef(false);
  useEffect(() => {
    if (gameState.status === "game_over" && !hasRecordedGameOverRef.current) {
      hasRecordedGameOverRef.current = true;
      sound.playVictory();

      setStats((prev) => {
        const next: GameStats = {
          ...prev,
          gamesPlayed: prev.gamesPlayed + 1,
          gamesWon:
            gameState.gameMode === "ai" &&
            gameState.winner !== "draw" &&
            gameState.winner !== gameState.aiPlayerColor
              ? prev.gamesWon + 1
              : prev.gamesWon,
          gamesLost:
            gameState.gameMode === "ai" && gameState.winner === gameState.aiPlayerColor
              ? prev.gamesLost + 1
              : prev.gamesLost,
          gamesDrawn: gameState.winner === "draw" ? prev.gamesDrawn + 1 : prev.gamesDrawn,
          aiWins: {
            ...prev.aiWins,
            [gameState.difficulty]:
              gameState.gameMode === "ai" &&
              gameState.winner !== "draw" &&
              gameState.winner !== gameState.aiPlayerColor
                ? prev.aiWins[gameState.difficulty] + 1
                : prev.aiWins[gameState.difficulty],
          },
          totalCaptures:
            prev.totalCaptures + gameState.capturedPieces.white + gameState.capturedPieces.black,
        };
        storageService.saveStats(next);
        return next;
      });
    } else if (gameState.status === "playing") {
      hasRecordedGameOverRef.current = false;
    }
  }, [gameState.status, gameState.winner, gameState.gameMode, gameState.aiPlayerColor, gameState.difficulty, gameState.capturedPieces]);

  // Start new game
  const startNewGame = useCallback(
    (
      mode: GameMode = "pvp",
      diff: AiDifficulty = settings.aiDifficulty,
      aiColor: Player = "black"
    ) => {
      const newGame = createInitialGame(mode, diff, aiColor);
      historyManagerRef.current.reset();
      setPendingChoice(null);
      setIsAiThinking(false);
      setGameState(newGame);
      storageService.saveGame(newGame);
      updateHistoryState();
      sound.playSelect();
    },
    [settings.aiDifficulty, updateHistoryState]
  );

  // Apply a validated move with state and sound updates
  const executeValidatedMove = useCallback(
    (move: Move, isFromAi: boolean = false) => {
      if (gameState.status !== "playing") return;

      historyManagerRef.current.pushState(gameState);

      try {
        const nextState = applyMove(gameState, move);

        // Immediate React state update
        setGameState(nextState);
        setPendingChoice(null);
        updateHistoryState();

        // Non-blocking sound cue
        if (move.captures.length > 0) {
          if (nextState.captureSequence) {
            sound.playCombo(nextState.captureSequence.capturesCount);
          } else {
            sound.playCapture();
          }
        } else {
          sound.playMove();
        }
      } catch (err) {
        console.error("Failed to apply move:", err);
        sound.playError();
      }
    },
    [gameState, updateHistoryState]
  );

  // Handle board intersection clicks
  const selectPosition = useCallback(
    (clickedPos: Position) => {
      if (gameState.status !== "playing" || isAiThinking) return;

      // In AI mode, prevent player from moving during AI's turn
      if (
        gameState.gameMode === "ai" &&
        gameState.currentPlayer === gameState.aiPlayerColor
      ) {
        return;
      }

      const pieceAtClick = gameState.board[clickedPos.row][clickedPos.col];

      // 0. If currently choosing which capture side to execute (approach vs withdrawal)
      if (pendingChoice) {
        const isApproachPiece = pendingChoice.approachMove.captures.some((c) =>
          isSamePosition(c, clickedPos)
        );
        if (isApproachPiece) {
          resolveChoice("approach");
          return;
        }

        const isWithdrawalPiece = pendingChoice.withdrawalMove.captures.some((c) =>
          isSamePosition(c, clickedPos)
        );
        if (isWithdrawalPiece) {
          resolveChoice("withdrawal");
          return;
        }

        // Clicked origin or destination cancels the pending choice
        if (
          isSamePosition(clickedPos, pendingChoice.from) ||
          isSamePosition(clickedPos, pendingChoice.to)
        ) {
          setPendingChoice(null);
          return;
        }

        // If clicked on another friendly piece, switch to that piece
        setPendingChoice(null);
        if (pieceAtClick && pieceAtClick.player === gameState.currentPlayer) {
          const pieceLegalMoves = gameState.legalMoves.filter((m) =>
            isSamePosition(m.from, clickedPos)
          );
          if (pieceLegalMoves.length > 0) {
            setGameState((prev) => ({
              ...prev,
              selectedPosition: clickedPos,
            }));
            sound.playSelect();
            return;
          }
        }
        return;
      }
      if (gameState.captureSequence) {
        const activePos = gameState.captureSequence.piecePosition;
        const availableMoves = gameState.legalMoves.filter((m) =>
          isSamePosition(m.to, clickedPos)
        );

        if (availableMoves.length === 1) {
          executeValidatedMove(availableMoves[0]);
        } else if (availableMoves.length > 1) {
          // Simultaneous approach and withdrawal
          const approachMove = availableMoves.find((m) => m.captureType === "approach");
          const withdrawalMove = availableMoves.find((m) => m.captureType === "withdrawal");
          if (approachMove && withdrawalMove) {
            setPendingChoice({
              from: activePos,
              to: clickedPos,
              approachMove,
              withdrawalMove,
            });
          }
        } else {
          sound.playError();
        }
        return;
      }

      // 2. Clicked on a friendly piece: select it or toggle off if already selected
      if (pieceAtClick && pieceAtClick.player === gameState.currentPlayer) {
        if (
          gameState.selectedPosition &&
          isSamePosition(clickedPos, gameState.selectedPosition)
        ) {
          setGameState((prev) => ({
            ...prev,
            selectedPosition: null,
          }));
          sound.playSelect();
          return;
        }

        // Check if piece has legal moves
        const pieceLegalMoves = gameState.legalMoves.filter((m) =>
          isSamePosition(m.from, clickedPos)
        );

        if (pieceLegalMoves.length > 0) {
          setGameState((prev) => ({
            ...prev,
            selectedPosition: clickedPos,
          }));
          sound.playSelect();
        } else {
          // Cannot move this piece (e.g. captures mandatory elsewhere, or piece blocked)
          sound.playError();
        }
        return;
      }

      // 3. Clicked on empty intersection with a piece currently selected: attempt move
      if (gameState.selectedPosition && !pieceAtClick) {
        const movesToTarget = gameState.legalMoves.filter(
          (m) =>
            isSamePosition(m.from, gameState.selectedPosition) &&
            isSamePosition(m.to, clickedPos)
        );

        if (movesToTarget.length === 1) {
          executeValidatedMove(movesToTarget[0]);
        } else if (movesToTarget.length > 1) {
          // Ambiguous: simultaneous approach and withdrawal!
          const approachMove = movesToTarget.find((m) => m.captureType === "approach");
          const withdrawalMove = movesToTarget.find((m) => m.captureType === "withdrawal");
          if (approachMove && withdrawalMove) {
            setPendingChoice({
              from: gameState.selectedPosition,
              to: clickedPos,
              approachMove,
              withdrawalMove,
            });
          }
        } else {
          sound.playError();
        }
      }
    },
    [gameState, isAiThinking, executeValidatedMove]
  );

  // Resolve user choice between approach and withdrawal
  const resolveChoice = useCallback(
    (type: "approach" | "withdrawal") => {
      if (!pendingChoice) return;
      const move =
        type === "approach" ? pendingChoice.approachMove : pendingChoice.withdrawalMove;
      executeValidatedMove(move);
    },
    [pendingChoice, executeValidatedMove]
  );

  // Cancel pending ambiguous capture choice
  const cancelChoice = useCallback(() => {
    setPendingChoice(null);
  }, []);

  // Voluntary turn end during multiple capture sequence
  const handleEndTurn = useCallback(() => {
    if (gameState.status !== "playing" || !gameState.captureSequence) return;
    historyManagerRef.current.pushState(gameState);
    const nextState = endTurn(gameState);
    setGameState(nextState);
    setPendingChoice(null);
    updateHistoryState();
    sound.playMove();
  }, [gameState, updateHistoryState]);

  // Undo
  const handleUndo = useCallback(() => {
    if (isAiThinking) return;
    const restored = historyManagerRef.current.undo(gameState);
    if (restored) {
      setGameState(restored);
      setPendingChoice(null);
      updateHistoryState();
      sound.playSelect();
    }
  }, [gameState, isAiThinking, updateHistoryState]);

  // Redo
  const handleRedo = useCallback(() => {
    if (isAiThinking) return;
    const restored = historyManagerRef.current.redo(gameState);
    if (restored) {
      setGameState(restored);
      setPendingChoice(null);
      updateHistoryState();
      sound.playSelect();
    }
  }, [gameState, isAiThinking, updateHistoryState]);

  // Resign
  const handleResign = useCallback(() => {
    if (gameState.status !== "playing") return;
    const nextState = resignGame(gameState, gameState.currentPlayer);
    setGameState(nextState);
    setPendingChoice(null);
  }, [gameState]);

  // Settings updater
  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      storageService.saveSettings(updated);
      return updated;
    });
  }, []);

  // AI Turn Execution Loop
  useEffect(() => {
    if (
      gameState.status !== "playing" ||
      gameState.gameMode !== "ai" ||
      gameState.currentPlayer !== gameState.aiPlayerColor
    ) {
      return;
    }

    setIsAiThinking(true);

    const timer = setTimeout(() => {
      const decision = chooseBestMove(gameState);

      if (decision.action === "end_turn") {
        if (gameState.captureSequence) {
          const nextState = endTurn(gameState);
          setGameState(nextState);
          sound.playMove();
        }
        setIsAiThinking(false);
        return;
      }

      if (decision.move) {
        historyManagerRef.current.pushState(gameState);
        const nextState = applyMove(gameState, decision.move);

        if (decision.move.captures.length > 0) {
          if (nextState.captureSequence) {
            sound.playCombo(nextState.captureSequence.capturesCount);
          } else {
            sound.playCapture();
          }
        } else {
          sound.playMove();
        }

        setGameState(nextState);
        updateHistoryState();
      }

      setIsAiThinking(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [gameState, updateHistoryState]);

  // Currently targetable positions for the active piece
  const targetablePositions = useMemo(() => {
    if (!settings.showPossibleMoves) return [];
    if (gameState.status !== "playing") return [];

    const activeFrom = gameState.captureSequence
      ? gameState.captureSequence.piecePosition
      : gameState.selectedPosition;

    if (!activeFrom) return [];

    return gameState.legalMoves
      .filter((m) => isSamePosition(m.from, activeFrom))
      .map((m) => m.to);
  }, [
    settings.showPossibleMoves,
    gameState.status,
    gameState.captureSequence,
    gameState.selectedPosition,
    gameState.legalMoves,
  ]);

  return {
    gameState,
    settings,
    stats,
    isAiThinking,
    pendingChoice,
    canUndo,
    canRedo,
    targetablePositions,
    startNewGame,
    selectPosition,
    resolveChoice,
    cancelChoice,
    handleEndTurn,
    handleUndo,
    handleRedo,
    handleResign,
    updateSettings,
  };
}
