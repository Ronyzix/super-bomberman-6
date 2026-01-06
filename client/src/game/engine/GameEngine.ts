// Game Engine - Core game loop and state management with FIXED collision system

import { GAME_CONFIG, GAME_STATES, TILE_TYPES, TileType, BombType, PowerUpType } from '../constants';
import { 
  GameStateData, 
  Player, 
  Bomb, 
  Explosion, 
  Enemy, 
  PowerUp, 
  Boss, 
  Tile, 
  InputState,
  GridPosition,
  Position
} from '../types';
import { generateId, gridToPixel, pixelToGrid } from '../utils/helpers';

export class GameEngine {
  private state: GameStateData;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedDeltaTime: number = 1000 / 60; // 60 FPS
  private animationFrameId: number | null = null;
  private onStateChange: ((state: GameStateData) => void) | null = null;
  private onGameEvent: ((event: string, data: any) => void) | null = null;
  
  // Persistent player stats across levels
  private persistentPlayerStats: Map<number, {
    speed: number;
    maxBombs: number;
    fireRange: number;
    bombType: BombType;
    powerUps: PowerUpType[];
  }> = new Map();

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameStateData {
    return {
      state: GAME_STATES.MENU,
      currentWorld: 1,
      currentLevel: 1,
      players: [],
      bombs: [],
      explosions: [],
      enemies: [],
      powerUps: [],
      boss: null,
      grid: [],
      score: 0,
      time: 0,
      isPaused: false,
      isMultiplayer: false,
    };
  }

  public init(options: { isMultiplayer?: boolean; roomId?: string } = {}): void {
    this.state = this.createInitialState();
    this.state.isMultiplayer = options.isMultiplayer || false;
    this.state.roomId = options.roomId;
  }

  public setStateChangeCallback(callback: (state: GameStateData) => void): void {
    this.onStateChange = callback;
  }

  public setGameEventCallback(callback: (event: string, data: any) => void): void {
    this.onGameEvent = callback;
  }

  public getState(): GameStateData {
    return this.state;
  }

