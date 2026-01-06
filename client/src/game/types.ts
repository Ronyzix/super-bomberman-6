// Type definitions for Super Bomberman 6

import { BombType, EnemyType, GameState, PowerUpType, TileType } from './constants';

export interface Position {
  x: number;
  y: number;
}

export interface GridPosition {
  col: number;
  row: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Entity {
  id: string;
  position: Position;
  gridPosition: GridPosition;
  bounds: Bounds;
  active: boolean;
}

export interface Player extends Entity {
  lives: number;
  speed: number;
  bombCount: number;
  maxBombs: number;
  fireRange: number;
  activeBombs: number;
  powerUps: PowerUpType[];
  bombType: BombType;
  isInvincible: boolean;
  invincibilityTimer: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  isDead: boolean;
  score: number;
  kills: number;
  animationFrame: number;
  color: string;
  playerIndex: number;
}

export interface Bomb extends Entity {
  type: BombType;
  range: number;
  timer: number;
  ownerId: string;
  isDetonated: boolean;
  animationFrame: number;
}

export interface Explosion extends Entity {
  range: number;
  direction: 'center' | 'up' | 'down' | 'left' | 'right';
  isEnd: boolean;
  timer: number;
  animationFrame: number;
}

export interface PowerUp extends Entity {
  type: PowerUpType;
  animationFrame: number;
}

export interface Enemy extends Entity {
  type: EnemyType;
  health: number;
  speed: number;
  direction: Position;
  targetPosition: Position | null;
  state: 'idle' | 'moving' | 'attacking' | 'stunned' | 'dying';
  stateTimer: number;
  animationFrame: number;
  canPassWalls: boolean;
  canPlaceBombs: boolean;
  isShielded: boolean;
  shieldTimer: number;
  specialAbilityCooldown: number;
  points: number;
}

export interface Boss extends Entity {
  name: string;
  health: number;
  maxHealth: number;
  phase: number;
  maxPhases: number;
  attackPattern: string;
  attackTimer: number;
  attackCooldown: number;
  isVulnerable: boolean;
  vulnerabilityTimer: number;
  state: 'intro' | 'idle' | 'attacking' | 'vulnerable' | 'transition' | 'dying' | 'defeated';
  animationFrame: number;
  dialogue: string[];
  currentDialogue: number;
  points: number;
}

export interface Tile {
  type: TileType;
  position: GridPosition;
  destructible: boolean;
  hasPowerUp: boolean;
  powerUpType?: PowerUpType;
}

export interface Level {
  id: number;
  world: number;
  name: string;
  grid: TileType[][];
  enemies: EnemySpawn[];
  boss?: BossConfig;
  timeLimit: number;
  targetScore: number;
  dialogue?: DialogueLine[];
  music: string;
  background: string;
}

export interface EnemySpawn {
  type: EnemyType;
  position: GridPosition;
  count?: number;
}

export interface BossConfig {
  type: string;
  position: GridPosition;
  dialogue: DialogueLine[];
}

export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
}

export interface GameStateData {
  state: GameState;
  currentWorld: number;
  currentLevel: number;
  players: Player[];
  bombs: Bomb[];
  explosions: Explosion[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  boss: Boss | null;
  grid: Tile[][];
  score: number;
  time: number;
  isPaused: boolean;
  isMultiplayer: boolean;
  roomId?: string;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  bomb: boolean;
  detonate: boolean;
  pause: boolean;
}

export interface TouchState {
  joystick: Position;
  bombPressed: boolean;
  detonatePressed: boolean;
}

export interface GameStats {
  totalKills: number;
  totalDeaths: number;
  levelsCompleted: number;
  bossesDefeated: number;
  powerUpsCollected: number;
  bombsPlaced: number;
  totalScore: number;
  playTime: number;
  highestCombo: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  target: number;
}

export interface Replay {
  id: string;
  playerId: string;
  playerName: string;
  levelId: number;
  score: number;
  duration: number;
  createdAt: Date;
  frames: ReplayFrame[];
  isPublic: boolean;
  likes: number;
}

export interface ReplayFrame {
  timestamp: number;
  inputs: InputState[];
  gameState: Partial<GameStateData>;
}

export interface MultiplayerRoom {
  id: string;
  name: string;
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  currentLevel: number;
  createdAt: Date;
}

export interface RoomPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  color: string;
  playerIndex: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  level: number;
  time: number;
  date: Date;
}

export interface InfiniteMapConfig {
  seed: string;
  difficulty: number;
  wave: number;
  enemyDensity: number;
  powerUpDensity: number;
}

export interface SoundEffect {
  name: string;
  volume: number;
  loop: boolean;
}

export interface Animation {
  frames: number[];
  frameRate: number;
  loop: boolean;
  currentFrame: number;
  timer: number;
}
