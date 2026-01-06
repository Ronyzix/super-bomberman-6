import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Lock, Star, Trophy, Clock } from 'lucide-react';
import { GameComponent } from '@/game/GameComponent';
import { ALL_LEVELS, getWorldInfo, getLevelsByWorld } from '@/game/levels/LevelData';
import { WORLDS } from '@/game/constants';

export default function SinglePlayer() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedWorld, setSelectedWorld] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]); // Start with level 1 unlocked
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bomberman_progress');
    if (saved) {
      const progress = JSON.parse(saved);
      setUnlockedLevels(progress.unlockedLevels || [1]);
    }
  }, []);

  // Save progress
  const saveProgress = (newUnlocked: number[]) => {
    localStorage.setItem('bomberman_progress', JSON.stringify({
      unlockedLevels: newUnlocked,
    }));
    setUnlockedLevels(newUnlocked);
  };

  const handleLevelComplete = (levelId: number, score: number) => {
    const nextLevel = levelId + 1;
    if (!unlockedLevels.includes(nextLevel) && nextLevel <= ALL_LEVELS.length) {
      saveProgress([...unlockedLevels, nextLevel]);
    }
    setIsPlaying(false);
    setSelectedLevel(null);
  };

  const handleGameOver = (score: number) => {
    setIsPlaying(false);
  };

  const startLevel = (levelId: number) => {
    setSelectedLevel(levelId);
    setIsPlaying(true);
  };

  const worldThemes: Record<string, { bg: string; accent: string; gradient: string }> = {
    grass: { bg: 'from-green-800', accent: 'to-emerald-600', gradient: 'from-green-500 to-emerald-600' },
    lava: { bg: 'from-red-900', accent: 'to-orange-600', gradient: 'from-red-500 to-orange-600' },
    ice: { bg: 'from-blue-900', accent: 'to-cyan-600', gradient: 'from-blue-500 to-cyan-600' },
    forest: { bg: 'from-gray-900', accent: 'to-green-800', gradient: 'from-gray-600 to-green-700' },
    castle: { bg: 'from-purple-900', accent: 'to-gray-800', gradient: 'from-purple-600 to-gray-700' },
  };

  if (isPlaying && selectedLevel) {
    return (
      <div className="w-screen h-screen">
        <GameComponent
          levelId={selectedLevel}
          isMultiplayer={false}
          onGameOver={handleGameOver}
          onLevelComplete={handleLevelComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-white">Single Player</h1>
      </header>

      {/* World Selection */}
      <div className="container mx-auto px-4 py-8">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-white text-center mb-8"
        >
          Select World
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {WORLDS.map((world, index) => {
            const worldLevels = getLevelsByWorld(world.id);
            const firstLevelId = worldLevels[0]?.id || 1;
            const isUnlocked = unlockedLevels.includes(firstLevelId);
            const theme = worldThemes[world.theme] || worldThemes.grass;
            const completedLevels = worldLevels.filter(l => unlockedLevels.includes(l.id + 1) || l.id === ALL_LEVELS.length).length;

            return (
              <motion.div
                key={world.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`
                    relative overflow-hidden cursor-pointer transition-all duration-300
                    ${isUnlocked 
                      ? 'bg-white/10 hover:bg-white/20 border-white/20 hover:border-white/40' 
                      : 'bg-gray-800/50 border-gray-700/50 cursor-not-allowed'
                    }
                  `}
                  onClick={() => isUnlocked && setSelectedWorld(world.id)}
                >
                  <CardContent className="p-6">
                    {/* World Banner */}
                    <div className={`
                      h-32 rounded-xl mb-4 bg-gradient-to-br ${theme.bg} ${theme.accent}
                      flex items-center justify-center relative overflow-hidden
                    `}>
                      {!isUnlocked && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Lock className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <span className="text-6xl font-black text-white/30">
                        {world.id}
                      </span>
                    </div>

                    {/* World Info */}
                    <h3 className="text-xl font-bold text-white mb-2">
                      {world.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Boss: {world.boss}
                    </p>

                    {/* Progress */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Star className="w-4 h-4" />
                        <span className="text-sm">
                          {completedLevels}/{world.levels + 1} Levels
                        </span>
                      </div>
                      {isUnlocked && (
                        <Button
                          size="sm"
                          className={`bg-gradient-to-r ${theme.gradient}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWorld(world.id);
                            setShowLevelSelect(true);
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Play
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Level Select Dialog */}
      <Dialog open={showLevelSelect} onOpenChange={setShowLevelSelect}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedWorld && getWorldInfo(selectedWorld)?.name} - Select Level
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 mt-4">
            {selectedWorld && getLevelsByWorld(selectedWorld).map((level, index) => {
              const isUnlocked = unlockedLevels.includes(level.id);
              const isBoss = level.boss !== undefined;

              return (
                <motion.button
                  key={level.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    relative p-4 rounded-xl transition-all
                    ${isUnlocked
                      ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                      : 'bg-gray-800/50 cursor-not-allowed'
                    }
                    ${isBoss ? 'col-span-3 border-2 border-yellow-500/50' : ''}
                  `}
                  onClick={() => isUnlocked && startLevel(level.id)}
                  disabled={!isUnlocked}
                >
                  {!isUnlocked && (
                    <Lock className="absolute top-2 right-2 w-4 h-4 text-gray-500" />
                  )}
                  
                  <div className="text-center">
                    {isBoss ? (
                      <>
                        <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                        <span className="text-lg font-bold text-yellow-400">
                          BOSS
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-white/80">
                          {index + 1}
                        </span>
                      </>
                    )}
                    <p className="text-sm text-gray-400 mt-1">
                      {level.name}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
