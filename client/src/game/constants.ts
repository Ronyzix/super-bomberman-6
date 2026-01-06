// Game Constants - Super Bomberman 6

export const GAME_CONFIG = {
  // Grid settings
  TILE_SIZE: 48,
  GRID_WIDTH: 15,
  GRID_HEIGHT: 13,
  
  // Player settings
  PLAYER_SPEED: 3,
  PLAYER_MAX_SPEED: 8,
  PLAYER_LIVES: 3,
  PLAYER_INVINCIBILITY_TIME: 2000,
  
  // Bomb settings
  BOMB_TIMER: 3000,
  BOMB_DEFAULT_RANGE: 2,
  BOMB_MAX_RANGE: 8,
  BOMB_DEFAULT_COUNT: 1,
  BOMB_MAX_COUNT: 8,
  
  // Explosion settings
  EXPLOSION_DURATION: 500,
  
  // Power-up spawn chance
  POWERUP_SPAWN_CHANCE: 0.3,
  
  // Animation
  ANIMATION_FPS: 12,
  
  // Game timing
  LEVEL_START_DELAY: 2000,
  GAME_OVER_DELAY: 3000,
};

export const TILE_TYPES = {
  EMPTY: 0,
  WALL: 1,
  BLOCK: 2,
  SPAWN: 3,
  EXIT: 4,
} as const;

export const POWERUP_TYPES = {
  SPEED: 'speed',
  BOMB_COUNT: 'bomb_count',
  FIRE_RANGE: 'fire_range',
  POWER_BOMB: 'power_bomb',
  REMOTE_BOMB: 'remote_bomb',
  LINE_BOMB: 'line_bomb',
} as const;

export const BOMB_TYPES = {
  NORMAL: 'normal',
  PENETRATING: 'penetrating',
  REMOTE: 'remote',
  LINE: 'line',
} as const;

export const ENEMY_TYPES = {
  SLIME: 'slime',
  BAT: 'bat',
  GHOST: 'ghost',
  BOMBER: 'bomber',
  CHARGER: 'charger',
  TELEPORTER: 'teleporter',
  SHIELD: 'shield',
  SPLITTER: 'splitter',
} as const;

export const DIRECTION = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
} as const;

export const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  CUTSCENE: 'cutscene',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
  LOADING: 'loading',
} as const;

export const WORLDS = [
  { id: 1, name: 'Green Plains', theme: 'grass', levels: 4, boss: 'King Slime' },
  { id: 2, name: 'Lava Caves', theme: 'lava', levels: 4, boss: 'Dark Knight' },
  { id: 3, name: 'Ice Kingdom', theme: 'ice', levels: 4, boss: 'Fire Dragon' },
  { id: 4, name: 'Dark Forest', theme: 'forest', levels: 4, boss: 'Shadow Lord' },
  { id: 5, name: 'Final Castle', theme: 'castle', levels: 4, boss: 'Demon King' },
] as const;

export const COLORS = {
  // Theme colors
  primary: '#FF6B35',
  secondary: '#4ECDC4',
  accent: '#FFE66D',
  danger: '#FF4757',
  success: '#2ED573',
  
  // World themes
  grass: { bg: '#4A7C23', accent: '#8BC34A' },
  lava: { bg: '#8B0000', accent: '#FF4500' },
  ice: { bg: '#1E90FF', accent: '#87CEEB' },
  forest: { bg: '#2F4F4F', accent: '#556B2F' },
  castle: { bg: '#2C2C2C', accent: '#8B008B' },
};

export const KEYS = {
  UP: ['ArrowUp', 'KeyW'],
  DOWN: ['ArrowDown', 'KeyS'],
  LEFT: ['ArrowLeft', 'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],
  BOMB: ['Space', 'KeyJ'],
  PAUSE: ['Escape', 'KeyP'],
  DETONATE: ['KeyK', 'Enter'],
};

export type TileType = typeof TILE_TYPES[keyof typeof TILE_TYPES];
export type PowerUpType = typeof POWERUP_TYPES[keyof typeof POWERUP_TYPES];
export type BombType = typeof BOMB_TYPES[keyof typeof BOMB_TYPES];
export type EnemyType = typeof ENEMY_TYPES[keyof typeof ENEMY_TYPES];
export type GameState = typeof GAME_STATES[keyof typeof GAME_STATES];
export type Direction = typeof DIRECTION[keyof typeof DIRECTION];
