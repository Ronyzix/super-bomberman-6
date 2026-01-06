// Multiplayer WebSocket Server
import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { nanoid } from 'nanoid';

interface Player {
  id: string;
  oderId: number;
  name: string;
  slot: number;
  x: number;
  y: number;
  direction: number;
  isAlive: boolean;
  bombs: number;
  maxBombs: number;
  fireRange: number;
  speed: number;
  isReady: boolean;
}

interface Bomb {
  id: string;
  playerId: string;
  x: number;
  y: number;
  range: number;
  timer: number;
  type: 'normal' | 'pierce' | 'remote' | 'line';
}

interface GameRoom {
  id: string;
  name: string;
  hostId: string;
  players: Map<string, Player>;
  bombs: Map<string, Bomb>;
  gameState: 'waiting' | 'playing' | 'finished';
  levelId: number;
  gameMode: 'coop' | 'versus';
  maxPlayers: number;
  grid: number[][];
  enemies: any[];
  powerUps: any[];
  startTime?: number;
  lastUpdate: number;
}

const rooms: Map<string, GameRoom> = new Map();
const playerRooms: Map<string, string> = new Map(); // socketId -> roomId

export function initMultiplayer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    path: '/api/socket.io',
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Multiplayer] Player connected: ${socket.id}`);

    // Create a new room
    socket.on('create_room', (data: { name: string; hostName: string; hostUserId: number; maxPlayers: number; gameMode: 'coop' | 'versus'; levelId: number }) => {
      const roomId = nanoid(8);
      
      const room: GameRoom = {
        id: roomId,
        name: data.name,
        hostId: socket.id,
        players: new Map(),
        bombs: new Map(),
        gameState: 'waiting',
        levelId: data.levelId || 1,
        gameMode: data.gameMode || 'coop',
        maxPlayers: data.maxPlayers || 4,
        grid: [],
        enemies: [],
        powerUps: [],
        lastUpdate: Date.now(),
      };

      const player: Player = {
        id: socket.id,
        oderId: data.hostUserId,
        name: data.hostName,
        slot: 0,
        x: 1,
        y: 1,
        direction: 0,
        isAlive: true,
        bombs: 1,
        maxBombs: 1,
        fireRange: 1,
        speed: 1,
        isReady: true,
      };

      room.players.set(socket.id, player);
      rooms.set(roomId, room);
      playerRooms.set(socket.id, roomId);

      socket.join(roomId);
      socket.emit('room_created', { roomId, room: serializeRoom(room) });
      
      console.log(`[Multiplayer] Room created: ${roomId} by ${data.hostName}`);
    });

    // Join an existing room
    socket.on('join_room', (data: { roomId: string; playerName: string; userId: number }) => {
      const room = rooms.get(data.roomId);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.gameState !== 'waiting') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }

      if (room.players.size >= room.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      // Find available slot
      const usedSlots = Array.from(room.players.values()).map(p => p.slot);
      const availableSlot = [0, 1, 2, 3].find(s => !usedSlots.includes(s)) || 0;

      // Spawn positions for each slot
      const spawnPositions = [
        { x: 1, y: 1 },
        { x: 13, y: 1 },
        { x: 1, y: 11 },
        { x: 13, y: 11 },
      ];

      const spawn = spawnPositions[availableSlot];

      const player: Player = {
        id: socket.id,
        oderId: data.userId,
        name: data.playerName,
        slot: availableSlot,
        x: spawn.x,
        y: spawn.y,
        direction: 0,
        isAlive: true,
        bombs: 1,
        maxBombs: 1,
        fireRange: 1,
        speed: 1,
        isReady: false,
      };

      room.players.set(socket.id, player);
      playerRooms.set(socket.id, data.roomId);

      socket.join(data.roomId);
      socket.emit('room_joined', { room: serializeRoom(room), playerId: socket.id });
      socket.to(data.roomId).emit('player_joined', { player });
      
      console.log(`[Multiplayer] ${data.playerName} joined room ${data.roomId}`);
    });

    // Player ready status
    socket.on('set_ready', (data: { isReady: boolean }) => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.isReady = data.isReady;
      io.to(roomId).emit('player_ready', { playerId: socket.id, isReady: data.isReady });
    });

    // Start game
    socket.on('start_game', () => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      if (room.hostId !== socket.id) {
        socket.emit('error', { message: 'Only host can start the game' });
        return;
      }

      // Check if all players are ready
      const allReady = Array.from(room.players.values()).every(p => p.isReady || p.id === room.hostId);
      if (!allReady) {
        socket.emit('error', { message: 'Not all players are ready' });
        return;
      }

      room.gameState = 'playing';
      room.startTime = Date.now();
      
      // Initialize game grid (15x13 standard Bomberman grid)
      room.grid = generateGrid(15, 13);
      
      io.to(roomId).emit('game_started', { 
        grid: room.grid,
        players: Array.from(room.players.values()),
        startTime: room.startTime,
      });
      
      console.log(`[Multiplayer] Game started in room ${roomId}`);
    });

    // Player movement
    socket.on('move', (data: { x: number; y: number; direction: number }) => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room || room.gameState !== 'playing') return;

      const player = room.players.get(socket.id);
      if (!player || !player.isAlive) return;

      player.x = data.x;
      player.y = data.y;
      player.direction = data.direction;

      socket.to(roomId).emit('player_moved', {
        playerId: socket.id,
        x: data.x,
        y: data.y,
        direction: data.direction,
      });
    });

    // Place bomb
    socket.on('place_bomb', (data: { x: number; y: number; type?: string }) => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room || room.gameState !== 'playing') return;

      const player = room.players.get(socket.id);
      if (!player || !player.isAlive) return;

      // Check if player has bombs available
      const playerBombs = Array.from(room.bombs.values()).filter(b => b.playerId === socket.id);
      if (playerBombs.length >= player.maxBombs) return;

      const bombId = nanoid(6);
      const bomb: Bomb = {
        id: bombId,
        playerId: socket.id,
        x: data.x,
        y: data.y,
        range: player.fireRange,
        timer: 3000,
        type: (data.type as Bomb['type']) || 'normal',
      };

      room.bombs.set(bombId, bomb);

      io.to(roomId).emit('bomb_placed', { bomb });

      // Set timer for explosion
      setTimeout(() => {
        explodeBomb(io, roomId, bombId);
      }, bomb.timer);
    });

    // Detonate remote bomb
    socket.on('detonate_bomb', (data: { bombId: string }) => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const bomb = room.bombs.get(data.bombId);
      if (!bomb || bomb.playerId !== socket.id || bomb.type !== 'remote') return;

      explodeBomb(io, roomId, data.bombId);
    });

    // Collect power-up
    socket.on('collect_powerup', (data: { powerUpId: string; type: string }) => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      // Apply power-up effect
      switch (data.type) {
        case 'bomb_up':
          player.maxBombs++;
          break;
        case 'fire_up':
          player.fireRange++;
          break;
        case 'speed_up':
          player.speed = Math.min(player.speed + 0.2, 2);
          break;
      }

      io.to(roomId).emit('powerup_collected', {
        playerId: socket.id,
        powerUpId: data.powerUpId,
        type: data.type,
        newStats: {
          maxBombs: player.maxBombs,
          fireRange: player.fireRange,
          speed: player.speed,
        },
      });
    });

    // Player death
    socket.on('player_death', () => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.isAlive = false;

      io.to(roomId).emit('player_died', { playerId: socket.id });

      // Check for game over
      const alivePlayers = Array.from(room.players.values()).filter(p => p.isAlive);
      
      if (room.gameMode === 'coop' && alivePlayers.length === 0) {
        room.gameState = 'finished';
        io.to(roomId).emit('game_over', { reason: 'all_dead' });
      } else if (room.gameMode === 'versus' && alivePlayers.length <= 1) {
        room.gameState = 'finished';
        io.to(roomId).emit('game_over', { 
          reason: 'winner',
          winner: alivePlayers[0] || null,
        });
      }
    });

    // Enemy killed (coop mode)
    socket.on('enemy_killed', (data: { enemyId: string; killedBy: string }) => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      io.to(roomId).emit('enemy_died', data);
    });

    // Level complete (coop mode)
    socket.on('level_complete', (data: { score: number; time: number }) => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      room.gameState = 'finished';
      io.to(roomId).emit('level_completed', data);
    });

    // Chat message
    socket.on('chat', (data: { message: string }) => {
      const roomId = playerRooms.get(socket.id);
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      io.to(roomId).emit('chat_message', {
        playerId: socket.id,
        playerName: player.name,
        message: data.message,
        timestamp: Date.now(),
      });
    });

    // Leave room
    socket.on('leave_room', () => {
      handlePlayerLeave(io, socket);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Multiplayer] Player disconnected: ${socket.id}`);
      handlePlayerLeave(io, socket);
    });
  });

  return io;
}

