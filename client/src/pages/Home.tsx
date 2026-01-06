import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getLoginUrl } from '@/const';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Users, 
  Trophy, 
  Settings, 
  Info, 
  Gamepad2,
  Flame,
  Zap,
  Shield,
  Sword,
  Crown,
  Star
} from 'lucide-react';

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showMenu, setShowMenu] = useState(true);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // Animated background particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  }));

  const menuItems = [
    { 
      id: 'single', 
      label: 'Single Player', 
      icon: Play, 
      color: 'from-green-500 to-emerald-600',
      description: 'Start your adventure through 25 epic levels',
      path: '/play/single'
    },
    { 
      id: 'multi', 
      label: 'Multiplayer', 
      icon: Users, 
      color: 'from-blue-500 to-cyan-600',
      description: 'Team up with friends in online co-op',
      path: '/play/multiplayer'
    },
    { 
      id: 'infinite', 
      label: 'Infinite Mode', 
      icon: Flame, 
      color: 'from-orange-500 to-red-600',
      description: 'Endless procedural challenges',
      path: '/play/infinite'
    },
    { 
      id: 'leaderboard', 
      label: 'Leaderboards', 
      icon: Trophy, 
      color: 'from-yellow-500 to-amber-600',
      description: 'Compete for the top spot',
      path: '/leaderboard'
    },
  ];

  const features = [
    { icon: Sword, label: '25+ Levels', color: 'text-red-400' },
    { icon: Shield, label: '8 Enemy Types', color: 'text-blue-400' },
    { icon: Crown, label: '5 Epic Bosses', color: 'text-yellow-400' },
    { icon: Zap, label: '6 Power-ups', color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Floating particles */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Gradient orbs */}
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-purple-500/20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Super Bomberman</h1>
              <p className="text-xs text-gray-400">Episode 6</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            {isAuthenticated ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-white font-medium">{user?.name || 'Player'}</span>
              </div>
            ) : (
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => window.location.href = getLoginUrl()}
              >
                Sign In
              </Button>
            )}
          </motion.div>
        </header>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 mb-4 drop-shadow-2xl">
            SUPER BOMBERMAN
          </h1>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="inline-block"
          >
            <span className="text-4xl md:text-6xl font-black text-white/90 tracking-wider">
              6
            </span>
          </motion.div>
          <p className="text-gray-400 mt-4 text-lg max-w-2xl mx-auto">
            The ultimate explosive adventure awaits. Battle through 5 worlds, 
            defeat epic bosses, and save the kingdom!
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-8 mb-12 flex-wrap"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2"
            >
              <feature.icon className={`w-5 h-5 ${feature.color}`} />
              <span className="text-white font-medium">{feature.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Menu Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onMouseEnter={() => setHoveredButton(item.id)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                <Card
                  className={`
                    relative overflow-hidden cursor-pointer transition-all duration-300
                    bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/30
                    ${hoveredButton === item.id ? 'scale-105 shadow-2xl' : ''}
                  `}
                  onClick={() => setLocation(item.path)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color}
                        flex items-center justify-center shadow-lg
                        ${hoveredButton === item.id ? 'shadow-xl' : ''}
                      `}>
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">
                          {item.label}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {item.description}
                        </p>
                      </div>
                      <motion.div
                        animate={{ x: hoveredButton === item.id ? 5 : 0 }}
                        className="text-white/50"
                      >
                        →
                      </motion.div>
                    </div>
                  </CardContent>

                  {/* Hover gradient overlay */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0`}
                    animate={{ opacity: hoveredButton === item.id ? 0.1 : 0 }}
                  />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center py-8"
        >
          <div className="flex justify-center gap-6 mb-4">
            <button 
              onClick={() => setLocation('/settings')}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button 
              onClick={() => setLocation('/about')}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              About
            </button>
            <button 
              onClick={() => setLocation('/replays')}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              Replays
            </button>
          </div>
          <p className="text-gray-500 text-sm">
            © 2025 Super Bomberman 6 • Made with 💣 and ❤️
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
