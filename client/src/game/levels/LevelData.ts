// Level Data - All 20+ levels across 5 worlds

import { TILE_TYPES, ENEMY_TYPES, WORLDS, TileType } from '../constants';
import { Level, EnemySpawn, DialogueLine } from '../types';

const T = TILE_TYPES;
const E = ENEMY_TYPES;

// Helper to create a standard grid with walls and random blocks
function createGrid(blockDensity: number = 0.4): TileType[][] {
  const grid: TileType[][] = [];
  const width = 15;
  const height = 13;
  
  for (let row = 0; row < height; row++) {
    grid[row] = [];
    for (let col = 0; col < width; col++) {
      // Border walls
      if (row === 0 || row === height - 1 || col === 0 || col === width - 1) {
        grid[row][col] = T.WALL;
      }
      // Fixed walls (every other cell)
      else if (row % 2 === 0 && col % 2 === 0) {
        grid[row][col] = T.WALL;
      }
      // Player spawn area (top-left corner)
      else if ((row <= 2 && col <= 2) || (row <= 2 && col >= width - 3) ||
               (row >= height - 3 && col <= 2) || (row >= height - 3 && col >= width - 3)) {
        grid[row][col] = T.SPAWN;
      }
      // Random blocks
      else if (Math.random() < blockDensity) {
        grid[row][col] = T.BLOCK;
      }
      // Empty
      else {
        grid[row][col] = T.EMPTY;
      }
    }
  }
  
  return grid;
}

// World 1: Green Plains
const world1Levels: Level[] = [
  {
    id: 1,
    world: 1,
    name: 'Peaceful Meadow',
    grid: createGrid(0.3),
    enemies: [
      { type: E.SLIME, position: { col: 7, row: 6 }, count: 3 },
      { type: E.SLIME, position: { col: 10, row: 8 }, count: 2 },
    ],
    timeLimit: 180000,
    targetScore: 500,
    dialogue: [
      { speaker: 'Bomberman', text: 'The evil forces have invaded our peaceful land!' },
      { speaker: 'Bomberman', text: 'I must stop them and restore peace!' },
    ],
    music: 'world1',
    background: 'grass',
  },
  {
    id: 2,
    world: 1,
    name: 'Forest Edge',
    grid: createGrid(0.35),
    enemies: [
      { type: E.SLIME, position: { col: 5, row: 5 }, count: 3 },
      { type: E.BAT, position: { col: 10, row: 7 }, count: 2 },
    ],
    timeLimit: 180000,
    targetScore: 800,
    music: 'world1',
    background: 'grass',
  },
  {
    id: 3,
    world: 1,
    name: 'Hidden Grove',
    grid: createGrid(0.4),
    enemies: [
      { type: E.SLIME, position: { col: 7, row: 3 }, count: 2 },
      { type: E.BAT, position: { col: 9, row: 9 }, count: 3 },
      { type: E.GHOST, position: { col: 5, row: 7 }, count: 1 },
    ],
    timeLimit: 200000,
    targetScore: 1200,
    music: 'world1',
    background: 'grass',
  },
  {
    id: 4,
    world: 1,
    name: 'Ancient Ruins',
    grid: createGrid(0.45),
    enemies: [
      { type: E.SLIME, position: { col: 7, row: 6 }, count: 2 },
      { type: E.BAT, position: { col: 11, row: 5 }, count: 2 },
      { type: E.GHOST, position: { col: 5, row: 9 }, count: 2 },
      { type: E.BOMBER, position: { col: 9, row: 7 }, count: 1 },
    ],
    timeLimit: 220000,
    targetScore: 1500,
    music: 'world1',
    background: 'grass',
  },
  {
    id: 5,
    world: 1,
    name: 'King Slime\'s Lair',
    grid: createGrid(0.25),
    enemies: [],
    boss: {
      type: 'king_slime',
      position: { col: 7, row: 6 },
      dialogue: [
        { speaker: 'King Slime', text: 'You dare enter my domain, little bomber?' },
        { speaker: 'Bomberman', text: 'Your reign of slime ends here!' },
        { speaker: 'King Slime', text: 'We shall see about that! BLOBBB!' },
      ],
    },
    timeLimit: 300000,
    targetScore: 3000,
    music: 'boss1',
    background: 'grass',
  },
];