function handlePlayerLeave(io: SocketServer, socket: Socket): void {
  const roomId = playerRooms.get(socket.id);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.get(socket.id);
  room.players.delete(socket.id);
  playerRooms.delete(socket.id);

  socket.leave(roomId);

  if (room.players.size === 0) {
    // Delete empty room
    rooms.delete(roomId);
    console.log(`[Multiplayer] Room ${roomId} deleted (empty)`);
  } else if (room.hostId === socket.id) {
    // Transfer host to next player
    const newHost = Array.from(room.players.values())[0];
    if (newHost) {
      room.hostId = newHost.id;
      io.to(roomId).emit('host_changed', { newHostId: newHost.id });
    }
    io.to(roomId).emit('player_left', { playerId: socket.id, playerName: player?.name });
  } else {
    io.to(roomId).emit('player_left', { playerId: socket.id, playerName: player?.name });
  }
}

function explodeBomb(io: SocketServer, roomId: string, bombId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  const bomb = room.bombs.get(bombId);
  if (!bomb) return;

  room.bombs.delete(bombId);

  // Calculate explosion tiles
  const explosionTiles: { x: number; y: number }[] = [{ x: bomb.x, y: bomb.y }];
  const directions = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 },  // right
  ];

  for (const dir of directions) {
    for (let i = 1; i <= bomb.range; i++) {
      const tx = bomb.x + dir.dx * i;
      const ty = bomb.y + dir.dy * i;

      // Check bounds
      if (tx < 0 || tx >= 15 || ty < 0 || ty >= 13) break;

      // Check for walls
      if (room.grid[ty] && room.grid[ty][tx] === 1) break; // Solid wall

      explosionTiles.push({ x: tx, y: ty });

      // Check for destructible blocks
      if (room.grid[ty] && room.grid[ty][tx] === 2) {
        room.grid[ty][tx] = 0; // Destroy block
        if (bomb.type !== 'pierce') break;
      }
    }
  }

  // Check for player hits
  for (const player of Array.from(room.players.values())) {
    if (!player.isAlive) continue;
    
    const playerTileX = Math.floor(player.x);
    const playerTileY = Math.floor(player.y);
    
    if (explosionTiles.some(t => t.x === playerTileX && t.y === playerTileY)) {
      player.isAlive = false;
      io.to(roomId).emit('player_hit', { playerId: player.id, bombOwnerId: bomb.playerId });
    }
  }

  // Chain explosions for other bombs
  for (const otherBomb of Array.from(room.bombs.values())) {
    if (explosionTiles.some(t => t.x === otherBomb.x && t.y === otherBomb.y)) {
      setTimeout(() => explodeBomb(io, roomId, otherBomb.id), 100);
    }
  }

  io.to(roomId).emit('bomb_exploded', {
    bombId,
    tiles: explosionTiles,
    gridUpdates: room.grid,
  });
}

