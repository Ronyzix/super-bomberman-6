// Multiplayer Client - Handles WebSocket communication with server
import { io, Socket } from 'socket.io-client';

export interface MultiplayerPlayer {
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

export interface MultiplayerBomb {
  id: string;
  playerId: string;
  x: number;
  y: number;
  range: number;
  timer: number;
  type: 'normal' | 'pierce' | 'remote' | 'line';
}

export interface MultiplayerRoom {
  id: string;
  name: string;
  hostId: string;
  players: MultiplayerPlayer[];
  gameState: 'waiting' | 'playing' | 'finished';
  levelId: number;
  gameMode: 'coop' | 'versus';
  maxPlayers: number;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

type EventCallback = (...args: any[]) => void;

class MultiplayerClient {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private currentRoom: MultiplayerRoom | null = null;
  private playerId: string | null = null;
  private eventListeners: Map<string, EventCallback[]> = new Map();

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const socketUrl = window.location.origin;
      
      this.socket = io(socketUrl, {
        path: '/api/socket.io',
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('[Multiplayer] Connected to server');
        this.connected = true;
        this.playerId = this.socket!.id || null;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Multiplayer] Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('[Multiplayer] Disconnected from server');
        this.connected = false;
        this.emit('disconnected');
      });

      this.setupEventHandlers();
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Room events
    this.socket.on('room_created', (data: { roomId: string; room: MultiplayerRoom }) => {
      this.currentRoom = data.room;
      this.emit('roomCreated', data);
    });

    this.socket.on('room_joined', (data: { room: MultiplayerRoom; playerId: string }) => {
      this.currentRoom = data.room;
      this.playerId = data.playerId;
      this.emit('roomJoined', data);
    });

    this.socket.on('player_joined', (data: { player: MultiplayerPlayer }) => {
      if (this.currentRoom) {
        this.currentRoom.players.push(data.player);
      }
      this.emit('playerJoined', data);
    });

    this.socket.on('player_left', (data: { playerId: string; playerName: string }) => {
      if (this.currentRoom) {
        this.currentRoom.players = this.currentRoom.players.filter(p => p.id !== data.playerId);
      }
      this.emit('playerLeft', data);
    });

    this.socket.on('player_ready', (data: { playerId: string; isReady: boolean }) => {
      if (this.currentRoom) {
        const player = this.currentRoom.players.find(p => p.id === data.playerId);
        if (player) player.isReady = data.isReady;
      }
      this.emit('playerReady', data);
    });

    this.socket.on('host_changed', (data: { newHostId: string }) => {
      if (this.currentRoom) {
        this.currentRoom.hostId = data.newHostId;
      }
      this.emit('hostChanged', data);
    });

    // Game events
    this.socket.on('game_started', (data: { grid: number[][]; players: MultiplayerPlayer[]; startTime: number }) => {
      if (this.currentRoom) {
        this.currentRoom.gameState = 'playing';
        this.currentRoom.players = data.players;
      }
      this.emit('gameStarted', data);
    });

    this.socket.on('player_moved', (data: { playerId: string; x: number; y: number; direction: number }) => {
      if (this.currentRoom) {
        const player = this.currentRoom.players.find(p => p.id === data.playerId);
        if (player) {
          player.x = data.x;
          player.y = data.y;
          player.direction = data.direction;
        }
      }
      this.emit('playerMoved', data);
    });

    this.socket.on('bomb_placed', (data: { bomb: MultiplayerBomb }) => {
      this.emit('bombPlaced', data);
    });

    this.socket.on('bomb_exploded', (data: { bombId: string; tiles: { x: number; y: number }[]; gridUpdates: number[][] }) => {
      this.emit('bombExploded', data);
    });

    this.socket.on('player_hit', (data: { playerId: string; bombOwnerId: string }) => {
      if (this.currentRoom) {
        const player = this.currentRoom.players.find(p => p.id === data.playerId);
        if (player) player.isAlive = false;
      }
      this.emit('playerHit', data);
    });

    this.socket.on('player_died', (data: { playerId: string }) => {
      if (this.currentRoom) {
        const player = this.currentRoom.players.find(p => p.id === data.playerId);
        if (player) player.isAlive = false;
      }
      this.emit('playerDied', data);
    });

    this.socket.on('powerup_collected', (data: { playerId: string; powerUpId: string; type: string; newStats: any }) => {
      if (this.currentRoom) {
        const player = this.currentRoom.players.find(p => p.id === data.playerId);
        if (player) {
          player.maxBombs = data.newStats.maxBombs;
          player.fireRange = data.newStats.fireRange;
          player.speed = data.newStats.speed;
        }
      }
      this.emit('powerupCollected', data);
    });

    this.socket.on('enemy_died', (data: { enemyId: string; killedBy: string }) => {
      this.emit('enemyDied', data);
    });

    this.socket.on('level_completed', (data: { score: number; time: number }) => {
      if (this.currentRoom) {
        this.currentRoom.gameState = 'finished';
      }
      this.emit('levelCompleted', data);
    });

    this.socket.on('game_over', (data: { reason: string; winner?: MultiplayerPlayer }) => {
      if (this.currentRoom) {
        this.currentRoom.gameState = 'finished';
      }
      this.emit('gameOver', data);
    });

    // Chat
    this.socket.on('chat_message', (data: ChatMessage) => {
      this.emit('chatMessage', data);
    });

    // Errors
    this.socket.on('error', (data: { message: string }) => {
      console.error('[Multiplayer] Error:', data.message);
      this.emit('error', data);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.currentRoom = null;
      this.playerId = null;
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getPlayerId(): string | null {
    return this.playerId;
  }

  public getCurrentRoom(): MultiplayerRoom | null {
    return this.currentRoom;
  }

  public isHost(): boolean {
    return this.currentRoom?.hostId === this.playerId;
  }

  // Room actions
  public createRoom(name: string, hostName: string, hostUserId: number, maxPlayers: number = 4, gameMode: 'coop' | 'versus' = 'coop', levelId: number = 1): void {
    this.socket?.emit('create_room', { name, hostName, hostUserId, maxPlayers, gameMode, levelId });
  }

  public joinRoom(roomId: string, playerName: string, userId: number): void {
    this.socket?.emit('join_room', { roomId, playerName, userId });
  }

  public leaveRoom(): void {
    this.socket?.emit('leave_room');
    this.currentRoom = null;
  }

  public setReady(isReady: boolean): void {
    this.socket?.emit('set_ready', { isReady });
  }

  public startGame(): void {
    this.socket?.emit('start_game');
  }

  // Game actions
  public sendMove(x: number, y: number, direction: number): void {
    this.socket?.emit('move', { x, y, direction });
  }

  public placeBomb(x: number, y: number, type: string = 'normal'): void {
    this.socket?.emit('place_bomb', { x, y, type });
  }

  public detonateBomb(bombId: string): void {
    this.socket?.emit('detonate_bomb', { bombId });
  }

  public collectPowerUp(powerUpId: string, type: string): void {
    this.socket?.emit('collect_powerup', { powerUpId, type });
  }

  public reportDeath(): void {
    this.socket?.emit('player_death');
  }

  public reportEnemyKill(enemyId: string): void {
    this.socket?.emit('enemy_killed', { enemyId, killedBy: this.playerId });
  }

  public reportLevelComplete(score: number, time: number): void {
    this.socket?.emit('level_complete', { score, time });
  }

  public sendChat(message: string): void {
    this.socket?.emit('chat', { message });
  }

  // Event handling
  public on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

export const multiplayerClient = new MultiplayerClient();
