// Boss System - Epic boss fights with complex attack patterns

import { GAME_CONFIG, TILE_TYPES } from '../../constants';
import { Boss, Player, Bomb, Tile, GridPosition, Position } from '../../types';
import { generateId, gridToPixel, pixelToGrid, manhattanDistance, randomElement } from '../../utils/helpers';

export interface BossConfig {
  name: string;
  maxHealth: number;
  maxPhases: number;
  attackPatterns: string[];
  vulnerabilityDuration: number;
  attackCooldown: number;
  size: number; // in tiles
  dialogue: { speaker: string; text: string }[];
}

const BOSS_CONFIGS: Record<string, BossConfig> = {
  king_slime: {
    name: 'King Slime',
    maxHealth: 10,
    maxPhases: 2,
    attackPatterns: ['jump', 'spawn_minions', 'slam'],
    vulnerabilityDuration: 3000,
    attackCooldown: 2000,
    size: 3,
    dialogue: [],
  },
  dark_knight: {
    name: 'Dark Knight',
    maxHealth: 15,
    maxPhases: 3,
    attackPatterns: ['charge', 'sword_wave', 'shield_bash', 'bomb_throw'],
    vulnerabilityDuration: 2500,
    attackCooldown: 1800,
    size: 3,
    dialogue: [],
  },
  fire_dragon: {
    name: 'Fire Dragon',
    maxHealth: 20,
    maxPhases: 3,
    attackPatterns: ['fire_breath', 'tail_sweep', 'dive_bomb', 'summon_flames'],
    vulnerabilityDuration: 2000,
    attackCooldown: 1500,
    size: 4,
    dialogue: [],
  },
  shadow_lord: {
    name: 'Shadow Lord',
    maxHealth: 25,
    maxPhases: 4,
    attackPatterns: ['shadow_clone', 'dark_wave', 'teleport_strike', 'void_zone'],
    vulnerabilityDuration: 1800,
    attackCooldown: 1200,
    size: 3,
    dialogue: [],
  },
  demon_king: {
    name: 'Demon King',
    maxHealth: 40,
    maxPhases: 5,
    attackPatterns: ['hellfire', 'demon_summon', 'meteor_strike', 'dark_explosion', 'ultimate_doom'],
    vulnerabilityDuration: 1500,
    attackCooldown: 1000,
    size: 4,
    dialogue: [],
  },
};

export class BossSystem {
  private boss: Boss | null = null;
  private grid: Tile[][] = [];
  private players: Player[] = [];
  private onAttack: ((attack: BossAttack) => void) | null = null;
  private onPhaseChange: ((phase: number) => void) | null = null;
  private onDefeated: (() => void) | null = null;
  private onDialogue: ((line: { speaker: string; text: string }) => void) | null = null;

  public createBoss(type: string, position: GridPosition, dialogue: { speaker: string; text: string }[]): Boss {
    const config = BOSS_CONFIGS[type] || BOSS_CONFIGS.king_slime;
    const pixelPos = gridToPixel(position);
    const size = config.size * GAME_CONFIG.TILE_SIZE;

    this.boss = {
      id: generateId(),
      position: pixelPos,
      gridPosition: position,
      bounds: {
        x: pixelPos.x,
        y: pixelPos.y,
        width: size,
        height: size,
      },
      active: true,
      name: config.name,
      health: config.maxHealth,
      maxHealth: config.maxHealth,
      phase: 1,
      maxPhases: config.maxPhases,
      attackPattern: config.attackPatterns[0],
      attackTimer: 0,
      attackCooldown: config.attackCooldown,
      isVulnerable: false,
      vulnerabilityTimer: 0,
      state: 'intro',
      animationFrame: 0,
      dialogue: dialogue.map(d => d.text),
      currentDialogue: 0,
      points: config.maxHealth * 500,
    };

    return this.boss;
  }

  public setCallbacks(callbacks: {
    onAttack?: (attack: BossAttack) => void;
    onPhaseChange?: (phase: number) => void;
    onDefeated?: () => void;
    onDialogue?: (line: { speaker: string; text: string }) => void;
  }): void {
    this.onAttack = callbacks.onAttack || null;
    this.onPhaseChange = callbacks.onPhaseChange || null;
    this.onDefeated = callbacks.onDefeated || null;
    this.onDialogue = callbacks.onDialogue || null;
  }

