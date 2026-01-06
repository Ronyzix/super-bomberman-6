// Sprite Manager - Handles all game sprites and animations

import { GAME_CONFIG, COLORS } from '../constants';

export interface SpriteSheet {
  image: HTMLCanvasElement;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  animations: Record<string, { start: number; end: number; speed: number }>;
}

export interface Sprite {
  x: number;
  y: number;
  width: number;
  height: number;
  currentFrame: number;
  animationTimer: number;
}

class SpriteManager {
  private sprites: Map<string, SpriteSheet> = new Map();
  private loaded: boolean = false;

  public async init(): Promise<void> {
    // Generate all sprites programmatically (no external assets needed)
    this.generateBombermanSprite();
    this.generateBombSprite();
    this.generateExplosionSprite();
    this.generateEnemySprites();
    this.generatePowerUpSprites();
    this.generateBlockSprites();
    this.generateBossSprites();
    this.loaded = true;
  }

  private generateBombermanSprite(): void {
    const canvas = document.createElement('canvas');
    const size = GAME_CONFIG.TILE_SIZE;
    canvas.width = size * 16; // 4 directions x 4 frames
    canvas.height = size * 4; // 4 color variants
    const ctx = canvas.getContext('2d')!;

    const colors = [
      { body: '#FFFFFF', accent: '#FF6B35' }, // Player 1 - White/Orange
      { body: '#4ECDC4', accent: '#1A535C' }, // Player 2 - Cyan
      { body: '#FFE66D', accent: '#FF6B6B' }, // Player 3 - Yellow
      { body: '#95E1D3', accent: '#F38181' }, // Player 4 - Mint
    ];

    colors.forEach((color, playerIndex) => {
      for (let dir = 0; dir < 4; dir++) {
        for (let frame = 0; frame < 4; frame++) {
          const x = (dir * 4 + frame) * size;
          const y = playerIndex * size;
          this.drawBombermanFrame(ctx, x, y, size, color, dir, frame);
        }
      }
    });

    this.sprites.set('bomberman', {
      image: canvas,
      frameWidth: size,
      frameHeight: size,
      frames: 16,
      animations: {
        idle_down: { start: 0, end: 0, speed: 0 },
        walk_down: { start: 0, end: 3, speed: 150 },
        idle_up: { start: 4, end: 4, speed: 0 },
        walk_up: { start: 4, end: 7, speed: 150 },
        idle_left: { start: 8, end: 8, speed: 0 },
        walk_left: { start: 8, end: 11, speed: 150 },
        idle_right: { start: 12, end: 12, speed: 0 },
        walk_right: { start: 12, end: 15, speed: 150 },
      },
    });
  }

