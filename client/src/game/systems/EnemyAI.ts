// Enemy AI System - Intelligent behaviors for all enemy types with FIXED collision

import { GAME_CONFIG, TILE_TYPES } from '../constants';
import { Enemy, Player, Bomb, Tile, GridPosition, Position } from '../types';
import { findPath, gridToPixel, pixelToGrid, manhattanDistance, randomElement, normalize } from '../utils/helpers';
import { gameEngine } from '../engine/GameEngine';

export class EnemyAI {
  private grid: Tile[][] = [];
  private bombs: Bomb[] = [];
  private players: Player[] = [];
  private enemies: Enemy[] = [];

  public update(
    enemies: Enemy[],
    players: Player[],
    bombs: Bomb[],
    grid: Tile[][],
    deltaTime: number
  ): void {
    this.grid = grid;
    this.bombs = bombs;
    this.players = players;
    this.enemies = enemies;

    for (const enemy of enemies) {
      if (enemy.state === 'dying' || !enemy.active) continue;
      
      this.updateEnemy(enemy, deltaTime);
    }
  }

  private updateEnemy(enemy: Enemy, deltaTime: number): void {
    // Update state timer
    enemy.stateTimer -= deltaTime;

    // Check for danger (explosions, bombs)
    if (this.isInDanger(enemy)) {
      this.evadeDanger(enemy, deltaTime);
      return;
    }

    // Execute behavior based on enemy type
    switch (enemy.type) {
      case 'slime':
        this.slimeBehavior(enemy, deltaTime);
        break;
      case 'bat':
        this.batBehavior(enemy, deltaTime);
        break;
      case 'ghost':
        this.ghostBehavior(enemy, deltaTime);
        break;
      case 'bomber':
        this.bomberBehavior(enemy, deltaTime);
        break;
      case 'charger':
        this.chargerBehavior(enemy, deltaTime);
        break;
      case 'teleporter':
        this.teleporterBehavior(enemy, deltaTime);
        break;
      case 'shield':
        this.shieldBehavior(enemy, deltaTime);
        break;
      case 'splitter':
        this.splitterBehavior(enemy, deltaTime);
        break;
      default:
        this.slimeBehavior(enemy, deltaTime);
    }
  }

  // Slime - Random wandering movement
  private slimeBehavior(enemy: Enemy, deltaTime: number): void {
    if (enemy.state === 'idle' || enemy.stateTimer <= 0) {
      // Pick a new random direction
      const directions = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ];
      
      const validDirs = directions.filter(dir => {
        const newPos: GridPosition = {
          col: enemy.gridPosition.col + dir.x,
          row: enemy.gridPosition.row + dir.y,
        };
        return this.canEnemyWalkTo(newPos, enemy);
      });

      if (validDirs.length > 0) {
        enemy.direction = randomElement(validDirs);
        enemy.state = 'moving';
        enemy.stateTimer = 1000 + Math.random() * 2000;
      } else {
        enemy.state = 'idle';
        enemy.stateTimer = 500;
      }
    }