// World 2: Lava Caves
const world2Levels: Level[] = [
  {
    id: 6,
    world: 2,
    name: 'Molten Entrance',
    grid: createGrid(0.35),
    enemies: [
      { type: E.CHARGER, position: { col: 7, row: 6 }, count: 2 },
      { type: E.BAT, position: { col: 10, row: 8 }, count: 3 },
    ],
    timeLimit: 180000,
    targetScore: 1000,
    dialogue: [
      { speaker: 'Bomberman', text: 'The heat is intense... I must be careful.' },
    ],
    music: 'world2',
    background: 'lava',
  },
  {
    id: 7,
    world: 2,
    name: 'Magma Flow',
    grid: createGrid(0.4),
    enemies: [
      { type: E.CHARGER, position: { col: 5, row: 5 }, count: 3 },
      { type: E.BOMBER, position: { col: 10, row: 7 }, count: 2 },
    ],
    timeLimit: 200000,
    targetScore: 1400,
    music: 'world2',
    background: 'lava',
  },
  {
    id: 8,
    world: 2,
    name: 'Volcanic Core',
    grid: createGrid(0.45),
    enemies: [
      { type: E.CHARGER, position: { col: 7, row: 3 }, count: 2 },
      { type: E.BOMBER, position: { col: 9, row: 9 }, count: 2 },
      { type: E.SHIELD, position: { col: 5, row: 7 }, count: 2 },
    ],
    timeLimit: 220000,
    targetScore: 1800,
    music: 'world2',
    background: 'lava',
  },
  {
    id: 9,
    world: 2,
    name: 'Obsidian Depths',
    grid: createGrid(0.5),
    enemies: [
      { type: E.CHARGER, position: { col: 7, row: 6 }, count: 3 },
      { type: E.BOMBER, position: { col: 11, row: 5 }, count: 2 },
      { type: E.SHIELD, position: { col: 5, row: 9 }, count: 2 },
      { type: E.TELEPORTER, position: { col: 9, row: 7 }, count: 1 },
    ],
    timeLimit: 240000,
    targetScore: 2200,
    music: 'world2',
    background: 'lava',
  },
  {
    id: 10,
    world: 2,
    name: 'Dark Knight\'s Chamber',
    grid: createGrid(0.3),
    enemies: [],
    boss: {
      type: 'dark_knight',
      position: { col: 7, row: 6 },
      dialogue: [
        { speaker: 'Dark Knight', text: 'Another fool seeks to challenge me?' },
        { speaker: 'Bomberman', text: 'I will defeat you and continue my journey!' },
        { speaker: 'Dark Knight', text: 'Your bombs are nothing against my armor!' },
      ],
    },
    timeLimit: 300000,
    targetScore: 4000,
    music: 'boss2',
    background: 'lava',
  },
];

// World 3: Ice Kingdom
const world3Levels: Level[] = [
  {
    id: 11,
    world: 3,
    name: 'Frozen Tundra',
    grid: createGrid(0.35),
    enemies: [
      { type: E.GHOST, position: { col: 7, row: 6 }, count: 3 },
      { type: E.TELEPORTER, position: { col: 10, row: 8 }, count: 2 },
    ],
    timeLimit: 180000,
    targetScore: 1500,
    dialogue: [
      { speaker: 'Bomberman', text: 'So cold... but I must press on!' },
    ],
    music: 'world3',
    background: 'ice',
  },
  {
    id: 12,
    world: 3,
    name: 'Crystal Caverns',
    grid: createGrid(0.4),
    enemies: [
      { type: E.GHOST, position: { col: 5, row: 5 }, count: 3 },
      { type: E.TELEPORTER, position: { col: 10, row: 7 }, count: 2 },
      { type: E.SPLITTER, position: { col: 7, row: 9 }, count: 1 },
    ],
    timeLimit: 200000,
    targetScore: 1800,
    music: 'world3',
    background: 'ice',
  },
  {
    id: 13,
    world: 3,
    name: 'Glacier Peak',
    grid: createGrid(0.45),
    enemies: [
      { type: E.GHOST, position: { col: 7, row: 3 }, count: 2 },
      { type: E.TELEPORTER, position: { col: 9, row: 9 }, count: 2 },
      { type: E.SPLITTER, position: { col: 5, row: 7 }, count: 2 },
      { type: E.SHIELD, position: { col: 11, row: 5 }, count: 1 },
    ],
    timeLimit: 220000,
    targetScore: 2200,
    music: 'world3',
    background: 'ice',
  },
  {
    id: 14,
    world: 3,
    name: 'Blizzard Pass',
    grid: createGrid(0.5),
    enemies: [
      { type: E.GHOST, position: { col: 7, row: 6 }, count: 3 },
      { type: E.TELEPORTER, position: { col: 11, row: 5 }, count: 2 },
      { type: E.SPLITTER, position: { col: 5, row: 9 }, count: 2 },
      { type: E.BOMBER, position: { col: 9, row: 7 }, count: 2 },
    ],
    timeLimit: 240000,
    targetScore: 2600,
    music: 'world3',
    background: 'ice',
  },
  {
    id: 15,
    world: 3,
    name: 'Fire Dragon\'s Nest',
    grid: createGrid(0.3),
    enemies: [],
    boss: {
      type: 'fire_dragon',
      position: { col: 7, row: 6 },
      dialogue: [
        { speaker: 'Fire Dragon', text: 'ROAAARRR! You disturb my slumber!' },
        { speaker: 'Bomberman', text: 'A fire dragon in an ice kingdom?' },
        { speaker: 'Fire Dragon', text: 'I shall melt you where you stand!' },
      ],
    },
    timeLimit: 300000,
    targetScore: 5000,
    music: 'boss3',
    background: 'ice',
  },
];