  public setState(newState: Partial<GameStateData>): void {
    this.state = { ...this.state, ...newState };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  private emitEvent(event: string, data: any): void {
    if (this.onGameEvent) {
      this.onGameEvent(event, data);
    }
  }

  // Save player stats before level transition
  public savePlayerStats(): void {
    for (const player of this.state.players) {
      this.persistentPlayerStats.set(player.playerIndex, {
        speed: player.speed,
        maxBombs: player.maxBombs,
        fireRange: player.fireRange,
        bombType: player.bombType,
        powerUps: [...player.powerUps],
      });
    }
  }

  // Restore player stats after level transition
  public restorePlayerStats(player: Player): void {
    const savedStats = this.persistentPlayerStats.get(player.playerIndex);
    if (savedStats) {
      player.speed = savedStats.speed;
      player.maxBombs = savedStats.maxBombs;
      player.fireRange = savedStats.fireRange;
      player.bombType = savedStats.bombType;
      player.powerUps = [...savedStats.powerUps];
    }
  }

  // Grid Management
  public initGrid(width: number = GAME_CONFIG.GRID_WIDTH, height: number = GAME_CONFIG.GRID_HEIGHT): Tile[][] {
    const grid: Tile[][] = [];
    
    for (let row = 0; row < height; row++) {
      grid[row] = [];
      for (let col = 0; col < width; col++) {
        const isWall = row === 0 || row === height - 1 || col === 0 || col === width - 1 ||
                       (row % 2 === 0 && col % 2 === 0);
        
        grid[row][col] = {
          type: isWall ? TILE_TYPES.WALL : TILE_TYPES.EMPTY,
          position: { col, row },
          destructible: false,
          hasPowerUp: false,
        };
      }
    }
    
    return grid;
  }

  public loadLevel(levelData: { grid: number[][], enemies: any[], boss?: any }): void {
    const grid: Tile[][] = [];
    
    for (let row = 0; row < levelData.grid.length; row++) {
      grid[row] = [];
      for (let col = 0; col < levelData.grid[row].length; col++) {
        const tileType = levelData.grid[row][col] as TileType;
        const isDestructible = tileType === TILE_TYPES.BLOCK;
        const hasPowerUp = isDestructible && Math.random() < GAME_CONFIG.POWERUP_SPAWN_CHANCE;
        
        grid[row][col] = {
          type: tileType,
          position: { col, row },
          destructible: isDestructible,
          hasPowerUp,
        };
      }
    }
    
    this.state.grid = grid;
    this.state.enemies = [];
    this.state.bombs = [];
    this.state.explosions = [];
    this.state.powerUps = [];
    
    // Spawn enemies
    levelData.enemies.forEach(spawn => {
      this.spawnEnemy(spawn.type, spawn.position);
    });
    
    this.notifyStateChange();
  }

  // Player Management
  public createPlayer(playerIndex: number, startPosition: GridPosition): Player {
    const colors = ['#FF6B35', '#4ECDC4', '#FFE66D', '#FF4757'];
    const pixelPos = gridToPixel(startPosition);
    
    const player: Player = {
      id: generateId(),
      position: pixelPos,
      gridPosition: startPosition,
      bounds: {
        x: pixelPos.x,
        y: pixelPos.y,
        width: GAME_CONFIG.TILE_SIZE * 0.75,
        height: GAME_CONFIG.TILE_SIZE * 0.75,
      },
      active: true,
      lives: GAME_CONFIG.PLAYER_LIVES,
      speed: GAME_CONFIG.PLAYER_SPEED,
      bombCount: GAME_CONFIG.BOMB_DEFAULT_COUNT,
      maxBombs: GAME_CONFIG.BOMB_DEFAULT_COUNT,
      fireRange: GAME_CONFIG.BOMB_DEFAULT_RANGE,
      activeBombs: 0,
      powerUps: [],
      bombType: 'normal',
      isInvincible: false,
      invincibilityTimer: 0,
      direction: 'down',
      isMoving: false,
      isDead: false,
      score: 0,
      kills: 0,
      animationFrame: 0,
      color: colors[playerIndex % colors.length],
      playerIndex,
    };
    
    // Restore persistent stats if available
    this.restorePlayerStats(player);
    
    return player;
  }

  public addPlayer(player: Player): void {
    this.state.players.push(player);
    this.notifyStateChange();
  }

  public updatePlayer(playerId: string, updates: Partial<Player>): void {
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
      this.state.players[playerIndex] = { ...this.state.players[playerIndex], ...updates };
      this.notifyStateChange();
    }
  }

