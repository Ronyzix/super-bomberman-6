// Main Game Component - React wrapper for the game engine

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, gameEngine } from './engine/GameEngine';
import { Renderer, renderer } from './engine/Renderer';
import { InputManager, inputManager } from './systems/InputManager';
import { EnemyAI, enemyAI } from './systems/EnemyAI';
import { ALL_LEVELS, getLevelById } from './levels/LevelData';
import { GAME_CONFIG, GAME_STATES } from './constants';
import { GameStateData, Player, InputState } from './types';
import { isTouchDevice } from './utils/helpers';

interface GameComponentProps {
  levelId?: number;
  isMultiplayer?: boolean;
  roomId?: string;
  onGameOver?: (score: number) => void;
  onLevelComplete?: (levelId: number, score: number) => void;
  onPause?: () => void;
  onResume?: () => void;
}

export const GameComponent: React.FC<GameComponentProps> = ({
  levelId = 1,
  isMultiplayer = false,
  roomId,
  onGameOver,
  onLevelComplete,
  onPause,
  onResume,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);
  const lastFrameTime = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);

  // Initialize game
  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize systems
    renderer.init(canvasRef.current);
    inputManager.init();
    gameEngine.init({ isMultiplayer, roomId });

    // Set up callbacks
    gameEngine.setStateChangeCallback((state) => {
      setGameState({ ...state });
    });

    gameEngine.setGameEventCallback((event, data) => {
      handleGameEvent(event, data);
    });

    inputManager.setOnPause(() => {
      togglePause();
    });

    // Load level
    loadLevel(levelId);

    // Handle resize
    const handleResize = () => {
      renderer.resize();
    };
    window.addEventListener('resize', handleResize);

    // Detect touch device
    setShowTouchControls(isTouchDevice());

    // Start game loop
    startGameLoop();

    return () => {
      window.removeEventListener('resize', handleResize);
      inputManager.destroy();
      renderer.destroy();
      gameEngine.destroy();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // Load level when levelId changes
  useEffect(() => {
    if (gameState && gameState.state !== GAME_STATES.LOADING) {
      loadLevel(levelId);
    }
  }, [levelId]);

  const loadLevel = useCallback((id: number) => {
    const level = getLevelById(id);
    if (!level) return;

    // Set theme based on world
    renderer.setTheme(level.world);

    // Load level data
    gameEngine.loadLevel({
      grid: level.grid,
      enemies: level.enemies,
      boss: level.boss,
    });

    // Create player(s)
    const spawnPositions = [
      { col: 1, row: 1 },
      { col: 13, row: 1 },
      { col: 1, row: 11 },
      { col: 13, row: 11 },
    ];

    const playerCount = isMultiplayer ? 4 : 1;
    for (let i = 0; i < playerCount; i++) {
      const player = gameEngine.createPlayer(i, spawnPositions[i]);
      gameEngine.addPlayer(player);
    }

    // Update state
    gameEngine.setState({
      currentLevel: id,
      currentWorld: level.world,
      state: GAME_STATES.PLAYING,
    });

    gameEngine.start();
  }, [isMultiplayer]);

  const startGameLoop = useCallback(() => {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTime.current;
      lastFrameTime.current = currentTime;

      if (!isPaused) {
        // Get input
        const input = inputManager.getInputState();

        // Update player movement
        const state = gameEngine.getState();
        if (state.players.length > 0 && state.state === GAME_STATES.PLAYING) {
          gameEngine.movePlayer(state.players[0].id, input, deltaTime);
        }

        // Update enemy AI
        enemyAI.update(
          state.enemies,
          state.players,
          state.bombs,
          state.grid,
          deltaTime
        );

        // Render
        renderer.render(state, deltaTime);
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    lastFrameTime.current = performance.now();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [isPaused]);

  const handleGameEvent = useCallback((event: string, data: any) => {
    switch (event) {
      case 'gameOver':
        if (onGameOver) {
          onGameOver(data.score);
        }
        break;
      case 'levelComplete':
        if (onLevelComplete) {
          onLevelComplete(data.level, data.score);
        }
        break;
      case 'bombPlaced':
        // Play sound effect
        break;
      case 'bombExploded':
        // Play explosion sound
        break;
      case 'powerUpCollected':
        // Play power-up sound
        break;
      case 'enemyKilled':
        // Play enemy death sound
        break;
      case 'playerDamaged':
        // Play damage sound
        break;
    }
  }, [onGameOver, onLevelComplete]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const newPaused = !prev;
      if (newPaused) {
        gameEngine.pause();
        if (onPause) onPause();
      } else {
        gameEngine.resume();
        if (onResume) onResume();
      }
      return newPaused;
    });
  }, [onPause, onResume]);

  const handleTouchBomb = useCallback(() => {
    const state = gameEngine.getState();
    if (state.players.length > 0) {
      gameEngine.placeBomb(state.players[0]);
    }
  }, []);

  const handleTouchDetonate = useCallback(() => {
    const state = gameEngine.getState();
    if (state.players.length > 0) {
      gameEngine.detonateRemoteBombs(state.players[0].id);
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-gray-900 overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* HUD */}
      {gameState && (
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
          {/* Player Info */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500">❤️</span>
                <span className="font-bold">{gameState.players[0]?.lives || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💣</span>
                <span className="font-bold">{gameState.players[0]?.maxBombs || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🔥</span>
                <span className="font-bold">{gameState.players[0]?.fireRange || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span className="font-bold">{gameState.players[0]?.speed.toFixed(1) || 0}</span>
              </div>
            </div>
          </div>

          {/* Score & Level */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-center">
            <div className="text-sm text-gray-300">Level {gameState.currentLevel}</div>
            <div className="text-2xl font-bold text-yellow-400">
              {gameState.score.toLocaleString()}
            </div>
          </div>

          {/* Pause Button */}
          <button
            onClick={togglePause}
            className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white pointer-events-auto hover:bg-black/70 transition-colors"
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
        </div>
      )}

      {/* Touch Controls */}
      {showTouchControls && (
        <>
          {/* Virtual Joystick Area */}
          <div className="absolute bottom-8 left-8 w-32 h-32 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/30" />
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-8 right-8 flex flex-col gap-4">
            <button
              onTouchStart={handleTouchDetonate}
              className="w-16 h-16 rounded-full bg-purple-500/80 text-white text-2xl font-bold shadow-lg active:scale-95 transition-transform"
            >
              💥
            </button>
            <button
              onTouchStart={handleTouchBomb}
              className="w-20 h-20 rounded-full bg-red-500/80 text-white text-3xl font-bold shadow-lg active:scale-95 transition-transform"
            >
              💣
            </button>
          </div>
        </>
      )}

      {/* Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">PAUSED</h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={togglePause}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
              >
                Resume
              </button>
              <button
                onClick={() => {
                  gameEngine.stop();
                  window.location.href = '/';
                }}
                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
              >
                Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState?.state === GAME_STATES.GAME_OVER && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
            <p className="text-2xl text-yellow-400 mb-6">
              Score: {gameState.score.toLocaleString()}
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => loadLevel(gameState.currentLevel)}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Overlay */}
      {gameState?.state === GAME_STATES.VICTORY && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <h2 className="text-4xl font-bold text-green-500 mb-4">VICTORY!</h2>
            <p className="text-2xl text-yellow-400 mb-6">
              Score: {gameState.score.toLocaleString()}
            </p>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  const nextLevel = gameState.currentLevel + 1;
                  if (nextLevel <= ALL_LEVELS.length) {
                    loadLevel(nextLevel);
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
              >
                {gameState.currentLevel < ALL_LEVELS.length ? 'Next Level' : 'Main Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameComponent;
