/**
 * @file GamePage.tsx
 * Primary game screen containing the Fanorona board, status display, move log,
 * and dialog controllers.
 */

import React, { useEffect, useState } from "react";
import { FanoronaBoard } from "../components/board/FanoronaBoard";
import { GameControlsBar } from "../components/game/GameControlsBar";
import { GameOverModal } from "../components/game/GameOverModal";
import { GameStatusPanel } from "../components/game/GameStatusPanel";
import { MoveHistoryPanel } from "../components/game/MoveHistoryPanel";
import { NewGameModal } from "../components/game/NewGameModal";
import { VictoryOverlay } from "../components/game/VictoryOverlay";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { AiDifficulty, GameMode, Player } from "../game/types/gameTypes";
import { useFanoronaGame } from "../hooks/useFanoronaGame";

export const GamePage: React.FC = () => {
  const {
    gameState,
    settings,
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
    timeRemaining,
    toggleSpeedMode,
    setTurnTimeLimit,
  } = useFanoronaGame();

  const [isNewGameOpen, setIsNewGameOpen] = useState(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [isVictoryOverlayOpen, setIsVictoryOverlayOpen] = useState(false);
  const [isResignConfirmOpen, setIsResignConfirmOpen] = useState(false);

  // Trigger celebration overlay or game over modal when status changes to game_over
  useEffect(() => {
    if (gameState.status === "game_over") {
      if (gameState.winner && gameState.winner !== "draw") {
        setIsVictoryOverlayOpen(true);
        setIsGameOverModalOpen(false);
      } else {
        setIsGameOverModalOpen(true);
        setIsVictoryOverlayOpen(false);
      }
    } else {
      setIsVictoryOverlayOpen(false);
      setIsGameOverModalOpen(false);
    }
  }, [gameState.status, gameState.winner]);

  const getWinnerDisplayName = (): string => {
    if (!gameState.winner || gameState.winner === "draw") return "";
    if (gameState.gameMode === "ai") {
      if (gameState.winner === gameState.aiPlayerColor) {
        return "Intelligence Artificielle";
      }
      const customName =
        gameState.winner === "white"
          ? settings.playerNameWhite
          : settings.playerNameBlack;
      return customName && customName.trim() ? customName.trim() : "Joueur";
    }
    if (gameState.winner === "white") {
      return settings.playerNameWhite && settings.playerNameWhite.trim()
        ? settings.playerNameWhite.trim()
        : "Joueur Blanc";
    }
    return settings.playerNameBlack && settings.playerNameBlack.trim()
      ? settings.playerNameBlack.trim()
      : "Joueur Noir";
  };

  // Keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is inside an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === " " || e.key === "Enter") {
        if (gameState.captureSequence) {
          e.preventDefault();
          handleEndTurn();
        }
      } else if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey) {
        setIsNewGameOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, handleEndTurn, gameState.captureSequence]);

  return (
    <div className="w-full px-3 sm:px-4 py-4 space-y-4">
      {/* Top Matchup Header: Joueur Noir VS Joueur Blanc */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#141312] border border-white/[0.04] mx-auto max-w-7xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1C1A18] border border-[#3A3734]" />
          <span className="text-xs font-serif font-medium text-[#F5F3EE]">
            {gameState.gameMode === "ai" && gameState.aiPlayerColor === "black"
              ? "IA (Noir)"
              : settings.playerNameBlack?.trim() || "Joueur Noir"}
          </span>
          {!gameState.currentPlayer.startsWith("w") && gameState.status === "playing" && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A452]" />
          )}
        </div>

        <div className="text-[10px] font-mono tracking-widest text-[#6B655E] uppercase font-semibold">
          VS
        </div>

        <div className="flex items-center gap-2">
          {gameState.currentPlayer === "white" && gameState.status === "playing" && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#C8A452]" />
          )}
          <span className="text-xs font-serif font-medium text-[#F5F3EE]">
            {gameState.gameMode === "ai" && gameState.aiPlayerColor === "white"
              ? "IA (Blanc)"
              : settings.playerNameWhite?.trim() || "Joueur Blanc"}
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#EDE8DE] border border-[#CCC4B4]" />
        </div>
      </div>

      {/* Main Layout: Board (left) + History (right) */}
      <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Board + Player Info + Controls */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Board - Visually Dominant Centerpiece */}
          <div className="w-full flex flex-col items-center justify-center">
            <FanoronaBoard
              gameState={gameState}
              targetablePositions={targetablePositions}
              pendingChoice={pendingChoice}
              theme={settings.theme}
              pieceTexture={settings.pieceTexture}
              animationsEnabled={settings.animationsEnabled}
              onSelectPosition={selectPosition}
              onResolveChoice={resolveChoice}
              onCancelChoice={cancelChoice}
              showCoordinates={true}
            />
          </div>

          {/* Player Cards - Compact Below Board */}
          <GameStatusPanel
            gameState={gameState}
            isAiThinking={isAiThinking}
            onEndTurn={handleEndTurn}
            speedModeEnabled={settings.speedModeEnabled}
            turnTimeLimit={settings.turnTimeLimit}
            timeRemaining={timeRemaining}
            onToggleSpeedMode={toggleSpeedMode}
            onSetTurnTimeLimit={setTurnTimeLimit}
          />

          {/* Controls Bar */}
          <GameControlsBar
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onResign={() => setIsResignConfirmOpen(true)}
            onNewGame={() => setIsNewGameOpen(true)}
            isGameOver={gameState.status === "game_over"}
            speedModeEnabled={settings.speedModeEnabled}
            turnTimeLimit={settings.turnTimeLimit}
            onToggleSpeedMode={toggleSpeedMode}
            onShowVictory={() => {
              if (gameState.winner && gameState.winner !== "draw") {
                setIsVictoryOverlayOpen(true);
              } else {
                setIsGameOverModalOpen(true);
              }
            }}
          />
        </div>

        {/* Right Column: Move History */}
        <div className="lg:col-span-4 flex flex-col">
          <MoveHistoryPanel history={gameState.moveHistory} />
        </div>
      </div>

      {/* Victory Celebration Animated Overlay */}
      <VictoryOverlay
        isOpen={isVictoryOverlayOpen}
        gameState={gameState}
        winnerName={getWinnerDisplayName()}
        isSpeedMode={settings.speedModeEnabled}
        onRestartImmediately={() => {
          setIsVictoryOverlayOpen(false);
          startNewGame(
            gameState.gameMode,
            gameState.difficulty,
            gameState.aiPlayerColor
          );
        }}
        onReviewBoard={() => setIsVictoryOverlayOpen(false)}
        onOpenNewGameModal={() => {
          setIsVictoryOverlayOpen(false);
          setIsNewGameOpen(true);
        }}
      />

      {/* Game Over Modal (Draws and detailed inspection) */}
      <GameOverModal
        gameState={gameState}
        isOpen={isGameOverModalOpen}
        onClose={() => setIsGameOverModalOpen(false)}
        onRestart={() => {
          setIsGameOverModalOpen(false);
          startNewGame(
            gameState.gameMode,
            gameState.difficulty,
            gameState.aiPlayerColor
          );
        }}
      />

      {/* New Game Setup Modal */}
      <NewGameModal
        isOpen={isNewGameOpen}
        onClose={() => setIsNewGameOpen(false)}
        onStartGame={(mode: GameMode, diff: AiDifficulty, playerColor: Player, speedMode?: boolean, timeLimit?: number) => {
          if (typeof speedMode === "boolean") {
            updateSettings({
              speedModeEnabled: speedMode,
              turnTimeLimit: timeLimit || settings.turnTimeLimit,
            });
          }
          startNewGame(mode, diff, playerColor);
        }}
        initialDifficulty={settings.aiDifficulty}
        initialSpeedMode={settings.speedModeEnabled}
        initialTimeLimit={settings.turnTimeLimit}
      />

      {/* Resignation Confirmation Modal */}
      <Modal
        isOpen={isResignConfirmOpen}
        onClose={() => setIsResignConfirmOpen(false)}
        title="Déclarer forfait ?"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs text-white/70 leading-relaxed">
          <p>
            Êtes-vous certain de vouloir abandonner la partie en cours ? La victoire sera accordée à votre adversaire.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsResignConfirmOpen(false)}
            >
              Continuer à jouer
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setIsResignConfirmOpen(false);
                handleResign();
              }}
            >
              Abandonner
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
