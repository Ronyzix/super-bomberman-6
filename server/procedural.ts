// Procedural Map Generation using LLM
import { invokeLLM } from "./_core/llm";

export interface GeneratedMap {
  grid: number[][];
  enemies: EnemySpawn[];
  powerUps: PowerUpSpawn[];
  theme: string;
  difficulty: number;
  description: string;
}

export interface EnemySpawn {
  type: string;
  x: number;
  y: number;
  count?: number;
}

export interface PowerUpSpawn {
  type: string;
  x: number;
  y: number;
  hidden?: boolean;
}

const ENEMY_TYPES = ['slime', 'bat', 'ghost', 'charger', 'bomber', 'shield', 'teleporter', 'splitter'];
const POWERUP_TYPES = ['bomb_up', 'fire_up', 'speed_up', 'remote', 'pierce', 'shield'];
const THEMES = ['forest', 'cave', 'volcano', 'shadow', 'castle', 'ice', 'desert', 'tech'];

// Fallback procedural generation (no LLM needed)
export function generateMapFallback(wave: number, difficulty: 'normal' | 'hard' | 'insane' = 'normal'): GeneratedMap {
  const width = 15;
  const height = 13;
  
  // Difficulty multipliers
  const difficultyMultiplier = difficulty === 'insane' ? 2 : difficulty === 'hard' ? 1.5 : 1;
  const waveMultiplier = 1 + (wave - 1) * 0.1;
  
  // Generate base grid
  const grid: number[][] = [];
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      // Border walls
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        grid[y][x] = 1; // Solid wall
      }
      // Grid pattern walls (classic Bomberman)
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
        grid[y][x] = 0; // Empty (safe zone)
      }
      // Random destructible blocks based on wave
      else {
        const blockChance = Math.min(0.5 + wave * 0.02, 0.8);
        grid[y][x] = Math.random() < blockChance ? 2 : 0;
      }
    }
  }
  
  // Add some variety with patterns based on wave
  if (wave % 5 === 0) {
    // Boss wave - more open space
    for (let y = 4; y < height - 4; y++) {
      for (let x = 4; x < width - 4; x++) {
        if (grid[y][x] === 2 && Math.random() < 0.5) {
          grid[y][x] = 0;
        }
      }
    }
  } else if (wave % 3 === 0) {
    // Maze wave - more walls
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === 0 && Math.random() < 0.3) {
          grid[y][x] = 2;
        }
      }
    }
  }
  
  // Generate enemies
  const baseEnemyCount = Math.floor(3 + wave * 0.5 * difficultyMultiplier);
  const enemyCount = Math.min(baseEnemyCount, 15);
  const enemies: EnemySpawn[] = [];
  
  // Select enemy types based on wave
  const availableEnemies = ENEMY_TYPES.slice(0, Math.min(2 + Math.floor(wave / 3), ENEMY_TYPES.length));
  
  for (let i = 0; i < enemyCount; i++) {
    // Find empty spot (not in spawn zones)
    let x, y;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * (width - 2)) + 1;
      y = Math.floor(Math.random() * (height - 2)) + 1;
      attempts++;
    } while (
      (grid[y][x] !== 0 || isSpawnZone(x, y, width, height)) && 
      attempts < 100
    );
    
    if (attempts < 100) {
      const enemyType = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
      enemies.push({ type: enemyType, x, y });
    }
  }
  
  // Generate power-ups
  const powerUpCount = Math.floor(2 + wave * 0.3);
  const powerUps: PowerUpSpawn[] = [];
  
  for (let i = 0; i < powerUpCount; i++) {
    // Find destructible block to hide power-up
    let x, y;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * (width - 2)) + 1;
      y = Math.floor(Math.random() * (height - 2)) + 1;
      attempts++;
    } while (grid[y][x] !== 2 && attempts < 100);
    
    if (attempts < 100) {
      const powerUpType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      powerUps.push({ type: powerUpType, x, y, hidden: true });
    }
  }
  
  // Select theme based on wave
  const themeIndex = Math.floor((wave - 1) / 5) % THEMES.length;
  const theme = THEMES[themeIndex];
  
  return {
    grid,
    enemies,
    powerUps,
    theme,
    difficulty: wave,
    description: `Wave ${wave} - ${theme.charAt(0).toUpperCase() + theme.slice(1)} realm`,
  };
}

