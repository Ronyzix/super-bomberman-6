// Game HUD Component - Displays game information during gameplay

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Clock, 
  Bomb, 
  Flame, 
  Zap, 
  Settings, 
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { HUDConfig, HUDSettings, loadConfig } from './HUDSettings';
import { Player, PowerUp } from '../types';

interface GameHUDProps {
  player: Player | null;
  score: number;
  time: number;
  level: number;
  world: number;
  isPaused: boolean;
  onPause: () => void;
  onSettings: () => void;
  powerUps: string[];
}

export function GameHUD({
  player,
  score,
  time,
  level,
  world,
  isPaused,
  onPause,
  onSettings,
  powerUps,
}: GameHUDProps) {
  const [config, setConfig] = useState<HUDConfig>(loadConfig());
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getPositionClasses = (): string => {
    switch (config.position) {
      case 'top':
        return 'top-0 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'bottom-0 left-1/2 -translate-x-1/2';
      case 'top-left':
        return 'top-0 left-0';
      case 'top-right':
        return 'top-0 right-0';
      case 'bottom-left':
        return 'bottom-0 left-0';
      case 'bottom-right':
        return 'bottom-0 right-0';
      default:
        return 'top-0 left-1/2 -translate-x-1/2';
    }
  };

  const getSizeClasses = (): string => {
    switch (config.size) {
      case 'small':
        return 'text-xs p-2 gap-2';
      case 'medium':
        return 'text-sm p-3 gap-3';
      case 'large':
        return 'text-base p-4 gap-4';
      default:
        return 'text-sm p-3 gap-3';
    }
  };

  const getIconSize = (): string => {
    switch (config.size) {
      case 'small':
        return 'w-3 h-3';
      case 'medium':
        return 'w-4 h-4';
      case 'large':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  return (
    <>
      {/* Main HUD */}
      <div
        className={`absolute ${getPositionClasses()} z-40 pointer-events-none`}
        style={{ opacity: config.opacity / 100 }}
      >
        <div className={`flex items-center ${getSizeClasses()} bg-black/60 backdrop-blur-sm rounded-lg m-2`}>
          {/* Level Info */}
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/30 rounded">
            <span className="font-bold">W{world}-{level}</span>
          </div>

          {/* Score */}
          {config.showScore && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 font-bold">{score.toLocaleString()}</span>
            </div>
          )}

          {/* Lives */}
          {config.showLives && player && (
            <div className="flex items-center gap-1">
              <Heart className={`${getIconSize()} text-red-500 fill-red-500`} />
              <span>{player.lives}</span>
            </div>
          )}

          {/* Time */}
          {config.showTime && (
            <div className="flex items-center gap-1">
              <Clock className={`${getIconSize()} text-blue-400`} />
              <span className="font-mono">{formatTime(time)}</span>
            </div>
          )}

          {/* Power-ups */}
          {config.showPowerUps && player && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1" title="Bombs">
                <Bomb className={`${getIconSize()} text-gray-300`} />
                <span>{player.maxBombs}</span>
              </div>
              <div className="flex items-center gap-1" title="Fire Range">
                <Flame className={`${getIconSize()} text-orange-500`} />
                <span>{player.fireRange}</span>
              </div>
              <div className="flex items-center gap-1" title="Speed">
                <Zap className={`${getIconSize()} text-yellow-400`} />
                <span>{player.speed.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Bomb Type */}
          {player && player.bombType !== 'normal' && (
            <Badge variant="outline" className="text-xs border-orange-500 text-orange-400">
              {player.bombType.toUpperCase()}
            </Badge>
          )}
        </div>
      </div>

      {/* Control Buttons (top right) */}
      <div className="absolute top-2 right-2 z-40 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/40 hover:bg-black/60 text-white pointer-events-auto"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/40 hover:bg-black/60 text-white pointer-events-auto"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="bg-black/40 hover:bg-black/60 text-white pointer-events-auto"
          onClick={onPause}
        >
          <Pause className="w-5 h-5" />
        </Button>
      </div>

      {/* HUD Settings Modal */}
      <HUDSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={config}
        onConfigChange={setConfig}
      />
    </>
  );
}

// Mobile Touch Controls Component
interface TouchControlsProps {
  config: HUDConfig;
  onInput: (input: { up?: boolean; down?: boolean; left?: boolean; right?: boolean; bomb?: boolean }) => void;
}

export function TouchControls({ config, onInput }: TouchControlsProps) {
  const scale = config.controlsSize / 100;
  const opacity = config.controlsOpacity / 100;

  const handleDPadPress = (direction: 'up' | 'down' | 'left' | 'right') => {
    onInput({ [direction]: true });
  };

  const handleDPadRelease = (direction: 'up' | 'down' | 'left' | 'right') => {
    onInput({ [direction]: false });
  };

  const handleBombPress = () => {
    onInput({ bomb: true });
  };

  const handleBombRelease = () => {
    onInput({ bomb: false });
  };

  const buttonSize = 60 * scale;
  const dpadSize = 150 * scale;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none p-4">
      <div className="flex justify-between items-end max-w-2xl mx-auto">
        {/* D-Pad */}
        {(config.controlsPosition === 'left' || config.controlsPosition === 'both') && (
          <div
            className="relative pointer-events-auto"
            style={{ width: dpadSize, height: dpadSize, opacity }}
          >
            {/* Up */}
            <button
              className="absolute left-1/2 -translate-x-1/2 top-0 bg-white/20 active:bg-white/40 rounded-lg flex items-center justify-center touch-none"
              style={{ width: buttonSize, height: buttonSize }}
              onTouchStart={() => handleDPadPress('up')}
              onTouchEnd={() => handleDPadRelease('up')}
              onMouseDown={() => handleDPadPress('up')}
              onMouseUp={() => handleDPadRelease('up')}
            >
              <div className="w-0 h-0 border-l-8 border-r-8 border-b-12 border-transparent border-b-white" />
            </button>
            
            {/* Down */}
            <button
              className="absolute left-1/2 -translate-x-1/2 bottom-0 bg-white/20 active:bg-white/40 rounded-lg flex items-center justify-center touch-none"
              style={{ width: buttonSize, height: buttonSize }}
              onTouchStart={() => handleDPadPress('down')}
              onTouchEnd={() => handleDPadRelease('down')}
              onMouseDown={() => handleDPadPress('down')}
              onMouseUp={() => handleDPadRelease('down')}
            >
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-12 border-transparent border-t-white" />
            </button>
            
            {/* Left */}
            <button
              className="absolute top-1/2 -translate-y-1/2 left-0 bg-white/20 active:bg-white/40 rounded-lg flex items-center justify-center touch-none"
              style={{ width: buttonSize, height: buttonSize }}
              onTouchStart={() => handleDPadPress('left')}
              onTouchEnd={() => handleDPadRelease('left')}
              onMouseDown={() => handleDPadPress('left')}
              onMouseUp={() => handleDPadRelease('left')}
            >
              <div className="w-0 h-0 border-t-8 border-b-8 border-r-12 border-transparent border-r-white" />
            </button>
            
            {/* Right */}
            <button
              className="absolute top-1/2 -translate-y-1/2 right-0 bg-white/20 active:bg-white/40 rounded-lg flex items-center justify-center touch-none"
              style={{ width: buttonSize, height: buttonSize }}
              onTouchStart={() => handleDPadPress('right')}
              onTouchEnd={() => handleDPadRelease('right')}
              onMouseDown={() => handleDPadPress('right')}
              onMouseUp={() => handleDPadRelease('right')}
            >
              <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white" />
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons */}
        {(config.controlsPosition === 'right' || config.controlsPosition === 'both') && (
          <div className="flex gap-3 pointer-events-auto" style={{ opacity }}>
            {/* Bomb Button */}
            <button
              className="bg-red-500/60 active:bg-red-500/90 rounded-full flex items-center justify-center touch-none shadow-lg"
              style={{ width: buttonSize * 1.3, height: buttonSize * 1.3 }}
              onTouchStart={handleBombPress}
              onTouchEnd={handleBombRelease}
              onMouseDown={handleBombPress}
              onMouseUp={handleBombRelease}
            >
              <Bomb className="w-8 h-8 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
