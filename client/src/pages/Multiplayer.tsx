import { useState, useEffect, useRef, useCallback } from 'react';
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
  Send,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { GameComponent } from '@/game/GameComponent';
import { io, Socket } from 'socket.io-client';

interface Room {
  id: string;
  name: string;
  hostId: string;
  playerCount: number;
  maxPlayers: number;
  gameMode: 'coop' | 'versus';
  levelId: number;
}

interface RoomPlayer {
  id: string;
  name: string;
  slot: number;
  isReady: boolean;
  isAlive: boolean;
}

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export default function Multiplayer() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Socket state
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Room state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<{
    id: string;
    name: string;
    hostId: string;
    gameMode: 'coop' | 'versus';
    levelId: number;
    maxPlayers: number;
  } | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // UI state
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'coop' | 'versus'>('coop');
  const [maxPlayers, setMaxPlayers] = useState(4);

  // Connect to WebSocket server
  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;
    
    setIsConnecting(true);
    setError(null);
    
    const socket = io({
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socket.on('connect', () => {
      console.log('[Multiplayer] Connected to server');
      setIsConnected(true);
      setIsConnecting(false);
      // Fetch available rooms
      fetchRooms();
    });
    
    socket.on('disconnect', () => {
      console.log('[Multiplayer] Disconnected from server');
      setIsConnected(false);
    });
    
    socket.on('connect_error', (err) => {
      console.error('[Multiplayer] Connection error:', err);
      setIsConnecting(false);
      setError('Failed to connect to server. Please try again.');
    });
    
    // Room events
    socket.on('room_created', (data: { roomId: string; room: any }) => {
      console.log('[Multiplayer] Room created:', data);
      setCurrentRoom({
        id: data.roomId,
        name: data.room.name,
        hostId: data.room.hostId,
        gameMode: data.room.gameMode,
        levelId: data.room.levelId,
        maxPlayers: data.room.maxPlayers,
      });
      setPlayers(data.room.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        slot: p.slot,
        isReady: p.isReady,
        isAlive: p.isAlive,
      })));
      setShowCreateRoom(false);
      setIsReady(true); // Host is always ready
    });
    
    socket.on('room_joined', (data: { room: any; playerId: string }) => {
      console.log('[Multiplayer] Joined room:', data);
      setCurrentRoom({
        id: data.room.id,
        name: data.room.name,
        hostId: data.room.hostId,
        gameMode: data.room.gameMode,
        levelId: data.room.levelId,
        maxPlayers: data.room.maxPlayers,
      });
      setPlayers(data.room.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        slot: p.slot,
        isReady: p.isReady,
        isAlive: p.isAlive,
      })));
      setShowJoinRoom(false);
    });
    
    socket.on('player_joined', (data: { player: any }) => {
      console.log('[Multiplayer] Player joined:', data);
      setPlayers(prev => [...prev, {
        id: data.player.id,
        name: data.player.name,
        slot: data.player.slot,
        isReady: data.player.isReady,
        isAlive: data.player.isAlive,
      }]);
    });
    
    socket.on('player_left', (data: { playerId: string; playerName: string }) => {
      console.log('[Multiplayer] Player left:', data);
      setPlayers(prev => prev.filter(p => p.id !== data.playerId));
    });
    
    socket.on('player_ready', (data: { playerId: string; isReady: boolean }) => {
      setPlayers(prev => prev.map(p => 
        p.id === data.playerId ? { ...p, isReady: data.isReady } : p
      ));
    });
    
    socket.on('host_changed', (data: { newHostId: string }) => {
      setCurrentRoom(prev => prev ? { ...prev, hostId: data.newHostId } : null);
    });
    
    socket.on('game_started', (data: { grid: number[][]; players: any[]; startTime: number }) => {
      console.log('[Multiplayer] Game started!', data);
      setIsPlaying(true);
    });
    
    socket.on('chat_message', (data: ChatMessage) => {
      setChatMessages(prev => [...prev, data]);
    });
    
    socket.on('error', (data: { message: string }) => {
      console.error('[Multiplayer] Error:', data.message);
      setError(data.message);
    });
    
    socketRef.current = socket;
  }, []);

  // Fetch available rooms
  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/multiplayer/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error('[Multiplayer] Failed to fetch rooms:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize socket on mount
  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, connectSocket]);

  // Create room
  const createRoom = () => {
    if (!newRoomName.trim() || !socketRef.current) return;
    
    socketRef.current.emit('create_room', {
      name: newRoomName,
      hostName: user?.name || 'Guest',
      hostUserId: user?.id || 0,
      maxPlayers,
      gameMode,
      levelId: 1,
    });
  };

  // Join room by ID
  const joinRoom = (roomId: string) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('join_room', {
      roomId,
      playerName: user?.name || 'Guest',
      userId: user?.id || 0,
    });
  };

  // Join room by code
  const joinRoomByCode = () => {
    if (!joinRoomCode.trim()) return;
    joinRoom(joinRoomCode.trim());
  };

  // Leave room
  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room');
    }
    setCurrentRoom(null);
    setPlayers([]);
    setIsReady(false);
    setChatMessages([]);
  };

  // Toggle ready status
  const toggleReady = () => {
    if (!socketRef.current) return;
    
    const newReady = !isReady;
    setIsReady(newReady);
    socketRef.current.emit('set_ready', { isReady: newReady });
  };

  // Start game (host only)
  const startGame = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('start_game');
  };

  // Copy room code
  const copyRoomCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    
    socketRef.current.emit('chat', { message: newMessage });
    setNewMessage('');
  };

  // Not authenticated
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

  // Playing game
  if (isPlaying && currentRoom) {
    return (
      <div className="w-screen h-screen">
        <GameComponent
          levelId={currentRoom.levelId}
          isMultiplayer={true}
          roomId={currentRoom.id}
          onGameOver={() => setIsPlaying(false)}
          onLevelComplete={() => setIsPlaying(false)}
        />
      </div>
    );
  }

  // In room lobby
  if (currentRoom) {
    const isHost = currentRoom.hostId === socketRef.current?.id;
    const allReady = players.every(p => p.isReady || p.id === currentRoom.hostId);
    const canStart = players.length >= 2 && allReady;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <header className="p-4 flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={leaveRoom}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Leave Room
          </Button>
          
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="text-green-400 border-green-400">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-400 border-red-400">
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
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
                      <p className="text-gray-400">
                        Room Code: <span className="font-mono text-yellow-400">{currentRoom.id}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Mode: {currentRoom.gameMode === 'coop' ? 'Co-op' : 'Versus'} | Level {currentRoom.levelId}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
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
                    Players ({players.length}/{currentRoom.maxPlayers})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {players.map((player, index) => {
                      const playerIsHost = player.id === currentRoom.hostId;
                      return (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`
                            p-4 rounded-xl border-2 transition-all
                            ${player.isReady || playerIsHost
                              ? 'bg-green-500/20 border-green-500/50'
                              : 'bg-white/5 border-white/10'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`
                              w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                              ${['bg-orange-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500'][player.slot]}
                            `}>
                              P{player.slot + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{player.name}</span>
                                {playerIsHost && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                              <Badge variant={player.isReady || playerIsHost ? 'default' : 'secondary'}>
                                {playerIsHost ? 'Host' : player.isReady ? 'Ready' : 'Not Ready'}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Empty slots */}
                    {Array.from({ length: currentRoom.maxPlayers - players.length }).map((_, i) => (
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
                        disabled={!canStart}
                        onClick={startGame}
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Game {!canStart && `(Need ${2 - players.length} more)`}
                      </Button>
                    ) : (
                      <Button
                        className={`flex-1 ${isReady 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-600'
                        }`}
                        onClick={toggleReady}
                      >
                        {isReady ? 'Cancel Ready' : 'Ready!'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat */}
            <div className="space-y-6">
              <Card className="bg-white/10 border-white/20 text-white h-[500px] flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="w-5 h-5" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4 p-2 bg-black/20 rounded-lg">
                    {chatMessages.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No messages yet</p>
                    ) : (
                      chatMessages.map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <span className="font-bold text-blue-400">{msg.playerName}: </span>
                          <span className="text-gray-300">{msg.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-white/10 border-white/20 text-white"
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Room browser
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-2">
          {isConnecting ? (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Connecting...
            </Badge>
          ) : isConnected ? (
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Wifi className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-400 border-red-400">
              <WifiOff className="w-3 h-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Multiplayer</h1>
            <p className="text-gray-400">Play with friends online!</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6"
            >
              {error}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={() => setError(null)}
              >
                Dismiss
              </Button>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mb-8">
            {/* Create Room */}
            <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 h-16 text-lg">
                  <Plus className="w-6 h-6 mr-2" />
                  Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Room Name</label>
                    <Input
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="My Awesome Room"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Game Mode</label>
                    <div className="flex gap-2 mt-1">
                      <Button
                        variant={gameMode === 'coop' ? 'default' : 'outline'}
                        className={gameMode === 'coop' ? '' : 'border-white/20 text-white'}
                        onClick={() => setGameMode('coop')}
                      >
                        Co-op
                      </Button>
                      <Button
                        variant={gameMode === 'versus' ? 'default' : 'outline'}
                        className={gameMode === 'versus' ? '' : 'border-white/20 text-white'}
                        onClick={() => setGameMode('versus')}
                      >
                        Versus
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Max Players</label>
                    <div className="flex gap-2 mt-1">
                      {[2, 3, 4].map(num => (
                        <Button
                          key={num}
                          variant={maxPlayers === num ? 'default' : 'outline'}
                          className={maxPlayers === num ? '' : 'border-white/20 text-white'}
                          onClick={() => setMaxPlayers(num)}
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                    onClick={createRoom}
                    disabled={!newRoomName.trim() || !isConnected}
                  >
                    Create Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Join by Code */}
            <Dialog open={showJoinRoom} onOpenChange={setShowJoinRoom}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 h-16 text-lg">
                  <Users className="w-6 h-6 mr-2" />
                  Join by Code
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-white/20 text-white">
                <DialogHeader>
                  <DialogTitle>Join Room</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400">Room Code</label>
                    <Input
                      value={joinRoomCode}
                      onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                      placeholder="Enter room code"
                      className="bg-white/10 border-white/20 text-white font-mono text-lg tracking-wider"
                    />
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600"
                    onClick={joinRoomByCode}
                    disabled={!joinRoomCode.trim() || !isConnected}
                  >
                    Join Room
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Available Rooms */}
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Available Rooms
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchRooms}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              {rooms.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No rooms available</p>
                  <p className="text-sm">Create a room or join by code</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <h3 className="font-bold">{room.name}</h3>
                        <p className="text-sm text-gray-400">
                          {room.gameMode === 'coop' ? 'Co-op' : 'Versus'} | Level {room.levelId}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="border-white/20">
                          {room.playerCount}/{room.maxPlayers}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => joinRoom(room.id)}
                          disabled={room.playerCount >= room.maxPlayers || !isConnected}
                        >
                          Join
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