  public update(boss: Boss, players: Player[], grid: Tile[][], deltaTime: number): void {
    if (!boss || !boss.active) return;

    this.boss = boss;
    this.grid = grid;
    this.players = players;

    // Update animation
    boss.animationFrame = (boss.animationFrame + deltaTime * 0.01) % 4;

    switch (boss.state) {
      case 'intro':
        this.handleIntro(boss, deltaTime);
        break;
      case 'idle':
        this.handleIdle(boss, deltaTime);
        break;
      case 'attacking':
        this.handleAttacking(boss, deltaTime);
        break;
      case 'vulnerable':
        this.handleVulnerable(boss, deltaTime);
        break;
      case 'transition':
        this.handleTransition(boss, deltaTime);
        break;
      case 'dying':
        this.handleDying(boss, deltaTime);
        break;
    }
  }

  private handleIntro(boss: Boss, deltaTime: number): void {
    // Show dialogue
    if (boss.currentDialogue < boss.dialogue.length) {
      if (this.onDialogue) {
        this.onDialogue({ speaker: boss.name, text: boss.dialogue[boss.currentDialogue] });
      }
      boss.currentDialogue++;
    } else {
      boss.state = 'idle';
      boss.attackTimer = boss.attackCooldown;
    }
  }

  private handleIdle(boss: Boss, deltaTime: number): void {
    boss.attackTimer -= deltaTime;

    if (boss.attackTimer <= 0) {
      // Select attack pattern based on phase
      const bossType = this.getBossType(boss.name);
      const config = BOSS_CONFIGS[bossType];
      const availablePatterns = config.attackPatterns.slice(0, boss.phase + 1);
      boss.attackPattern = randomElement(availablePatterns);
      boss.state = 'attacking';
    }
  }

  private handleAttacking(boss: Boss, deltaTime: number): void {
    const attack = this.executeAttack(boss);
    
    if (attack && this.onAttack) {
      this.onAttack(attack);
    }

    // After attack, become vulnerable
    boss.state = 'vulnerable';
    boss.isVulnerable = true;
    const bossType = this.getBossType(boss.name);
    boss.vulnerabilityTimer = BOSS_CONFIGS[bossType].vulnerabilityDuration;
  }

  private handleVulnerable(boss: Boss, deltaTime: number): void {
    boss.vulnerabilityTimer -= deltaTime;

    if (boss.vulnerabilityTimer <= 0) {
      boss.isVulnerable = false;
      boss.state = 'idle';
      boss.attackTimer = boss.attackCooldown;
    }
  }

  private handleTransition(boss: Boss, deltaTime: number): void {
    // Phase transition animation
    boss.attackTimer -= deltaTime;

    if (boss.attackTimer <= 0) {
      boss.state = 'idle';
      boss.attackTimer = boss.attackCooldown;
      
      if (this.onPhaseChange) {
        this.onPhaseChange(boss.phase);
      }
    }
  }

  private handleDying(boss: Boss, deltaTime: number): void {
    boss.attackTimer -= deltaTime;

    if (boss.attackTimer <= 0) {
      boss.state = 'defeated';
      boss.active = false;
      
      if (this.onDefeated) {
        this.onDefeated();
      }
    }
  }

  public damageBoss(damage: number = 1): void {
    if (!this.boss || !this.boss.isVulnerable) return;

    this.boss.health -= damage;

    // Check for phase transition
    const healthPercent = this.boss.health / this.boss.maxHealth;
    const phaseThreshold = 1 - (this.boss.phase / this.boss.maxPhases);

    if (healthPercent <= phaseThreshold && this.boss.phase < this.boss.maxPhases) {
      this.boss.phase++;
      this.boss.state = 'transition';
      this.boss.attackTimer = 2000;
      this.boss.isVulnerable = false;
    }

    // Check for death
    if (this.boss.health <= 0) {
      this.boss.state = 'dying';
      this.boss.attackTimer = 3000;
      this.boss.isVulnerable = false;
    }
  }

  private executeAttack(boss: Boss): BossAttack | null {
    const nearestPlayer = this.findNearestPlayer();
    if (!nearestPlayer) return null;

    switch (boss.attackPattern) {
      case 'jump':
        return this.attackJump(boss, nearestPlayer);
      case 'spawn_minions':
        return this.attackSpawnMinions(boss);
      case 'slam':
        return this.attackSlam(boss);
      case 'charge':
        return this.attackCharge(boss, nearestPlayer);
      case 'sword_wave':
        return this.attackSwordWave(boss, nearestPlayer);
      case 'fire_breath':
        return this.attackFireBreath(boss, nearestPlayer);
      case 'shadow_clone':
        return this.attackShadowClone(boss);
      case 'dark_wave':
        return this.attackDarkWave(boss);
      case 'hellfire':
        return this.attackHellfire(boss);
      case 'meteor_strike':
        return this.attackMeteorStrike(boss, nearestPlayer);
      default:
        return this.attackSlam(boss);
    }
  }

