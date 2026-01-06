import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Trophy, 
  Medal, 
  Crown, 
  Flame,
  Users,
  Clock,
  Target,
  Star
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  level: number;
  time: string;
  date: string;
  isCurrentUser?: boolean;
}

export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('campaign');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  // Simulated leaderboard data
  const campaignLeaderboard: LeaderboardEntry[] = [
    { rank: 1, playerName: 'BomberKing', score: 1250000, level: 25, time: '2:45:30', date: '2025-01-04' },
    { rank: 2, playerName: 'ExplosiveMaster', score: 1180000, level: 25, time: '2:52:15', date: '2025-01-03' },
    { rank: 3, playerName: 'BlastPro', score: 1120000, level: 25, time: '3:01:45', date: '2025-01-02' },
    { rank: 4, playerName: 'FireStarter', score: 980000, level: 23, time: '2:30:00', date: '2025-01-04' },
    { rank: 5, playerName: 'DynamiteQueen', score: 920000, level: 22, time: '2:15:30', date: '2025-01-03' },
    { rank: 6, playerName: 'TNTLover', score: 850000, level: 21, time: '2:10:00', date: '2025-01-02' },
    { rank: 7, playerName: 'BoomBoom', score: 780000, level: 20, time: '1:58:45', date: '2025-01-01' },
    { rank: 8, playerName: user?.name || 'You', score: 450000, level: 15, time: '1:20:00', date: '2025-01-04', isCurrentUser: true },
    { rank: 9, playerName: 'NewPlayer123', score: 320000, level: 12, time: '0:55:30', date: '2025-01-03' },
    { rank: 10, playerName: 'Beginner', score: 180000, level: 8, time: '0:35:00', date: '2025-01-02' },
  ];

  const infiniteLeaderboard: LeaderboardEntry[] = [
    { rank: 1, playerName: 'SurvivalGod', score: 5250000, level: 85, time: '1:25:30', date: '2025-01-04' },
    { rank: 2, playerName: 'EndlessRunner', score: 4800000, level: 78, time: '1:18:15', date: '2025-01-03' },
    { rank: 3, playerName: 'WaveDestroyer', score: 4200000, level: 72, time: '1:10:45', date: '2025-01-02' },
    { rank: 4, playerName: 'InfiniteBlast', score: 3800000, level: 65, time: '1:02:00', date: '2025-01-04' },
    { rank: 5, playerName: 'NeverDie', score: 3500000, level: 60, time: '0:58:30', date: '2025-01-03' },
    { rank: 6, playerName: user?.name || 'You', score: 1200000, level: 32, time: '0:28:00', date: '2025-01-04', isCurrentUser: true },
  ];

  const coopLeaderboard: LeaderboardEntry[] = [
    { rank: 1, playerName: 'TeamAlpha', score: 2850000, level: 25, time: '1:45:30', date: '2025-01-04' },
    { rank: 2, playerName: 'BombSquad', score: 2650000, level: 25, time: '1:52:15', date: '2025-01-03' },
    { rank: 3, playerName: 'ExplosiveDuo', score: 2400000, level: 24, time: '1:40:45', date: '2025-01-02' },
    { rank: 4, playerName: 'BlastBros', score: 2100000, level: 22, time: '1:30:00', date: '2025-01-04' },
    { rank: 5, playerName: 'DynamiteTeam', score: 1900000, level: 20, time: '1:25:30', date: '2025-01-03' },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getRankBg = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-blue-500/20 border-blue-500/50';
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 border-yellow-500/50';
      case 2:
        return 'bg-gray-400/20 border-gray-400/50';
      case 3:
        return 'bg-amber-600/20 border-amber-600/50';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  const renderLeaderboard = (data: LeaderboardEntry[]) => (
    <div className="space-y-3">
      {data.map((entry, index) => (
        <motion.div
          key={entry.rank}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className={`border-2 ${getRankBg(entry.rank, entry.isCurrentUser || false)}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-12 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Player Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${entry.isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                      {entry.playerName}
                    </span>
                    {entry.isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Level {entry.level}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {entry.time}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-xl font-bold text-yellow-400">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">{entry.date}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

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
        <h1 className="text-2xl font-bold text-white">Leaderboards</h1>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 mb-4 shadow-2xl shadow-yellow-500/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Global Rankings</h2>
            <p className="text-gray-400">Compete with players worldwide</p>
          </motion.div>

          {/* Time Filter */}
          <div className="flex justify-center gap-2 mb-6">
            {(['all', 'month', 'week'] as const).map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? 'default' : 'outline'}
                className={timeFilter === filter ? '' : 'border-white/20 text-white'}
                onClick={() => setTimeFilter(filter)}
              >
                {filter === 'all' ? 'All Time' : filter === 'month' ? 'This Month' : 'This Week'}
              </Button>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-white/10 mb-6">
              <TabsTrigger value="campaign" className="flex-1 data-[state=active]:bg-white/20">
                <Star className="w-4 h-4 mr-2" />
                Campaign
              </TabsTrigger>
              <TabsTrigger value="infinite" className="flex-1 data-[state=active]:bg-white/20">
                <Flame className="w-4 h-4 mr-2" />
                Infinite
              </TabsTrigger>
              <TabsTrigger value="coop" className="flex-1 data-[state=active]:bg-white/20">
                <Users className="w-4 h-4 mr-2" />
                Co-op
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaign">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Campaign High Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderLeaderboard(campaignLeaderboard)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="infinite">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Infinite Mode Survivors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderLeaderboard(infiniteLeaderboard)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coop">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Co-op Team Rankings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderLeaderboard(coopLeaderboard)}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Your Stats */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Your Best Performances</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">450,000</div>
                      <div className="text-sm text-gray-400">Campaign Best</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-400">1,200,000</div>
                      <div className="text-sm text-gray-400">Infinite Best</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">#8</div>
                      <div className="text-sm text-gray-400">Global Rank</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