  // FIXED: Improved collision detection for player movement
  public movePlayer(playerId: string, input: InputState, deltaTime: number): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player || player.isDead) return;

    let dx = 0;
    let dy = 0;
    
    if (input.up) dy = -1;
    if (input.down) dy = 1;
    if (input.left) dx = -1;
    if (input.right) dx = 1;
    
    if (dx !== 0 || dy !== 0) {
      player.isMoving = true;
      
      // Update direction
      if (dy < 0) player.direction = 'up';
      else if (dy > 0) player.direction = 'down';
      else if (dx < 0) player.direction = 'left';
      else if (dx > 0) player.direction = 'right';
      
      // Calculate new position with proper speed scaling
      const speed = player.speed * (deltaTime / 16.67);
      
      // Move X and Y separately for better collision handling
      if (dx !== 0) {
        const newX = player.position.x + dx * speed;
        if (this.canMoveToPosition(newX, player.position.y, player)) {
          player.position.x = newX;
        } else {
          // Slide along walls - try to align to grid
          const alignedX = this.getAlignedPosition(player.position.x, dx);
          if (this.canMoveToPosition(alignedX, player.position.y, player)) {
            player.position.x = alignedX;
          }
        }
      }
      
      if (dy !== 0) {
        const newY = player.position.y + dy * speed;
        if (this.canMoveToPosition(player.position.x, newY, player)) {
          player.position.y = newY;
        } else {
          // Slide along walls - try to align to grid
          const alignedY = this.getAlignedPosition(player.position.y, dy);
          if (this.canMoveToPosition(player.position.x, alignedY, player)) {
            player.position.y = alignedY;
          }
        }
      }
      
      // Update grid position and bounds
      player.gridPosition = pixelToGrid(player.position);
      player.bounds.x = player.position.x;
      player.bounds.y = player.position.y;
    } else {
      player.isMoving = false;
    }
    
    // Handle bomb placement
    if (input.bomb) {
      this.placeBomb(player);
    }
    
    // Handle remote detonation
    if (input.detonate && player.bombType === 'remote') {
      this.detonateRemoteBombs(player.id);
    }
  }

  private getAlignedPosition(pos: number, direction: number): number {
    const tileSize = GAME_CONFIG.TILE_SIZE;
    if (direction > 0) {
      return Math.floor(pos / tileSize) * tileSize;
    } else {
      return Math.ceil(pos / tileSize) * tileSize;
    }
  }

  // FIXED: Comprehensive collision detection
  private canMoveToPosition(x: number, y: number, player: Player): boolean {
    const margin = 2; // Small margin for smoother movement
    const size = player.bounds.width;
    
    // Check all four corners of the player hitbox
    const corners = [
      { x: x + margin, y: y + margin },
      { x: x + size - margin, y: y + margin },
      { x: x + margin, y: y + size - margin },
      { x: x + size - margin, y: y + size - margin },
    ];
    
    for (const corner of corners) {
      const gridPos = pixelToGrid(corner);
      
      // Check grid bounds
      if (gridPos.row < 0 || gridPos.row >= this.state.grid.length ||
          gridPos.col < 0 || gridPos.col >= this.state.grid[0].length) {
        return false;
      }
      
      // Check tile collision
      const tile = this.state.grid[gridPos.row][gridPos.col];
      if (tile.type === TILE_TYPES.WALL || tile.type === TILE_TYPES.BLOCK) {
        return false;
      }
    }
    
    // Check bomb collision - player can walk through their own bomb only if they're still on it
    const playerCenterX = x + size / 2;
    const playerCenterY = y + size / 2;
    const playerGridPos = pixelToGrid({ x: playerCenterX, y: playerCenterY });
    
    for (const bomb of this.state.bombs) {
      // Skip if player is the owner and still on the bomb
      if (bomb.ownerId === player.id) {
        const playerCurrentGrid = player.gridPosition;
        if (playerCurrentGrid.col === bomb.gridPosition.col && 
            playerCurrentGrid.row === bomb.gridPosition.row) {
          continue; // Allow walking through own bomb if still on it
        }
      }
      
      // Check if any corner would collide with the bomb
      for (const corner of corners) {
        const cornerGrid = pixelToGrid(corner);
        if (cornerGrid.col === bomb.gridPosition.col && 
            cornerGrid.row === bomb.gridPosition.row) {
          return false;
        }
      }
    }
    
    return true;
  }

  // Bomb Management
  public placeBomb(player: Player): Bomb | null {
    if (player.activeBombs >= player.maxBombs) return null;
    
    const gridPos = player.gridPosition;
    
    // Check if there's already a bomb at this position
    const existingBomb = this.state.bombs.find(b => 
      b.gridPosition.col === gridPos.col && b.gridPosition.row === gridPos.row
    );
    if (existingBomb) return null;
    
    const pixelPos = gridToPixel(gridPos);
    
    const bomb: Bomb = {
      id: generateId(),
      position: pixelPos,
      gridPosition: gridPos,
      bounds: {
        x: pixelPos.x,
        y: pixelPos.y,
        width: GAME_CONFIG.TILE_SIZE,
        height: GAME_CONFIG.TILE_SIZE,
      },
      active: true,
      type: player.bombType,
      range: player.fireRange,
      timer: player.bombType === 'remote' ? Infinity : GAME_CONFIG.BOMB_TIMER,
      ownerId: player.id,
      isDetonated: false,
      animationFrame: 0,
    };
    
    this.state.bombs.push(bomb);
    player.activeBombs++;
    
    this.emitEvent('bombPlaced', { bomb, player });
    this.notifyStateChange();
    
    return bomb;
  }

  public detonateRemoteBombs(playerId: string): void {
    const remoteBombs = this.state.bombs.filter(b => 
      b.ownerId === playerId && b.type === 'remote' && !b.isDetonated
    );
    
    remoteBombs.forEach(bomb => {
      this.explodeBomb(bomb);
    });
  }

  public explodeBomb(bomb: Bomb): void {
    if (bomb.isDetonated) return;
    
    bomb.isDetonated = true;
    
    // Create explosions
    this.createExplosion(bomb.gridPosition, bomb.range, bomb.type === 'penetrating');
    
    // Update player's active bomb count
    const player = this.state.players.find(p => p.id === bomb.ownerId);
    if (player) {
      player.activeBombs = Math.max(0, player.activeBombs - 1);
    }
    
    // Remove bomb
    this.state.bombs = this.state.bombs.filter(b => b.id !== bomb.id);
    
    this.emitEvent('bombExploded', { bomb });
    this.notifyStateChange();
  }

  private createExplosion(center: GridPosition, range: number, penetrating: boolean): void {
    const directions = [
      { dx: 0, dy: -1, dir: 'up' as const },
      { dx: 0, dy: 1, dir: 'down' as const },
      { dx: -1, dy: 0, dir: 'left' as const },
      { dx: 1, dy: 0, dir: 'right' as const },
    ];
    
    // Center explosion
    this.addExplosionTile(center, 'center', false);
    
    // Directional explosions
    for (const { dx, dy, dir } of directions) {
      for (let i = 1; i <= range; i++) {
        const pos: GridPosition = {
          col: center.col + dx * i,
          row: center.row + dy * i,
        };
        
        if (!this.isValidPosition(pos)) break;
        
        const tile = this.state.grid[pos.row][pos.col];
        
        // Stop at walls
        if (tile.type === TILE_TYPES.WALL) break;
        
        const isEnd = i === range;
        this.addExplosionTile(pos, dir, isEnd);
        
        // Stop at blocks (after creating explosion on the block)
        if (tile.type === TILE_TYPES.BLOCK) {
          this.destroyBlock(pos);
          if (!penetrating) break;
        }
        
        // Chain reaction with other bombs
        const chainBomb = this.state.bombs.find(b => 
          b.gridPosition.col === pos.col && b.gridPosition.row === pos.row && !b.isDetonated
        );
        if (chainBomb) {
          setTimeout(() => this.explodeBomb(chainBomb), 50);
        }
      }
    }
  }

  private addExplosionTile(pos: GridPosition, direction: 'center' | 'up' | 'down' | 'left' | 'right', isEnd: boolean): void {
    const pixelPos = gridToPixel(pos);
    
    const explosion: Explosion = {
      id: generateId(),
      position: pixelPos,
      gridPosition: pos,
      bounds: {
        x: pixelPos.x + 4,
        y: pixelPos.y + 4,
        width: GAME_CONFIG.TILE_SIZE - 8,
        height: GAME_CONFIG.TILE_SIZE - 8,
      },
      active: true,
      range: 0,
      direction,
      isEnd,
      timer: GAME_CONFIG.EXPLOSION_DURATION,
      animationFrame: 0,
    };
    
    this.state.explosions.push(explosion);
  }

  private destroyBlock(pos: GridPosition): void {
    const tile = this.state.grid[pos.row][pos.col];
    tile.type = TILE_TYPES.EMPTY;
    tile.destructible = false;
    
    // Spawn power-up if the block had one
    if (tile.hasPowerUp) {
      this.spawnPowerUp(pos);
      tile.hasPowerUp = false;
    }
    
    this.emitEvent('blockDestroyed', { position: pos });
  }

  private isValidPosition(pos: GridPosition): boolean {
    return pos.row >= 0 && pos.row < this.state.grid.length &&
           pos.col >= 0 && pos.col < this.state.grid[0].length;
  }

  // Power-up Management
  private spawnPowerUp(pos: GridPosition): void {
    const types = ['speed', 'bomb_count', 'fire_range', 'power_bomb', 'remote_bomb', 'line_bomb'] as const;
    const weights = [0.25, 0.25, 0.25, 0.1, 0.1, 0.05];
    
    let random = Math.random();
    let type: typeof types[number] = types[0];
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        type = types[i];
        break;
      }
    }
    
    const pixelPos = gridToPixel(pos);
    
    const powerUp: PowerUp = {
      id: generateId(),
      position: pixelPos,
      gridPosition: pos,
      bounds: {
        x: pixelPos.x + 8,
        y: pixelPos.y + 8,
        width: GAME_CONFIG.TILE_SIZE - 16,
        height: GAME_CONFIG.TILE_SIZE - 16,
      },
      active: true,
      type,
      animationFrame: 0,
    };
    
    this.state.powerUps.push(powerUp);
    this.emitEvent('powerUpSpawned', { powerUp });
  }

  public collectPowerUp(player: Player, powerUp: PowerUp): void {
    switch (powerUp.type) {
      case 'speed':
        player.speed = Math.min(player.speed + 0.5, GAME_CONFIG.PLAYER_MAX_SPEED);
        break;
      case 'bomb_count':
        player.maxBombs = Math.min(player.maxBombs + 1, GAME_CONFIG.BOMB_MAX_COUNT);
        break;
      case 'fire_range':
        player.fireRange = Math.min(player.fireRange + 1, GAME_CONFIG.BOMB_MAX_RANGE);
        break;
      case 'power_bomb':
        player.bombType = 'penetrating';
        player.powerUps.push('power_bomb');
        break;
      case 'remote_bomb':
        player.bombType = 'remote';
        player.powerUps.push('remote_bomb');
        break;
      case 'line_bomb':
        player.bombType = 'line';
        player.powerUps.push('line_bomb');
        break;
    }
    
    powerUp.active = false;
    this.state.powerUps = this.state.powerUps.filter(p => p.id !== powerUp.id);
    
    this.emitEvent('powerUpCollected', { player, powerUp });
    this.notifyStateChange();
  }

  // Enemy Management
  public spawnEnemy(type: string, pos: GridPosition): Enemy {
    const pixelPos = gridToPixel(pos);
    const enemyConfigs: Record<string, Partial<Enemy>> = {
      slime: { speed: 1.2, health: 1, points: 100, canPassWalls: false },
      bat: { speed: 2.5, health: 1, points: 200, canPassWalls: false },
      ghost: { speed: 1.8, health: 1, points: 300, canPassWalls: true },
      bomber: { speed: 1.2, health: 2, points: 400, canPlaceBombs: true },
      charger: { speed: 3.5, health: 1, points: 300, canPassWalls: false },
      teleporter: { speed: 1, health: 1, points: 500, canPassWalls: false },
      shield: { speed: 1.2, health: 2, points: 400, isShielded: true },
      splitter: { speed: 1.5, health: 1, points: 250, canPassWalls: false },
    };
    
    const config = enemyConfigs[type] || enemyConfigs.slime;
    
    const enemy: Enemy = {
      id: generateId(),
      position: pixelPos,
      gridPosition: pos,
      bounds: {
        x: pixelPos.x + 4,
        y: pixelPos.y + 4,
        width: GAME_CONFIG.TILE_SIZE * 0.7,
        height: GAME_CONFIG.TILE_SIZE * 0.7,
      },
      active: true,
      type: type as any,
      health: config.health || 1,
      speed: config.speed || 2,
      direction: { x: 0, y: 0 },
      targetPosition: null,
      state: 'idle',
      stateTimer: 0,
      animationFrame: 0,
      canPassWalls: config.canPassWalls || false,
      canPlaceBombs: config.canPlaceBombs || false,
      isShielded: config.isShielded || false,
      shieldTimer: 0,
      specialAbilityCooldown: 0,
      points: config.points || 100,
    };
    
    this.state.enemies.push(enemy);
    return enemy;
  }

  // FIXED: Enemy movement with proper collision
  public moveEnemy(enemy: Enemy, dx: number, dy: number, deltaTime: number): void {
    if (enemy.state === 'dying') return;
    
    const speed = enemy.speed * (deltaTime / 16.67);
    const newX = enemy.position.x + dx * speed;
    const newY = enemy.position.y + dy * speed;
    
    // Check if enemy can move to new position
    if (this.canEnemyMoveTo(newX, enemy.position.y, enemy)) {
      enemy.position.x = newX;
    }
    if (this.canEnemyMoveTo(enemy.position.x, newY, enemy)) {
      enemy.position.y = newY;
    }
    
    // Update grid position and bounds
    enemy.gridPosition = pixelToGrid(enemy.position);
    enemy.bounds.x = enemy.position.x + 4;
    enemy.bounds.y = enemy.position.y + 4;
  }

  // FIXED: Enemy collision detection
  private canEnemyMoveTo(x: number, y: number, enemy: Enemy): boolean {
    const margin = 4;
    const size = enemy.bounds.width;
    
    // Check corners
    const corners = [
      { x: x + margin, y: y + margin },
      { x: x + size - margin + 4, y: y + margin },
      { x: x + margin, y: y + size - margin + 4 },
      { x: x + size - margin + 4, y: y + size - margin + 4 },
    ];
    
    for (const corner of corners) {
      const gridPos = pixelToGrid(corner);
      
      // Check bounds
      if (gridPos.row < 0 || gridPos.row >= this.state.grid.length ||
          gridPos.col < 0 || gridPos.col >= this.state.grid[0].length) {
        return false;
      }
      
      const tile = this.state.grid[gridPos.row][gridPos.col];
      
      // Ghosts can pass through walls and blocks
      if (enemy.canPassWalls) {
        if (tile.type === TILE_TYPES.WALL) {
          return false; // Even ghosts can't go through outer walls
        }
        continue;
      }
      
      // Normal enemies can't pass walls or blocks
      if (tile.type === TILE_TYPES.WALL || tile.type === TILE_TYPES.BLOCK) {
        return false;
      }
    }
    
    // Check bomb collision for enemies (they can't pass through bombs)
    if (!enemy.canPassWalls) {
      for (const bomb of this.state.bombs) {
        for (const corner of corners) {
          const cornerGrid = pixelToGrid(corner);
          if (cornerGrid.col === bomb.gridPosition.col && 
              cornerGrid.row === bomb.gridPosition.row) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  public killEnemy(enemy: Enemy, killer: Player | null): void {
    enemy.state = 'dying';
    enemy.active = false;
    
    if (killer) {
      killer.score += enemy.points;
      killer.kills++;
    }
    
    this.state.score += enemy.points;
    
    // Handle splitter enemy
    if (enemy.type === 'splitter' && enemy.health <= 0) {
      const offsets = [{ dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
      offsets.forEach(offset => {
        const newPos: GridPosition = {
          col: enemy.gridPosition.col + offset.dx,
          row: enemy.gridPosition.row + offset.dy,
        };
        if (this.isValidPosition(newPos) && this.state.grid[newPos.row][newPos.col].type === TILE_TYPES.EMPTY) {
          const miniSlime = this.spawnEnemy('slime', newPos);
          miniSlime.speed *= 1.5;
          miniSlime.points = 50;
        }
      });
    }
    
    this.state.enemies = this.state.enemies.filter(e => e.id !== enemy.id);
    
    this.emitEvent('enemyKilled', { enemy, killer });
    this.notifyStateChange();
  }

  // FIXED: Collision Detection
  public checkCollisions(): void {
    // Player vs Explosion
    for (const player of this.state.players) {
      if (player.isDead || player.isInvincible) continue;
      
      for (const explosion of this.state.explosions) {
        if (this.checkBoundsCollision(player.bounds, explosion.bounds)) {
          this.damagePlayer(player);
          break;
        }
      }
      
      // Player vs Enemy
      for (const enemy of this.state.enemies) {
        if (enemy.state === 'dying') continue;
        if (this.checkBoundsCollision(player.bounds, enemy.bounds)) {
          this.damagePlayer(player);
          break;
        }
      }
      
      // Player vs Power-up
      for (const powerUp of this.state.powerUps) {
        if (this.checkBoundsCollision(player.bounds, powerUp.bounds)) {
          this.collectPowerUp(player, powerUp);
        }
      }
      
      // Player vs Boss
      if (this.state.boss && this.state.boss.active) {
        if (this.checkBoundsCollision(player.bounds, this.state.boss.bounds)) {
          this.damagePlayer(player);
        }
      }
    }
    
    // Enemy vs Explosion
    for (const enemy of this.state.enemies) {
      if (enemy.state === 'dying') continue;
      if (enemy.isShielded && enemy.shieldTimer > 0) continue;
      
      for (const explosion of this.state.explosions) {
        if (this.checkBoundsCollision(enemy.bounds, explosion.bounds)) {
          enemy.health--;
          if (enemy.isShielded) {
            enemy.shieldTimer = 2000; // Shield cooldown
          }
          if (enemy.health <= 0) {
            // Find the player who placed the bomb that caused this explosion
            const killer = this.state.players[0]; // Default to first player
            this.killEnemy(enemy, killer);
          }
          break;
        }
      }
    }
    
    // Boss vs Explosion
    if (this.state.boss && this.state.boss.active) {
      for (const explosion of this.state.explosions) {
        if (this.checkBoundsCollision(this.state.boss.bounds, explosion.bounds)) {
          this.damageBoss();
          break;
        }
      }
    }
  }

  private checkBoundsCollision(a: { x: number; y: number; width: number; height: number }, 
                                b: { x: number; y: number; width: number; height: number }): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  private damagePlayer(player: Player): void {
    if (player.isInvincible) return;
    
    player.lives--;
    player.isInvincible = true;
    player.invincibilityTimer = GAME_CONFIG.PLAYER_INVINCIBILITY_TIME;
    
    this.emitEvent('playerDamaged', { player });
    
    if (player.lives <= 0) {
      player.isDead = true;
      this.emitEvent('playerDied', { player });
      
      // Check game over
      const alivePlayers = this.state.players.filter(p => !p.isDead);
      if (alivePlayers.length === 0) {
        this.setState({ state: GAME_STATES.GAME_OVER });
        this.emitEvent('gameOver', { score: this.state.score });
      }
    }
    
    this.notifyStateChange();
  }

  private damageBoss(): void {
    if (!this.state.boss) return;
    
    this.state.boss.health--;
    this.emitEvent('bossDamaged', { boss: this.state.boss });
    
    if (this.state.boss.health <= 0) {
      this.state.boss.active = false;
      this.state.score += this.state.boss.points;
      this.emitEvent('bossDefeated', { boss: this.state.boss });
    }
  }

  // Game Loop
  public start(): void {
    this.setState({ state: GAME_STATES.PLAYING });
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  public pause(): void {
    this.setState({ isPaused: true, state: GAME_STATES.PAUSED });
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resume(): void {
    this.setState({ isPaused: false, state: GAME_STATES.PLAYING });
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  public stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.setState({ state: GAME_STATES.MENU });
  }

  private gameLoop(currentTime: number): void {
    if (this.state.isPaused || this.state.state !== GAME_STATES.PLAYING) return;
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulator += deltaTime;
    
    // Fixed timestep updates
    while (this.accumulator >= this.fixedDeltaTime) {
      this.update(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }
    
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(deltaTime: number): void {
    // Update game time
    this.state.time += deltaTime;
    
    // Update bombs
    this.updateBombs(deltaTime);
    
    // Update explosions
    this.updateExplosions(deltaTime);
    
    // Update enemies
    this.updateEnemies(deltaTime);
    
    // Update players
    this.updatePlayers(deltaTime);
    
    // Update boss
    this.updateBoss(deltaTime);
    
    // Check collisions
    this.checkCollisions();
    
    // Check level completion
    this.checkLevelCompletion();
    
    this.notifyStateChange();
  }

  private updateBombs(deltaTime: number): void {
    for (const bomb of this.state.bombs) {
      if (bomb.type !== 'remote') {
        bomb.timer -= deltaTime;
        if (bomb.timer <= 0) {
          this.explodeBomb(bomb);
        }
      }
      
      // Animation
      bomb.animationFrame = (bomb.animationFrame + deltaTime * 0.01) % 4;
    }
  }

  private updateExplosions(deltaTime: number): void {
    for (const explosion of this.state.explosions) {
      explosion.timer -= deltaTime;
      explosion.animationFrame = (explosion.animationFrame + deltaTime * 0.02) % 4;
    }
    
    this.state.explosions = this.state.explosions.filter(e => e.timer > 0);
  }

  private updateEnemies(deltaTime: number): void {
    for (const enemy of this.state.enemies) {
      enemy.animationFrame = (enemy.animationFrame + deltaTime * 0.01) % 4;
      
      if (enemy.isShielded && enemy.shieldTimer > 0) {
        enemy.shieldTimer -= deltaTime;
      }
      
      if (enemy.specialAbilityCooldown > 0) {
        enemy.specialAbilityCooldown -= deltaTime;
      }
    }
  }

  private updatePlayers(deltaTime: number): void {
    for (const player of this.state.players) {
      if (player.isInvincible) {
        player.invincibilityTimer -= deltaTime;
        if (player.invincibilityTimer <= 0) {
          player.isInvincible = false;
        }
      }
      
      // Animation
      if (player.isMoving) {
        player.animationFrame = (player.animationFrame + deltaTime * 0.015) % 4;
      } else {
        player.animationFrame = 0;
      }
    }
  }

  private updateBoss(deltaTime: number): void {
    if (!this.state.boss || !this.state.boss.active) return;
    
    this.state.boss.animationFrame = (this.state.boss.animationFrame + deltaTime * 0.01) % 4;
    
    if (this.state.boss.attackCooldown > 0) {
      this.state.boss.attackCooldown -= deltaTime;
    }
  }

  private checkLevelCompletion(): void {
    const allEnemiesDefeated = this.state.enemies.length === 0;
    const bossDefeated = !this.state.boss || !this.state.boss.active;
    
    if (allEnemiesDefeated && bossDefeated) {
      // Save player stats before level transition
      this.savePlayerStats();
      
      this.setState({ state: GAME_STATES.VICTORY });
      this.emitEvent('levelComplete', { 
        level: this.state.currentLevel, 
        score: this.state.score,
        time: this.state.time 
      });
    }
  }

  // Cleanup
  public destroy(): void {
    this.stop();
    this.state = this.createInitialState();
    this.onStateChange = null;
    this.onGameEvent = null;
  }
}

export const gameEngine = new GameEngine();