// World 4: Dark Forest
const world4Levels: Level[] = [
  {
    id: 16,
    world: 4,
    name: 'Twilight Woods',
    grid: createGrid(0.4),
    enemies: [
      { type: E.GHOST, position: { col: 7, row: 6 }, count: 3 },
      { type: E.BAT, position: { col: 10, row: 8 }, count: 3 },
      { type: E.SPLITTER, position: { col: 5, row: 5 }, count: 2 },
    ],
    timeLimit: 200000,
    targetScore: 2000,
    dialogue: [
      { speaker: 'Bomberman', text: 'The darkness is overwhelming...' },
    ],
    music: 'world4',
    background: 'forest',
  },
  {
    id: 17,
    world: 4,
    name: 'Haunted Hollow',
    grid: createGrid(0.45),
    enemies: [
      { type: E.GHOST, position: { col: 5, row: 5 }, count: 4 },
      { type: E.TELEPORTER, position: { col: 10, row: 7 }, count: 2 },
      { type: E.BOMBER, position: { col: 7, row: 9 }, count: 2 },
    ],
    timeLimit: 220000,
    targetScore: 2400,
    music: 'world4',
    background: 'forest',
  },
  {
    id: 18,
    world: 4,
    name: 'Shadow Glen',
    grid: createGrid(0.5),
    enemies: [
      { type: E.GHOST, position: { col: 7, row: 3 }, count: 3 },
      { type: E.TELEPORTER, position: { col: 9, row: 9 }, count: 2 },
      { type: E.CHARGER, position: { col: 5, row: 7 }, count: 2 },
      { type: E.SHIELD, position: { col: 11, row: 5 }, count: 2 },
    ],
    timeLimit: 240000,
    targetScore: 2800,
    music: 'world4',
    background: 'forest',
  },
  {
    id: 19,
    world: 4,
    name: 'Nightmare Realm',
    grid: createGrid(0.55),
    enemies: [
      { type: E.GHOST, position: { col: 7, row: 6 }, count: 4 },
      { type: E.TELEPORTER, position: { col: 11, row: 5 }, count: 2 },
      { type: E.BOMBER, position: { col: 5, row: 9 }, count: 2 },
      { type: E.CHARGER, position: { col: 9, row: 7 }, count: 2 },
      { type: E.SPLITTER, position: { col: 3, row: 3 }, count: 2 },
    ],
    timeLimit: 260000,
    targetScore: 3200,
    music: 'world4',
    background: 'forest',
  },
  {
    id: 20,
    world: 4,
    name: 'Shadow Lord\'s Domain',
    grid: createGrid(0.3),
    enemies: [],
    boss: {
      type: 'shadow_lord',
      position: { col: 7, row: 6 },
      dialogue: [
        { speaker: 'Shadow Lord', text: 'You have come far, little bomber...' },
        { speaker: 'Bomberman', text: 'Your darkness will not stop me!' },
        { speaker: 'Shadow Lord', text: 'Let us see if you can find the real me!' },
      ],
    },
    timeLimit: 300000,
    targetScore: 6000,
    music: 'boss4',
    background: 'forest',
  },
];

