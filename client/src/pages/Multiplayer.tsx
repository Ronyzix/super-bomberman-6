import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  Play, 
  Copy, 
  Check, 
  Crown,
  RefreshCw,
  MessageSquare,
  Send
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { GameComponent } from '@/game/GameComponent';

interface Room {
  id: string;
  name: string;
  hostName: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'playing';
}

interface ChatMessage {
  id: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

export default function Multiplayer() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [players, setPlayers] = useState<{ id: string; name: string; isReady: boolean; isHost: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated rooms for demo
  useEffect(() => {
    // In production, this would be fetched from the server
    setRooms([
      { id: '1', name: 'Casual Game', hostName: 'Player1', players: 2, maxPlayers: 4, status: 'waiting' },
      { id: '2', name: 'Pro Match', hostName: 'BomberKing', players: 3, maxPlayers: 4, status: 'waiting' },
      { id: '3', name: 'Beginners Welcome', hostName: 'NewPlayer', players: 1, maxPlayers: 4, status: 'waiting' },
    ]);
  }, []);

  const createRoom = () => {
    if (!newRoomName.trim()) return;
    
    const newRoom: Room = {
      id: Date.now().toString(),
      name: newRoomName,
      hostName: user?.name || 'Guest',
      players: 1,
      maxPlayers: 4,
      status: 'waiting',
    };
    
    setRooms([newRoom, ...rooms]);
    setCurrentRoom(newRoom);
    setPlayers([{ id: user?.openId || '1', name: user?.name || 'Guest', isReady: false, isHost: true }]);
    setShowCreateRoom(false);
    setNewRoomName('');
  };

  const joinRoom = (room: Room) => {
    if (room.players >= room.maxPlayers || room.status === 'playing') return;
    
    setCurrentRoom(room);
    setPlayers([
      { id: '1', name: room.hostName, isReady: true, isHost: true },
      { id: user?.openId || '2', name: user?.name || 'Guest', isReady: false, isHost: false },
    ]);
  };

  const leaveRoom = () => {
    setCurrentRoom(null);
    setPlayers([]);
    setIsReady(false);
    setChatMessages([]);
  };

  const toggleReady = () => {
    setIsReady(!isReady);
    setPlayers(players.map(p => 
      p.id === (user?.openId || '2') ? { ...p, isReady: !isReady } : p
    ));
  };

  const startGame = () => {
    if (players.every(p => p.isReady || p.isHost)) {
      setIsPlaying(true);
    }
  };

  const copyRoomCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      playerName: user?.name || 'Guest',
      message: newMessage,
      timestamp: new Date(),
    };
    
    setChatMessages([...chatMessages, message]);
    setNewMessage('');
  };

  const refreshRooms = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <Card className="bg-white/10 border-white/20 text-white max-w-md">
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
            <p className="text-gray-400 mb-6">
              Please sign in to play multiplayer mode
            </p>
            <Button
              className="bg-gradient-to-r from-blue-500 to-cyan-600"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPlaying && currentRoom) {
    return (
      <div className="w-screen h-screen">
        <GameComponent
          levelId={1}
          isMultiplayer={true}
          roomId={currentRoom.id}
          onGameOver={() => setIsPlaying(false)}
          onLevelComplete={() => setIsPlaying(false)}
        />
      </div>
    );
  }

  // Room Lobby View
  if (currentRoom) {
    const isHost = players.find(p => p.isHost)?.id === (user?.openId || '2');
    const allReady = players.every(p => p.isReady || p.isHost);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <header className="p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={leaveRoom}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Leave Room
          </Button>
        </header>

        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Room Info & Players */}
            <div className="lg:col-span-2 space-y-6">
              {/* Room Header */}
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold">{currentRoom.name}</h2>
                      <p className="text-gray-400">Room Code: {currentRoom.id}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-white/20"
                      onClick={copyRoomCode}
                    >
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? 'Copied!' : 'Copy Code'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Players List */}
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Players ({players.length}/4)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {players.map((player, index) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                          p-4 rounded-xl border-2 transition-all
                          ${player.isReady || player.isHost
                            ? 'bg-green-500/20 border-green-500/50'
                            : 'bg-white/5 border-white/10'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                            ${['bg-orange-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500'][index]}
                          `}>
                            P{index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{player.name}</span>
                              {player.isHost && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <Badge variant={player.isReady || player.isHost ? 'default' : 'secondary'}>
                              {player.isHost ? 'Host' : player.isReady ? 'Ready' : 'Not Ready'}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Empty slots */}
                    {Array.from({ length: 4 - players.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="p-4 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-gray-500"
                      >
                        Waiting for player...
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 mt-6">
                    {isHost ? (
                      <Button
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                        disabled={!allReady || players.length < 2}
                        onClick={startGame}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Game
                      </Button>
                    ) : (
                      <Button
                        className={`flex-1 ${isReady 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-600'
                        }`}
                        onClick={toggleReady}
                      >
                        {isReady ? 'Cancel Ready' : 'Ready'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat */}
            <Card className="bg-white/10 border-white/20 text-white h-[500px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {chatMessages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No messages yet</p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="bg-white/5 rounded-lg p-2">
                        <span className="font-bold text-blue-400">{msg.playerName}: </span>
                        <span className="text-gray-300">{msg.message}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-white/10 border-white/20 text-white"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Room List View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <header className="p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-white">Multiplayer</h1>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
          <div className="flex gap-4">
            <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Room Name"
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                    onClick={createRoom}
                  >
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="border-white/20 text-white"
              onClick={refreshRooms}
              disabled={isLoading}
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="text-gray-400">
            {rooms.length} rooms available
          </div>
        </div>

        {/* Room List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {rooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{room.name}</h3>
                        <p className="text-gray-400 text-sm">Host: {room.hostName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {room.players}/{room.maxPlayers}
                        </div>
                        <div className="text-xs text-gray-400">Players</div>
                      </div>

                      <Badge variant={room.status === 'waiting' ? 'default' : 'secondary'}>
                        {room.status === 'waiting' ? 'Waiting' : 'In Game'}
                      </Badge>

                      <Button
                        className="bg-gradient-to-r from-blue-500 to-cyan-600"
                        disabled={room.players >= room.maxPlayers || room.status === 'playing'}
                        onClick={() => joinRoom(room)}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {rooms.length === 0 && (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No Rooms Available</h3>
              <p className="text-gray-500 mb-4">Create a room to start playing!</p>
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-600"
                onClick={() => setShowCreateRoom(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Room
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