  // Attack implementations
  private attackJump(boss: Boss, target: Player): BossAttack {
    return {
      type: 'jump',
      position: target.gridPosition,
      radius: 2,
      damage: 1,
      duration: 1000,
    };
  }

  private attackSpawnMinions(boss: Boss): BossAttack {
    const positions: GridPosition[] = [];
    for (let i = 0; i < 3; i++) {
      positions.push({
        col: Math.floor(Math.random() * 13) + 1,
        row: Math.floor(Math.random() * 11) + 1,
      });
    }
    return {
      type: 'spawn_minions',
      positions,
      enemyType: 'slime',
      count: 3,
      damage: 0,
      duration: 500,
    };
  }

  private attackSlam(boss: Boss): BossAttack {
    return {
      type: 'slam',
      position: boss.gridPosition,
      radius: 3,
      damage: 1,
      duration: 800,
    };
  }

  private attackCharge(boss: Boss, target: Player): BossAttack {
    return {
      type: 'charge',
      startPosition: boss.gridPosition,
      endPosition: target.gridPosition,
      width: 2,
      damage: 2,
      duration: 600,
    };
  }

  private attackSwordWave(boss: Boss, target: Player): BossAttack {
    const dx = target.gridPosition.col - boss.gridPosition.col;
    const dy = target.gridPosition.row - boss.gridPosition.row;
    const direction = Math.abs(dx) > Math.abs(dy) 
      ? { x: Math.sign(dx), y: 0 }
      : { x: 0, y: Math.sign(dy) };

    return {
      type: 'projectile',
      position: boss.gridPosition,
      direction,
      range: 10,
      damage: 1,
      duration: 1000,
    };
  }

  private attackFireBreath(boss: Boss, target: Player): BossAttack {
    return {
      type: 'cone',
      position: boss.gridPosition,
      targetPosition: target.gridPosition,
      angle: 45,
      range: 5,
      damage: 1,
      duration: 1500,
    };
  }

  private attackShadowClone(boss: Boss): BossAttack {
    const positions: GridPosition[] = [];
    for (let i = 0; i < 3; i++) {
      positions.push({
        col: Math.floor(Math.random() * 13) + 1,
        row: Math.floor(Math.random() * 11) + 1,
      });
    }
    return {
      type: 'clone',
      positions,
      damage: 0,
      duration: 5000,
    };
  }

  private attackDarkWave(boss: Boss): BossAttack {
    return {
      type: 'expanding_ring',
      position: boss.gridPosition,
      maxRadius: 6,
      damage: 1,
      duration: 2000,
    };
  }

  private attackHellfire(boss: Boss): BossAttack {
    const positions: GridPosition[] = [];
    for (let i = 0; i < 8; i++) {
      positions.push({
        col: Math.floor(Math.random() * 13) + 1,
        row: Math.floor(Math.random() * 11) + 1,
      });
    }
    return {
      type: 'area_denial',
      positions,
      damage: 1,
      duration: 3000,
    };
  }

  private attackMeteorStrike(boss: Boss, target: Player): BossAttack {
    return {
      type: 'delayed_explosion',
      position: target.gridPosition,
      radius: 2,
      delay: 1500,
      damage: 2,
      duration: 2000,
    };
  }

  private findNearestPlayer(): Player | null {
    if (!this.boss) return null;

    let nearest: Player | null = null;
    let minDist = Infinity;

    for (const player of this.players) {
      if (player.isDead) continue;
      const dist = manhattanDistance(this.boss.gridPosition, player.gridPosition);
      if (dist < minDist) {
        minDist = dist;
        nearest = player;
      }
    }

    return nearest;
  }

  private getBossType(name: string): string {
    const typeMap: Record<string, string> = {
      'King Slime': 'king_slime',
      'Dark Knight': 'dark_knight',
      'Fire Dragon': 'fire_dragon',
      'Shadow Lord': 'shadow_lord',
      'Demon King': 'demon_king',
    };
    return typeMap[name] || 'king_slime';
  }

  public getBoss(): Boss | null {
    return this.boss;
  }

  public reset(): void {
    this.boss = null;
  }
}

export interface BossAttack {
  type: string;
  position?: GridPosition;
  positions?: GridPosition[];
  startPosition?: GridPosition;
  endPosition?: GridPosition;
  targetPosition?: GridPosition;
  direction?: { x: number; y: number };
  radius?: number;
  range?: number;
  width?: number;
  angle?: number;
  maxRadius?: number;
  delay?: number;
  damage: number;
  duration: number;
  enemyType?: string;
  count?: number;
}

export const bossSystem = new BossSystem();