function isSpawnZone(x: number, y: number, width: number, height: number): boolean {
  return (
    (x <= 2 && y <= 2) ||
    (x >= width - 3 && y <= 2) ||
    (x <= 2 && y >= height - 3) ||
    (x >= width - 3 && y >= height - 3)
  );
}

// LLM-based procedural generation for unique maps
export async function generateMapWithLLM(
  wave: number, 
  difficulty: 'normal' | 'hard' | 'insane' = 'normal',
  playerCount: number = 1
): Promise<GeneratedMap> {
  try {
    const prompt = buildMapGenerationPrompt(wave, difficulty, playerCount);
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a game level designer for a Bomberman-style game. Generate creative and balanced map layouts.
          
Rules:
- Grid is 15x13 tiles
- 0 = empty, 1 = solid wall (indestructible), 2 = destructible block
- Border must be solid walls (1)
- Even rows and columns (0,2,4...) at intersections should be solid walls
- Leave spawn zones clear in corners (3x3 area)
- Balance difficulty with fun
- Include variety in enemy placement
- Hide power-ups in destructible blocks

Respond ONLY with valid JSON matching the schema.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "generated_map",
          strict: true,
          schema: {
            type: "object",
            properties: {
              theme: { type: "string", description: "Visual theme for the map" },
              description: { type: "string", description: "Brief description of the level" },
              blockDensity: { type: "number", description: "Percentage of destructible blocks (0.3-0.8)" },
              enemyTypes: { 
                type: "array", 
                items: { type: "string" },
                description: "Types of enemies to spawn"
              },
              enemyCount: { type: "integer", description: "Total number of enemies" },
              powerUpTypes: {
                type: "array",
                items: { type: "string" },
                description: "Types of power-ups to include"
              },
              specialFeature: { type: "string", description: "Optional special map feature" }
            },
            required: ["theme", "description", "blockDensity", "enemyTypes", "enemyCount", "powerUpTypes"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from LLM");
    }

    const llmResult = JSON.parse(content);
    
    // Use LLM suggestions to generate the actual map
    return generateMapFromLLMSuggestions(wave, difficulty, llmResult);
    
  } catch (error) {
    console.warn("[Procedural] LLM generation failed, using fallback:", error);
    return generateMapFallback(wave, difficulty);
  }
}

function buildMapGenerationPrompt(wave: number, difficulty: string, playerCount: number): string {
  return `Generate a unique Bomberman map for:
- Wave: ${wave}
- Difficulty: ${difficulty}
- Players: ${playerCount}

Consider:
- Wave ${wave} should have appropriate challenge level
- ${difficulty} difficulty means ${difficulty === 'insane' ? 'maximum challenge' : difficulty === 'hard' ? 'high challenge' : 'balanced fun'}
- ${playerCount} player(s) need space to maneuver
- Every 5th wave is a boss wave (more open)
- Include thematic variety

Available enemy types: ${ENEMY_TYPES.join(', ')}
Available power-ups: ${POWERUP_TYPES.join(', ')}
Available themes: ${THEMES.join(', ')}`;
}

function generateMapFromLLMSuggestions(
  wave: number, 
  difficulty: 'normal' | 'hard' | 'insane',
  suggestions: any
): GeneratedMap {
  const width = 15;
  const height = 13;
  
  // Generate grid with suggested block density
  const blockDensity = Math.max(0.3, Math.min(0.8, suggestions.blockDensity || 0.6));
  const grid: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        grid[y][x] = 1;
      } else if (x % 2 === 0 && y % 2 === 0) {
        grid[y][x] = 1;
      } else if (isSpawnZone(x, y, width, height)) {
        grid[y][x] = 0;
      } else {
        grid[y][x] = Math.random() < blockDensity ? 2 : 0;
      }
    }
  }
  
  // Apply special features
  if (suggestions.specialFeature) {
    applySpecialFeature(grid, suggestions.specialFeature);
  }
  
  // Generate enemies based on LLM suggestions
  const enemyTypes = (suggestions.enemyTypes || ['slime']).filter((t: string) => ENEMY_TYPES.includes(t));
  const enemyCount = Math.min(suggestions.enemyCount || 5, 15);
  const enemies: EnemySpawn[] = [];
  
  for (let i = 0; i < enemyCount; i++) {
    let x, y;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * (width - 2)) + 1;
      y = Math.floor(Math.random() * (height - 2)) + 1;
      attempts++;
    } while ((grid[y][x] !== 0 || isSpawnZone(x, y, width, height)) && attempts < 100);
    
    if (attempts < 100) {
      const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)] || 'slime';
      enemies.push({ type: enemyType, x, y });
    }
  }
  
  // Generate power-ups
  const powerUpTypes = (suggestions.powerUpTypes || ['bomb_up']).filter((t: string) => POWERUP_TYPES.includes(t));
  const powerUpCount = Math.floor(2 + wave * 0.2);
  const powerUps: PowerUpSpawn[] = [];
  
  for (let i = 0; i < powerUpCount; i++) {
    let x, y;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * (width - 2)) + 1;
      y = Math.floor(Math.random() * (height - 2)) + 1;
      attempts++;
    } while (grid[y][x] !== 2 && attempts < 100);
    
    if (attempts < 100) {
      const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)] || 'bomb_up';
      powerUps.push({ type: powerUpType, x, y, hidden: true });
    }
  }
  
  const theme = THEMES.includes(suggestions.theme) ? suggestions.theme : THEMES[0];
  
  return {
    grid,
    enemies,
    powerUps,
    theme,
    difficulty: wave,
    description: suggestions.description || `Wave ${wave}`,
  };
}

