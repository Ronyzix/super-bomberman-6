import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Flame, Trophy, Zap, Skull, Target } from 'lucide-react';
import { GameComponent } from '@/game/GameComponent';

interface InfiniteStats {
  highScore: number;
  highestWave: number;
  totalKills: number;
  totalPlayTime: number;
}

export default function InfiniteMode() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWave, setCurrentWave] = useState(1);
  const [currentScore, setCurrentScore] = useState(0);
  const [stats, setStats] = useState<InfiniteStats>({
    highScore: 0,
    highestWave: 0,
    totalKills: 0,
    totalPlayTime: 0,
  });
  const [difficulty, setDifficulty] = useState<'normal' | 'hard' | 'insane'>('normal');

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bomberman_infinite_stats');
    if (saved) {
      setStats(JSON.parse(saved));
    }
  }, []);

  const saveStats = (newStats: InfiniteStats) => {
    localStorage.setItem('bomberman_infinite_stats', JSON.stringify(newStats));
    setStats(newStats);
  };

  const handleGameOver = (score: number) => {
    const newStats = {
      ...stats,
      highScore: Math.max(stats.highScore, score),
      highestWave: Math.max(stats.highestWave, currentWave),
    };
    saveStats(newStats);
    setIsPlaying(false);
  };

  const startGame = () => {
    setCurrentWave(1);
    setCurrentScore(0);
    setIsPlaying(true);
  };

  const difficultySettings = {
    normal: { label: 'Normal', color: 'from-green-500 to-emerald-600', multiplier: 1 },
    hard: { label: 'Hard', color: 'from-orange-500 to-red-600', multiplier: 1.5 },
    insane: { label: 'Insane', color: 'from-red-600 to-purple-600', multiplier: 2 },
  };

  if (isPlaying) {
    return (
      <div className="w-screen h-screen">
        <GameComponent
          levelId={-1} // Special ID for infinite mode
          isMultiplayer={false}
          onGameOver={handleGameOver}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-white">Infinite Mode</h1>
      </header>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-600 mb-6 shadow-2xl shadow-orange-500/30">
              <Flame className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">
              ENDLESS CHALLENGE
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Face endless waves of enemies in procedurally generated maps. 
              How long can you survive?
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold">{stats.highScore.toLocaleString()}</div>
                <div className="text-xs text-gray-400">High Score</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{stats.highestWave}</div>
                <div className="text-xs text-gray-400">Highest Wave</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4 text-center">
                <Skull className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold">{stats.totalKills}</div>
                <div className="text-xs text-gray-400">Total Kills</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{Math.floor(stats.totalPlayTime / 60)}m</div>
                <div className="text-xs text-gray-400">Play Time</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Difficulty Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="text-xl font-bold text-white text-center mb-4">Select Difficulty</h3>
            <div className="flex justify-center gap-4">
              {(Object.keys(difficultySettings) as Array<keyof typeof difficultySettings>).map((key) => {
                const setting = difficultySettings[key];
                const isSelected = difficulty === key;
                
                return (
                  <button
                    key={key}
                    onClick={() => setDifficulty(key)}
                    className={`
                      px-6 py-3 rounded-xl font-bold transition-all
                      ${isSelected 
                        ? `bg-gradient-to-r ${setting.color} text-white scale-110 shadow-lg` 
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }
                    `}
                  >
                    {setting.label}
                    <div className="text-xs opacity-70">x{setting.multiplier}</div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 text-center">Mode Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl mb-2">🎲</div>
                    <div className="font-bold">Procedural Maps</div>
                    <div className="text-sm text-gray-400">Unique layouts every game</div>
                  </div>
                  <div>
                    <div className="text-3xl mb-2">📈</div>
                    <div className="font-bold">Progressive Waves</div>
                    <div className="text-sm text-gray-400">Increasing difficulty</div>
                  </div>
                  <div>
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="font-bold">Global Rankings</div>
                    <div className="text-sm text-gray-400">Compete worldwide</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <Button
              size="lg"
              className={`
                px-12 py-6 text-xl font-bold rounded-2xl
                bg-gradient-to-r ${difficultySettings[difficulty].color}
                hover:scale-105 transition-transform shadow-2xl
              `}
              onClick={startGame}
            >
              <Play className="w-8 h-8 mr-3" />
              START SURVIVAL
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