function generateGrid(width: number, height: number): number[][] {
  const grid: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      // Border walls
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        grid[y][x] = 1; // Solid wall
      }
      // Grid pattern walls
      else if (x % 2 === 0 && y % 2 === 0) {
        grid[y][x] = 1; // Solid wall
      }
      // Safe spawn zones (corners)
      else if (
        (x <= 2 && y <= 2) ||
        (x >= width - 3 && y <= 2) ||
        (x <= 2 && y >= height - 3) ||
        (x >= width - 3 && y >= height - 3)
      ) {
        grid[y][x] = 0; // Empty
      }
      // Random destructible blocks
      else if (Math.random() < 0.7) {
        grid[y][x] = 2; // Destructible block
      }
      else {
        grid[y][x] = 0; // Empty
      }
    }
  }
  
  return grid;
}

function serializeRoom(room: GameRoom): any {
  return {
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    players: Array.from(room.players.values()),
    gameState: room.gameState,
    levelId: room.levelId,
    gameMode: room.gameMode,
    maxPlayers: room.maxPlayers,
  };
}

// Get active rooms for lobby
export function getActiveRooms(): any[] {
  return Array.from(rooms.values())
    .filter(room => room.gameState === 'waiting')
    .map(room => ({
      id: room.id,
      name: room.name,
      hostId: room.hostId,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers,
      gameMode: room.gameMode,
      levelId: room.levelId,
    }));
}