  private drawBombermanFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: { body: string; accent: string },
    direction: number,
    frame: number
  ): void {
    const bounce = Math.sin(frame * Math.PI / 2) * 2;
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, y + size - 4, size / 3, size / 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = color.body;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 4 - bounce, size / 3, size / 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body outline
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Belt
    ctx.fillStyle = color.accent;
    ctx.fillRect(x + size / 4, centerY + 2 - bounce, size / 2, 4);

    // Head
    ctx.fillStyle = '#FFE4C4';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 8 - bounce, size / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.stroke();

    // Helmet
    ctx.fillStyle = color.accent;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 12 - bounce, size / 4, Math.PI, 0);
    ctx.fill();

    // Antenna
    ctx.fillStyle = color.accent;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 20 - bounce, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes based on direction
    ctx.fillStyle = '#333';
    const eyeOffsetX = direction === 2 ? -3 : direction === 3 ? 3 : 0;
    const eyeY = centerY - 8 - bounce;
    
    if (direction !== 1) { // Not facing up
      ctx.beginPath();
      ctx.arc(centerX - 4 + eyeOffsetX, eyeY, 2, 0, Math.PI * 2);
      ctx.arc(centerX + 4 + eyeOffsetX, eyeY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Feet
    const footOffset = Math.sin(frame * Math.PI) * 3;
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(centerX - 6, y + size - 6 + footOffset, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + 6, y + size - 6 - footOffset, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private generateBombSprite(): void {
    const canvas = document.createElement('canvas');
    const size = GAME_CONFIG.TILE_SIZE;
    canvas.width = size * 4;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    for (let frame = 0; frame < 4; frame++) {
      const x = frame * size;
      const scale = 1 + Math.sin(frame * Math.PI / 2) * 0.1;
      this.drawBomb(ctx, x, 0, size, scale);
    }

    this.sprites.set('bomb', {
      image: canvas,
      frameWidth: size,
      frameHeight: size,
      frames: 4,
      animations: {
        idle: { start: 0, end: 3, speed: 200 },
      },
    });
  }

  private drawBomb(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, scale: number): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = (size / 3) * scale;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, y + size - 6, radius, radius / 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bomb body
    const gradient = ctx.createRadialGradient(
      centerX - radius / 3, centerY - radius / 3, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, '#555');
    gradient.addColorStop(0.5, '#333');
    gradient.addColorStop(1, '#111');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
    ctx.fill();

    // Fuse
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.quadraticCurveTo(centerX + 5, centerY - radius - 8, centerX + 10, centerY - radius - 5);
    ctx.stroke();

    // Spark
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX + 10, centerY - radius - 5, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(centerX + 10, centerY - radius - 5, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  private generateExplosionSprite(): void {
    const canvas = document.createElement('canvas');
    const size = GAME_CONFIG.TILE_SIZE;
    canvas.width = size * 8;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    for (let frame = 0; frame < 8; frame++) {
      const x = frame * size;
      const progress = frame / 7;
      this.drawExplosion(ctx, x, 0, size, progress);
    }

    this.sprites.set('explosion', {
      image: canvas,
      frameWidth: size,
      frameHeight: size,
      frames: 8,
      animations: {
        explode: { start: 0, end: 7, speed: 50 },
      },
    });
  }

  private drawExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, progress: number): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const maxRadius = size / 2;
    
    // Explosion grows then fades
    const scale = progress < 0.5 ? progress * 2 : 1;
    const alpha = progress < 0.5 ? 1 : 1 - (progress - 0.5) * 2;
    const radius = maxRadius * scale;

    // Outer glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
    gradient.addColorStop(0.3, `rgba(255, 200, 50, ${alpha})`);
    gradient.addColorStop(0.6, `rgba(255, 100, 0, ${alpha * 0.8})`);
    gradient.addColorStop(1, `rgba(200, 50, 0, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Core
    if (progress < 0.6) {
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private generateEnemySprites(): void {
    const enemies = [
      { name: 'slime', color: '#4CAF50', accentColor: '#2E7D32' },
      { name: 'bat', color: '#9C27B0', accentColor: '#6A1B9A' },
      { name: 'ghost', color: '#E0E0E0', accentColor: '#9E9E9E' },
      { name: 'charger', color: '#F44336', accentColor: '#C62828' },
      { name: 'bomber', color: '#FF9800', accentColor: '#E65100' },
      { name: 'shield', color: '#2196F3', accentColor: '#1565C0' },
      { name: 'teleporter', color: '#673AB7', accentColor: '#4527A0' },
      { name: 'splitter', color: '#FFEB3B', accentColor: '#F9A825' },
    ];

    enemies.forEach(enemy => {
      const canvas = document.createElement('canvas');
      const size = GAME_CONFIG.TILE_SIZE;
      canvas.width = size * 4;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      for (let frame = 0; frame < 4; frame++) {
        const x = frame * size;
        this.drawEnemy(ctx, x, 0, size, enemy.color, enemy.accentColor, enemy.name, frame);
      }

      this.sprites.set(`enemy_${enemy.name}`, {
        image: canvas,
        frameWidth: size,
        frameHeight: size,
        frames: 4,
        animations: {
          idle: { start: 0, end: 3, speed: 200 },
        },
      });
    });
  }

  private drawEnemy(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
    accentColor: string,
    type: string,
    frame: number
  ): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const bounce = Math.sin(frame * Math.PI / 2) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, y + size - 4, size / 3, size / 8, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (type) {
      case 'slime':
        this.drawSlime(ctx, centerX, centerY, size, color, accentColor, bounce);
        break;
      case 'bat':
        this.drawBat(ctx, centerX, centerY, size, color, accentColor, frame);
        break;
      case 'ghost':
        this.drawGhost(ctx, centerX, centerY, size, color, accentColor, bounce);
        break;
      default:
        this.drawGenericEnemy(ctx, centerX, centerY, size, color, accentColor, bounce);
    }
  }

  private drawSlime(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, accent: string, bounce: number): void {
    const squash = 1 + bounce * 0.05;
    
    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, size / 3 * squash, size / 3 / squash, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx - 5, cy - 2, 6, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(cx - 6, cy, 5, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx - 5, cy + 1, 3, 0, Math.PI * 2);
    ctx.arc(cx + 7, cy + 1, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBat(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, accent: string, frame: number): void {
    const wingAngle = Math.sin(frame * Math.PI) * 0.5;

    // Wings
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(cx - 10, cy);
    ctx.rotate(-wingAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx + 10, cy);
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#FF0';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 2, 3, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGhost(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, accent: string, bounce: number): void {
    // Body
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy - 4, size / 3, Math.PI, 0);
    ctx.lineTo(cx + size / 3, cy + 8);
    
    // Wavy bottom
    for (let i = 0; i < 4; i++) {
      const waveX = cx + size / 3 - (i + 1) * (size / 6);
      const waveY = cy + 8 + (i % 2 === 0 ? 4 : 0) + bounce;
      ctx.lineTo(waveX, waveY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.ellipse(cx - 6, cy - 4, 4, 6, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 6, cy - 4, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawGenericEnemy(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, accent: string, bounce: number): void {
    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy - bounce, size / 3, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 4 - bounce, 4, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 4 - bounce, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 3 - bounce, 2, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy - 3 - bounce, 2, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 8 - bounce);
    ctx.lineTo(cx - 2, cy - 6 - bounce);
    ctx.moveTo(cx + 8, cy - 8 - bounce);
    ctx.lineTo(cx + 2, cy - 6 - bounce);
    ctx.stroke();
  }

  private generatePowerUpSprites(): void {
    const powerUps = [
      { name: 'bomb_up', icon: '💣', color: '#FF6B35' },
      { name: 'fire_up', icon: '🔥', color: '#FF4757' },
      { name: 'speed_up', icon: '⚡', color: '#FFD700' },
      { name: 'remote', icon: '📡', color: '#9B59B6' },
      { name: 'pierce', icon: '💥', color: '#E74C3C' },
      { name: 'shield', icon: '🛡️', color: '#3498DB' },
    ];

    powerUps.forEach(powerUp => {
      const canvas = document.createElement('canvas');
      const size = GAME_CONFIG.TILE_SIZE;
      canvas.width = size * 4;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      for (let frame = 0; frame < 4; frame++) {
        const x = frame * size;
        const bounce = Math.sin(frame * Math.PI / 2) * 3;
        this.drawPowerUp(ctx, x, 0, size, powerUp.color, powerUp.icon, bounce);
      }

      this.sprites.set(`powerup_${powerUp.name}`, {
        image: canvas,
        frameWidth: size,
        frameHeight: size,
        frames: 4,
        animations: {
          idle: { start: 0, end: 3, speed: 150 },
        },
      });
    });
  }

  private drawPowerUp(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, icon: string, bounce: number): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2 - bounce;

    // Glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
    gradient.addColorStop(0, color + '80');
    gradient.addColorStop(1, color + '00');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Box
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(centerX - 12, centerY - 12, 24, 24, 4);
    ctx.fill();
    ctx.stroke();

    // Icon (simplified - just a colored circle for now)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  private generateBlockSprites(): void {
    const canvas = document.createElement('canvas');
    const size = GAME_CONFIG.TILE_SIZE;
    canvas.width = size * 4; // 4 destruction frames
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    for (let frame = 0; frame < 4; frame++) {
      const x = frame * size;
      this.drawBlock(ctx, x, 0, size, frame / 3);
    }

    this.sprites.set('block', {
      image: canvas,
      frameWidth: size,
      frameHeight: size,
      frames: 4,
      animations: {
        idle: { start: 0, end: 0, speed: 0 },
        destroy: { start: 0, end: 3, speed: 100 },
      },
    });
  }

  private drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, destruction: number): void {
    const alpha = 1 - destruction;
    
    // Main block
    ctx.globalAlpha = alpha;
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, '#D4A574');
    gradient.addColorStop(0.5, '#A0522D');
    gradient.addColorStop(1, '#6B3510');

    ctx.fillStyle = gradient;
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

    // Brick lines
    ctx.strokeStyle = '#4A2500';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 2, y + size / 2);
    ctx.lineTo(x + size - 2, y + size / 2);
    ctx.moveTo(x + size / 2, y + 2);
    ctx.lineTo(x + size / 2, y + size / 2);
    ctx.moveTo(x + size / 4, y + size / 2);
    ctx.lineTo(x + size / 4, y + size - 2);
    ctx.moveTo(x + size * 3 / 4, y + size / 2);
    ctx.lineTo(x + size * 3 / 4, y + size - 2);
    ctx.stroke();

    // Destruction particles
    if (destruction > 0) {
      ctx.globalAlpha = destruction;
      for (let i = 0; i < 5; i++) {
        const px = x + Math.random() * size;
        const py = y + Math.random() * size - destruction * 20;
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(px, py, 4, 4);
      }
    }

    ctx.globalAlpha = 1;
  }

  private generateBossSprites(): void {
    const bosses = [
      { name: 'king_slime', color: '#4CAF50', size: 3 },
      { name: 'dark_knight', color: '#37474F', size: 3 },
      { name: 'fire_dragon', color: '#FF5722', size: 4 },
      { name: 'shadow_lord', color: '#311B92', size: 3 },
      { name: 'demon_king', color: '#B71C1C', size: 4 },
    ];

    bosses.forEach(boss => {
      const canvas = document.createElement('canvas');
      const tileSize = GAME_CONFIG.TILE_SIZE;
      const size = tileSize * boss.size;
      canvas.width = size * 4;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      for (let frame = 0; frame < 4; frame++) {
        const x = frame * size;
        this.drawBoss(ctx, x, 0, size, boss.color, boss.name, frame);
      }

      this.sprites.set(`boss_${boss.name}`, {
        image: canvas,
        frameWidth: size,
        frameHeight: size,
        frames: 4,
        animations: {
          idle: { start: 0, end: 3, speed: 300 },
          attack: { start: 0, end: 3, speed: 150 },
        },
      });
    });
  }

  private drawBoss(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, type: string, frame: number): void {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const bounce = Math.sin(frame * Math.PI / 2) * 5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(centerX, y + size - 10, size / 3, size / 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Boss body (large and menacing)
    const gradient = ctx.createRadialGradient(
      centerX - size / 6, centerY - size / 6, 0,
      centerX, centerY, size / 2
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, this.darkenColor(color, 0.5));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY - bounce, size / 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Eyes (menacing)
    ctx.fillStyle = '#FF0';
    ctx.beginPath();
    ctx.ellipse(centerX - size / 8, centerY - size / 8 - bounce, size / 12, size / 8, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + size / 8, centerY - size / 8 - bounce, size / 12, size / 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#F00';
    ctx.beginPath();
    ctx.arc(centerX - size / 8, centerY - size / 10 - bounce, size / 20, 0, Math.PI * 2);
    ctx.arc(centerX + size / 8, centerY - size / 10 - bounce, size / 20, 0, Math.PI * 2);
    ctx.fill();

    // Crown/horns for bosses
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(centerX - size / 4, centerY - size / 2.5 - bounce);
    ctx.lineTo(centerX - size / 6, centerY - size / 1.8 - bounce);
    ctx.lineTo(centerX, centerY - size / 2.5 - bounce);
    ctx.lineTo(centerX + size / 6, centerY - size / 1.8 - bounce);
    ctx.lineTo(centerX + size / 4, centerY - size / 2.5 - bounce);
    ctx.fill();
  }

  private darkenColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substr(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.substr(2, 2), 16) * factor);
    const b = Math.floor(parseInt(hex.substr(4, 2), 16) * factor);
    return `rgb(${r},${g},${b})`;
  }

  public getSprite(name: string): SpriteSheet | undefined {
    return this.sprites.get(name);
  }

  public drawSprite(
    ctx: CanvasRenderingContext2D,
    name: string,
    x: number,
    y: number,
    frame: number = 0,
    variant: number = 0
  ): void {
    const sprite = this.sprites.get(name);
    if (!sprite) return;

    const frameX = (frame % sprite.frames) * sprite.frameWidth;
    const frameY = variant * sprite.frameHeight;

    ctx.drawImage(
      sprite.image,
      frameX,
      frameY,
      sprite.frameWidth,
      sprite.frameHeight,
      x,
      y,
      sprite.frameWidth,
      sprite.frameHeight
    );
  }

  public isLoaded(): boolean {
    return this.loaded;
  }
}

export const spriteManager = new SpriteManager();