// World 5: Final Castle
const world5Levels: Level[] = [
  {
    id: 21,
    world: 5,
    name: 'Castle Gates',
    grid: createGrid(0.45),
    enemies: [
      { type: E.CHARGER, position: { col: 7, row: 6 }, count: 3 },
      { type: E.BOMBER, position: { col: 10, row: 8 }, count: 3 },
      { type: E.SHIELD, position: { col: 5, row: 5 }, count: 2 },
    ],
    timeLimit: 220000,
    targetScore: 2500,
    dialogue: [
      { speaker: 'Bomberman', text: 'This is it... the final castle!' },
      { speaker: 'Bomberman', text: 'I must defeat the Demon King!' },
    ],
    music: 'world5',
    background: 'castle',
  },
  {
    id: 22,
    world: 5,
    name: 'Grand Hall',
    grid: createGrid(0.5),
    enemies: [
      { type: E.CHARGER, position: { col: 5, row: 5 }, count: 3 },
      { type: E.BOMBER, position: { col: 10, row: 7 }, count: 3 },
      { type: E.TELEPORTER, position: { col: 7, row: 9 }, count: 2 },
      { type: E.GHOST, position: { col: 11, row: 3 }, count: 2 },
    ],
    timeLimit: 240000,
    targetScore: 3000,
    music: 'world5',
    background: 'castle',
  },
  {
    id: 23,
    world: 5,
    name: 'Tower of Trials',
    grid: createGrid(0.55),
    enemies: [
      { type: E.CHARGER, position: { col: 7, row: 3 }, count: 3 },
      { type: E.BOMBER, position: { col: 9, row: 9 }, count: 3 },
      { type: E.TELEPORTER, position: { col: 5, row: 7 }, count: 2 },
      { type: E.SHIELD, position: { col: 11, row: 5 }, count: 2 },
      { type: E.SPLITTER, position: { col: 3, row: 9 }, count: 2 },
    ],
    timeLimit: 260000,
    targetScore: 3500,
    music: 'world5',
    background: 'castle',
  },
  {
    id: 24,
    world: 5,
    name: 'Throne Approach',
    grid: createGrid(0.6),
    enemies: [
      { type: E.CHARGER, position: { col: 7, row: 6 }, count: 4 },
      { type: E.BOMBER, position: { col: 11, row: 5 }, count: 3 },
      { type: E.TELEPORTER, position: { col: 5, row: 9 }, count: 2 },
      { type: E.GHOST, position: { col: 9, row: 7 }, count: 3 },
      { type: E.SHIELD, position: { col: 3, row: 3 }, count: 2 },
      { type: E.SPLITTER, position: { col: 11, row: 9 }, count: 2 },
    ],
    timeLimit: 280000,
    targetScore: 4000,
    music: 'world5',
    background: 'castle',
  },
  {
    id: 25,
    world: 5,
    name: 'Demon King\'s Throne',
    grid: createGrid(0.25),
    enemies: [],
    boss: {
      type: 'demon_king',
      position: { col: 7, row: 6 },
      dialogue: [
        { speaker: 'Demon King', text: 'So, you have finally arrived...' },
        { speaker: 'Bomberman', text: 'Your evil ends today, Demon King!' },
        { speaker: 'Demon King', text: 'Foolish mortal! I am ETERNAL!' },
        { speaker: 'Demon King', text: 'Prepare to face my TRUE POWER!' },
      ],
    },
    timeLimit: 360000,
    targetScore: 10000,
    music: 'boss_final',
    background: 'castle',
  },
];

// Combine all levels
export const ALL_LEVELS: Level[] = [
  ...world1Levels,
  ...world2Levels,
  ...world3Levels,
  ...world4Levels,
  ...world5Levels,
];

// Get level by ID
export function getLevelById(id: number): Level | undefined {
  return ALL_LEVELS.find(level => level.id === id);
}

// Get levels by world
export function getLevelsByWorld(worldId: number): Level[] {
  return ALL_LEVELS.filter(level => level.world === worldId);
}

// Get world info
export function getWorldInfo(worldId: number) {
  return WORLDS.find(w => w.id === worldId);
}

// Check if level is a boss level
export function isBossLevel(levelId: number): boolean {
  const level = getLevelById(levelId);
  return level?.boss !== undefined;
}

// Get next level ID
export function getNextLevelId(currentId: number): number | null {
  const currentIndex = ALL_LEVELS.findIndex(l => l.id === currentId);
  if (currentIndex === -1 || currentIndex === ALL_LEVELS.length - 1) {
    return null;
  }
  return ALL_LEVELS[currentIndex + 1].id;
}

// Get total level count
export function getTotalLevelCount(): number {
  return ALL_LEVELS.length;
}