function applySpecialFeature(grid: number[][], feature: string): void {
  const width = grid[0].length;
  const height = grid.length;
  
  switch (feature.toLowerCase()) {
    case 'corridor':
      // Create horizontal corridor
      const corridorY = Math.floor(height / 2);
      for (let x = 1; x < width - 1; x++) {
        if (grid[corridorY][x] === 2) grid[corridorY][x] = 0;
      }
      break;
      
    case 'arena':
      // Create open center area
      for (let y = 4; y < height - 4; y++) {
        for (let x = 4; x < width - 4; x++) {
          if (grid[y][x] === 2) grid[y][x] = 0;
        }
      }
      break;
      
    case 'maze':
      // Add more walls in a maze pattern
      for (let y = 2; y < height - 2; y += 2) {
        for (let x = 2; x < width - 2; x += 2) {
          if (Math.random() < 0.3 && grid[y][x] === 0) {
            grid[y][x] = 2;
          }
        }
      }
      break;
      
    case 'cross':
      // Create cross-shaped open area
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      for (let i = -2; i <= 2; i++) {
        if (grid[centerY][centerX + i] === 2) grid[centerY][centerX + i] = 0;
        if (grid[centerY + i] && grid[centerY + i][centerX] === 2) grid[centerY + i][centerX] = 0;
      }
      break;
  }
}

// Generate a complete infinite mode session
export async function generateInfiniteSession(
  startWave: number = 1,
  difficulty: 'normal' | 'hard' | 'insane' = 'normal'
): Promise<GeneratedMap[]> {
  const maps: GeneratedMap[] = [];
  
  // Pre-generate first 5 waves
  for (let wave = startWave; wave < startWave + 5; wave++) {
    try {
      const map = await generateMapWithLLM(wave, difficulty);
      maps.push(map);
    } catch {
      maps.push(generateMapFallback(wave, difficulty));
    }
  }
  
  return maps;
}