    this.moveEnemyWithCollision(enemy, deltaTime);
  }

  // Bat - Fast movement in patterns
  private batBehavior(enemy: Enemy, deltaTime: number): void {
    const nearestPlayer = this.findNearestPlayer(enemy);
    
    if (nearestPlayer && manhattanDistance(enemy.gridPosition, nearestPlayer.gridPosition) < 8) {
      // Move towards player in a zigzag pattern
      const dx = nearestPlayer.gridPosition.col - enemy.gridPosition.col;
      const dy = nearestPlayer.gridPosition.row - enemy.gridPosition.row;
      
      // Alternate between horizontal and vertical movement
      if (Math.floor(enemy.stateTimer / 500) % 2 === 0) {
        enemy.direction = { x: Math.sign(dx), y: 0 };
      } else {
        enemy.direction = { x: 0, y: Math.sign(dy) };
      }
      
      // Check if can move in that direction
      const nextPos = this.getNextGridPos(enemy);
      if (!this.canEnemyWalkTo(nextPos, enemy)) {
        // Try alternative direction
        enemy.direction = { x: Math.sign(dy), y: Math.sign(dx) };
      }
    } else {
      this.slimeBehavior(enemy, deltaTime);
      return;
    }

    this.moveEnemyWithCollision(enemy, deltaTime);
    enemy.stateTimer -= deltaTime;
    if (enemy.stateTimer <= 0) enemy.stateTimer = 2000;
  }

  // Ghost - Can pass through blocks (but not outer walls), moves towards player
  private ghostBehavior(enemy: Enemy, deltaTime: number): void {
    const nearestPlayer = this.findNearestPlayer(enemy);
    
    if (nearestPlayer) {
      const dx = nearestPlayer.position.x - enemy.position.x;
      const dy = nearestPlayer.position.y - enemy.position.y;
      enemy.direction = normalize({ x: dx, y: dy });
    } else {
      // Random movement when no player nearby
      if (enemy.stateTimer <= 0) {
        const directions = [
          { x: 0, y: -1 },
          { x: 0, y: 1 },
          { x: -1, y: 0 },
          { x: 1, y: 0 },
        ];
        enemy.direction = randomElement(directions);
        enemy.stateTimer = 1000 + Math.random() * 1000;
      }
    }

    this.moveEnemyWithCollision(enemy, deltaTime);
  }

  // Bomber - Places bombs and retreats
  private bomberBehavior(enemy: Enemy, deltaTime: number): void {
    const nearestPlayer = this.findNearestPlayer(enemy);
    
    if (nearestPlayer && manhattanDistance(enemy.gridPosition, nearestPlayer.gridPosition) < 5) {
      if (enemy.specialAbilityCooldown <= 0) {
        // Place bomb (emit event)
        enemy.state = 'attacking';
        enemy.specialAbilityCooldown = 5000;
        
        // Retreat after placing bomb
        const dx = enemy.gridPosition.col - nearestPlayer.gridPosition.col;
        const dy = enemy.gridPosition.row - nearestPlayer.gridPosition.row;
        enemy.direction = normalize({ x: dx, y: dy });
        enemy.stateTimer = 1500;
      } else {
        // Approach player
        const path = this.findPathToPlayer(enemy, nearestPlayer);
        if (path.length > 1) {
          const next = path[1];
          enemy.direction = {
            x: next.col - enemy.gridPosition.col,
            y: next.row - enemy.gridPosition.row,
          };
        }
      }
    } else {
      this.slimeBehavior(enemy, deltaTime);
      return;
    }

    this.moveEnemyWithCollision(enemy, deltaTime);
  }

  // Charger - Rushes at player when spotted
  private chargerBehavior(enemy: Enemy, deltaTime: number): void {
    const nearestPlayer = this.findNearestPlayer(enemy);
    
    if (enemy.state === 'attacking') {
      // Continue charging
      this.moveEnemyWithCollision(enemy, deltaTime);
      
      // Check if hit wall or reached destination
      const nextPos = this.getNextGridPos(enemy);
      if (!this.canEnemyWalkTo(nextPos, enemy)) {
        enemy.state = 'stunned';
        enemy.stateTimer = 1000;
        enemy.direction = { x: 0, y: 0 };
        enemy.speed = 3.5; // Reset speed
      }
      return;
    }

    if (enemy.state === 'stunned') {
      if (enemy.stateTimer <= 0) {
        enemy.state = 'idle';
      }
      return;
    }

    if (nearestPlayer) {
      const dx = nearestPlayer.gridPosition.col - enemy.gridPosition.col;
      const dy = nearestPlayer.gridPosition.row - enemy.gridPosition.row;
      
      // Check if player is in line of sight
      if ((dx === 0 || dy === 0) && manhattanDistance(enemy.gridPosition, nearestPlayer.gridPosition) < 6) {
        if (this.hasLineOfSight(enemy.gridPosition, nearestPlayer.gridPosition)) {
          // Start charging
          enemy.state = 'attacking';
          enemy.direction = { x: Math.sign(dx), y: Math.sign(dy) };
          enemy.speed = 6; // Boost speed
          return;
        }
      }
    }

    enemy.speed = 3.5;
    this.slimeBehavior(enemy, deltaTime);
  }

  // Teleporter - Teleports randomly when threatened
  private teleporterBehavior(enemy: Enemy, deltaTime: number): void {
    const nearestPlayer = this.findNearestPlayer(enemy);
    
    if (nearestPlayer && manhattanDistance(enemy.gridPosition, nearestPlayer.gridPosition) < 3) {
      if (enemy.specialAbilityCooldown <= 0) {
        // Teleport to random location
        const emptyTiles = this.findEmptyTiles();
        if (emptyTiles.length > 0) {
          const newPos = randomElement(emptyTiles);
          enemy.gridPosition = newPos;
          enemy.position = gridToPixel(newPos);
          enemy.bounds.x = enemy.position.x + 4;
          enemy.bounds.y = enemy.position.y + 4;
          enemy.specialAbilityCooldown = 3000;
          enemy.state = 'idle';
          enemy.stateTimer = 500;
        }
      }
    }

    this.slimeBehavior(enemy, deltaTime);
  }

  // Shield - Activates shield when in danger
  private shieldBehavior(enemy: Enemy, deltaTime: number): void {
    const nearestPlayer = this.findNearestPlayer(enemy);
    
    // Check if bomb nearby
    const nearbyBomb = this.bombs.find(bomb => 
      manhattanDistance(enemy.gridPosition, bomb.gridPosition) <= bomb.range + 1
    );

    if (nearbyBomb && enemy.specialAbilityCooldown <= 0) {
      enemy.isShielded = true;
      enemy.shieldTimer = 2000;
      enemy.specialAbilityCooldown = 5000;
    }

    if (nearestPlayer) {
      const path = this.findPathToPlayer(enemy, nearestPlayer);
      if (path.length > 1) {
        const next = path[1];
        enemy.direction = {
          x: next.col - enemy.gridPosition.col,
          y: next.row - enemy.gridPosition.row,
        };
      }
    } else {
      this.slimeBehavior(enemy, deltaTime);
      return;
    }

    this.moveEnemyWithCollision(enemy, deltaTime);
  }

  // Splitter - Splits into two when killed (handled in GameEngine)
  private splitterBehavior(enemy: Enemy, deltaTime: number): void {
    const nearestPlayer = this.findNearestPlayer(enemy);
    
    if (nearestPlayer && manhattanDistance(enemy.gridPosition, nearestPlayer.gridPosition) < 6) {
      const path = this.findPathToPlayer(enemy, nearestPlayer);
      if (path.length > 1) {
        const next = path[1];
        enemy.direction = {
          x: next.col - enemy.gridPosition.col,
          y: next.row - enemy.gridPosition.row,
        };
      }
    } else {
      this.slimeBehavior(enemy, deltaTime);
      return;
    }

    this.moveEnemyWithCollision(enemy, deltaTime);
  }

  // FIXED: Move enemy with proper collision detection
  private moveEnemyWithCollision(enemy: Enemy, deltaTime: number): void {
    const speed = enemy.speed * (deltaTime / 16.67);
    const dx = enemy.direction.x * speed;
    const dy = enemy.direction.y * speed;
    
    // Try to move using the game engine's collision system
    gameEngine.moveEnemy(enemy, enemy.direction.x, enemy.direction.y, deltaTime);
  }

  // FIXED: Check if enemy can walk to a grid position
  private canEnemyWalkTo(pos: GridPosition, enemy: Enemy): boolean {
    if (pos.row < 0 || pos.row >= this.grid.length ||
        pos.col < 0 || pos.col >= this.grid[0].length) {
      return false;
    }

    const tile = this.grid[pos.row][pos.col];
    
    // Ghosts can pass through blocks but not outer walls
    if (enemy.canPassWalls) {
      // Check if it's an outer wall (border)
      if (pos.row === 0 || pos.row === this.grid.length - 1 ||
          pos.col === 0 || pos.col === this.grid[0].length - 1) {
        return tile.type !== TILE_TYPES.WALL;
      }
      return tile.type !== TILE_TYPES.WALL;
    }
    
    // Normal enemies can't pass walls or blocks
    if (tile.type === TILE_TYPES.WALL || tile.type === TILE_TYPES.BLOCK) {
      return false;
    }
    
    // Check for bombs - enemies can't walk through bombs
    for (const bomb of this.bombs) {
      if (bomb.gridPosition.col === pos.col && bomb.gridPosition.row === pos.row) {
        return false;
      }
    }
    
    return true;
  }

  private getNextGridPos(enemy: Enemy): GridPosition {
    return {
      col: enemy.gridPosition.col + Math.sign(enemy.direction.x),
      row: enemy.gridPosition.row + Math.sign(enemy.direction.y),
    };
  }

  private findNearestPlayer(enemy: Enemy): Player | null {
    let nearest: Player | null = null;
    let minDist = Infinity;

    for (const player of this.players) {
      if (player.isDead) continue;
      const dist = manhattanDistance(enemy.gridPosition, player.gridPosition);
      if (dist < minDist) {
        minDist = dist;
        nearest = player;
      }
    }

    return nearest;
  }

  private findPathToPlayer(enemy: Enemy, player: Player): GridPosition[] {
    return findPath(
      enemy.gridPosition,
      player.gridPosition,
      (pos) => this.canEnemyWalkTo(pos, enemy),
      200
    );
  }

  private hasLineOfSight(from: GridPosition, to: GridPosition): boolean {
    const dx = Math.sign(to.col - from.col);
    const dy = Math.sign(to.row - from.row);
    
    let current = { ...from };
    
    while (current.col !== to.col || current.row !== to.row) {
      current.col += dx;
      current.row += dy;
      
      if (current.row < 0 || current.row >= this.grid.length ||
          current.col < 0 || current.col >= this.grid[0].length) {
        return false;
      }
      
      const tile = this.grid[current.row][current.col];
      if (tile.type === TILE_TYPES.WALL || tile.type === TILE_TYPES.BLOCK) {
        return false;
      }
    }
    
    return true;
  }

  private isInDanger(enemy: Enemy): boolean {
    // Check if standing on bomb explosion range
    for (const bomb of this.bombs) {
      if (manhattanDistance(enemy.gridPosition, bomb.gridPosition) <= bomb.range) {
        // Check if in line with bomb
        if (enemy.gridPosition.col === bomb.gridPosition.col ||
            enemy.gridPosition.row === bomb.gridPosition.row) {
          return true;
        }
      }
    }
    return false;
  }

  private evadeDanger(enemy: Enemy, deltaTime: number): void {
    // Find safe direction
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];

    for (const dir of directions) {
      const newPos: GridPosition = {
        col: enemy.gridPosition.col + dir.x * 2,
        row: enemy.gridPosition.row + dir.y * 2,
      };

      if (this.canEnemyWalkTo(newPos, enemy) && !this.isPositionDangerous(newPos)) {
        enemy.direction = dir;
        enemy.state = 'moving';
        this.moveEnemyWithCollision(enemy, deltaTime);
        return;
      }
    }
  }

  private isPositionDangerous(pos: GridPosition): boolean {
    for (const bomb of this.bombs) {
      if (manhattanDistance(pos, bomb.gridPosition) <= bomb.range) {
        if (pos.col === bomb.gridPosition.col || pos.row === bomb.gridPosition.row) {
          return true;
        }
      }
    }
    return false;
  }

  private findEmptyTiles(): GridPosition[] {
    const empty: GridPosition[] = [];
    
    for (let row = 1; row < this.grid.length - 1; row++) {
      for (let col = 1; col < this.grid[0].length - 1; col++) {
        if (this.grid[row][col].type === TILE_TYPES.EMPTY) {
          // Check if not near any player
          const nearPlayer = this.players.some(p => 
            manhattanDistance({ col, row }, p.gridPosition) < 3
          );
          if (!nearPlayer) {
            empty.push({ col, row });
          }
        }
      }
    }
    
    return empty;
  }
}

export const enemyAI = new EnemyAI();
