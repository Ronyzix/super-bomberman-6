// Renderer - 2D Canvas rendering system with elegant visuals

import { GAME_CONFIG, TILE_TYPES, COLORS, WORLDS } from '../constants';
import { 
  GameStateData, 
  Player, 
  Bomb, 
  Explosion, 
  Enemy, 
  PowerUp, 
  Boss,
  Tile,
  GridPosition 
} from '../types';
import { getPixelRatio } from '../utils/helpers';

export class Renderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private pixelRatio: number = 1;
  private width: number = 0;
  private height: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private scale: number = 1;
  
  // Cached gradients and patterns
  private wallGradient: CanvasGradient | null = null;
  private blockGradient: CanvasGradient | null = null;
  private floorPattern: CanvasPattern | null = null;
  
  // Animation time
  private animTime: number = 0;
  
  // Current world theme
  private currentTheme: 'grass' | 'lava' | 'ice' | 'forest' | 'castle' = 'grass';

  public init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.pixelRatio = getPixelRatio();
    this.resize();
    this.createGradients();
  }

  public resize(): void {
    if (!this.canvas || !this.ctx) return;

    const container = this.canvas.parentElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate game dimensions
    const gameWidth = GAME_CONFIG.GRID_WIDTH * GAME_CONFIG.TILE_SIZE;
    const gameHeight = GAME_CONFIG.GRID_HEIGHT * GAME_CONFIG.TILE_SIZE;

    // Calculate scale to fit container while maintaining aspect ratio
    const scaleX = containerWidth / gameWidth;
    const scaleY = containerHeight / gameHeight;
    this.scale = Math.min(scaleX, scaleY, 1.5); // Cap at 1.5x

    // Set canvas size
    this.width = containerWidth;
    this.height = containerHeight;
    
    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    // Calculate offset to center game
    this.offsetX = (this.width - gameWidth * this.scale) / 2;
    this.offsetY = (this.height - gameHeight * this.scale) / 2;

    this.ctx.scale(this.pixelRatio, this.pixelRatio);
    this.createGradients();
  }

  private createGradients(): void {
    if (!this.ctx) return;

    // Wall gradient
    this.wallGradient = this.ctx.createLinearGradient(0, 0, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    this.wallGradient.addColorStop(0, '#4a4a4a');
    this.wallGradient.addColorStop(0.5, '#3a3a3a');
    this.wallGradient.addColorStop(1, '#2a2a2a');

    // Block gradient
    this.blockGradient = this.ctx.createLinearGradient(0, 0, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    this.blockGradient.addColorStop(0, '#8B4513');
    this.blockGradient.addColorStop(0.5, '#A0522D');
    this.blockGradient.addColorStop(1, '#6B3510');
  }

  public setTheme(worldId: number): void {
    const world = WORLDS.find(w => w.id === worldId);
    if (world) {
      this.currentTheme = world.theme as 'grass' | 'lava' | 'ice' | 'forest' | 'castle';
    }
  }

  public render(state: GameStateData, deltaTime: number): void {
    if (!this.ctx || !this.canvas) return;

    this.animTime += deltaTime;

    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Save context and apply transformations
    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    // Render layers
    this.renderFloor(state.grid);
    this.renderGrid(state.grid);
    this.renderPowerUps(state.powerUps);
    this.renderBombs(state.bombs);
    this.renderExplosions(state.explosions);
    this.renderEnemies(state.enemies);
    this.renderPlayers(state.players);
    
    if (state.boss) {
      this.renderBoss(state.boss);
    }

    this.ctx.restore();
  }

  private renderFloor(grid: Tile[][]): void {
    if (!this.ctx) return;

    const theme = COLORS[this.currentTheme] as { bg: string; accent: string };
    
    // Draw floor with subtle pattern
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const tile = grid[row][col];
        if (tile.type === TILE_TYPES.EMPTY || tile.type === TILE_TYPES.SPAWN) {
          const x = col * GAME_CONFIG.TILE_SIZE;
          const y = row * GAME_CONFIG.TILE_SIZE;
          
          // Checkerboard pattern
          const isLight = (row + col) % 2 === 0;
          this.ctx.fillStyle = isLight ? theme.bg : this.adjustColor(theme.bg, -10);
          this.ctx.fillRect(x, y, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
          
          // Subtle grid lines
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(x, y, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
        }
      }
    }
  }

  private renderGrid(grid: Tile[][]): void {
    if (!this.ctx) return;

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const tile = grid[row][col];
        const x = col * GAME_CONFIG.TILE_SIZE;
        const y = row * GAME_CONFIG.TILE_SIZE;

        if (tile.type === TILE_TYPES.WALL) {
          this.renderWall(x, y);
        } else if (tile.type === TILE_TYPES.BLOCK) {
          this.renderBlock(x, y);
        }
      }
    }
  }

  private renderWall(x: number, y: number): void {
    if (!this.ctx) return;

    const size = GAME_CONFIG.TILE_SIZE;
    
    // Main wall body
    this.ctx.fillStyle = '#2c2c2c';
    this.ctx.fillRect(x, y, size, size);
    
    // 3D effect - top highlight
    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.fillRect(x, y, size, 4);
    this.ctx.fillRect(x, y, 4, size);
    
    // 3D effect - bottom shadow
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x, y + size - 4, size, 4);
    this.ctx.fillRect(x + size - 4, y, 4, size);
    
    // Inner detail
    this.ctx.fillStyle = '#3a3a3a';
    this.ctx.fillRect(x + 8, y + 8, size - 16, size - 16);
  }

  private renderBlock(x: number, y: number): void {
    if (!this.ctx) return;

    const size = GAME_CONFIG.TILE_SIZE;
    const theme = COLORS[this.currentTheme] as { bg: string; accent: string };
    
    // Main block body with theme color
    const gradient = this.ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, theme.accent);
    gradient.addColorStop(1, this.adjustColor(theme.accent, -30));
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    
    // Highlight
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(x + 2, y + 2, size - 4, 6);
    this.ctx.fillRect(x + 2, y + 2, 6, size - 4);
    
    // Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(x + 2, y + size - 8, size - 4, 6);
    this.ctx.fillRect(x + size - 8, y + 2, 6, size - 4);
    
    // Crack pattern
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x + size / 2, y + 8);
    this.ctx.lineTo(x + size / 2 + 4, y + size / 2);
    this.ctx.lineTo(x + size / 2 - 4, y + size - 8);
    this.ctx.stroke();
  }

  private renderPlayers(players: Player[]): void {
    if (!this.ctx) return;

    for (const player of players) {
      if (!player.active || player.isDead) continue;
      
      const x = player.position.x;
      const y = player.position.y;
      const size = GAME_CONFIG.TILE_SIZE * 0.8;
      
      // Invincibility flash effect
      if (player.isInvincible && Math.floor(this.animTime / 100) % 2 === 0) {
        continue;
      }
      
      this.ctx.save();
      this.ctx.translate(x + size / 2, y + size / 2);
      
      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, size / 2 - 4, size / 3, size / 6, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Body
      const bodyGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
      bodyGradient.addColorStop(0, player.color);
      bodyGradient.addColorStop(1, this.adjustColor(player.color, -40));
      
      this.ctx.fillStyle = bodyGradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size / 2 - 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.beginPath();
      this.ctx.arc(-size / 6, -size / 6, size / 6, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Eyes based on direction
      this.ctx.fillStyle = '#fff';
      const eyeOffset = this.getEyeOffset(player.direction);
      
      // Left eye
      this.ctx.beginPath();
      this.ctx.arc(-6 + eyeOffset.x, -4 + eyeOffset.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Right eye
      this.ctx.beginPath();
      this.ctx.arc(6 + eyeOffset.x, -4 + eyeOffset.y, 5, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Pupils
      this.ctx.fillStyle = '#000';
      this.ctx.beginPath();
      this.ctx.arc(-6 + eyeOffset.x * 1.5, -4 + eyeOffset.y * 1.5, 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.beginPath();
      this.ctx.arc(6 + eyeOffset.x * 1.5, -4 + eyeOffset.y * 1.5, 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Player number indicator
      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`P${player.playerIndex + 1}`, 0, size / 2 + 12);
      
      this.ctx.restore();
    }
  }

  private getEyeOffset(direction: string): { x: number; y: number } {
    switch (direction) {
      case 'up': return { x: 0, y: -2 };
      case 'down': return { x: 0, y: 2 };
      case 'left': return { x: -2, y: 0 };
      case 'right': return { x: 2, y: 0 };
      default: return { x: 0, y: 0 };
    }
  }

  private renderBombs(bombs: Bomb[]): void {
    if (!this.ctx) return;

    for (const bomb of bombs) {
      const x = bomb.position.x;
      const y = bomb.position.y;
      const size = GAME_CONFIG.TILE_SIZE;
      
      // Pulsing animation
      const pulse = 1 + Math.sin(this.animTime * 0.01) * 0.1;
      const bombSize = (size * 0.7) * pulse;
      
      this.ctx.save();
      this.ctx.translate(x + size / 2, y + size / 2);
      
      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, bombSize / 2, bombSize / 3, bombSize / 6, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Bomb body
      const gradient = this.ctx.createRadialGradient(-bombSize / 4, -bombSize / 4, 0, 0, 0, bombSize / 2);
      gradient.addColorStop(0, '#4a4a4a');
      gradient.addColorStop(0.7, '#1a1a1a');
      gradient.addColorStop(1, '#000');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, bombSize / 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(-bombSize / 6, -bombSize / 6, bombSize / 6, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Fuse
      this.ctx.strokeStyle = '#8B4513';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -bombSize / 2);
      this.ctx.quadraticCurveTo(bombSize / 4, -bombSize / 2 - 8, bombSize / 3, -bombSize / 2 - 4);
      this.ctx.stroke();
      
      // Spark
      const sparkSize = 4 + Math.sin(this.animTime * 0.02) * 2;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(bombSize / 3, -bombSize / 2 - 4, sparkSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Bomb type indicator
      if (bomb.type !== 'normal') {
        this.ctx.fillStyle = this.getBombTypeColor(bomb.type);
        this.ctx.beginPath();
        this.ctx.arc(0, bombSize / 4, 6, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
  }

  private getBombTypeColor(type: string): string {
    switch (type) {
      case 'penetrating': return '#FF4500';
      case 'remote': return '#00BFFF';
      case 'line': return '#32CD32';
      default: return '#FFD700';
    }
  }

  private renderExplosions(explosions: Explosion[]): void {
    if (!this.ctx) return;

    for (const explosion of explosions) {
      const x = explosion.position.x;
      const y = explosion.position.y;
      const size = GAME_CONFIG.TILE_SIZE;
      
      // Fade out based on timer
      const alpha = Math.min(1, explosion.timer / 200);
      
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      
      // Explosion gradient
      const gradient = this.ctx.createRadialGradient(
        x + size / 2, y + size / 2, 0,
        x + size / 2, y + size / 2, size / 2
      );
      gradient.addColorStop(0, '#FFFF00');
      gradient.addColorStop(0.3, '#FFA500');
      gradient.addColorStop(0.6, '#FF4500');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
      
      this.ctx.fillStyle = gradient;
      
      // Draw explosion shape based on direction
      if (explosion.direction === 'center') {
        this.ctx.beginPath();
        this.ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Directional explosion
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        
        // Add flame particles
        const particleCount = 3;
        for (let i = 0; i < particleCount; i++) {
          const px = x + size / 2 + (Math.random() - 0.5) * size * 0.5;
          const py = y + size / 2 + (Math.random() - 0.5) * size * 0.5;
          const pSize = 4 + Math.random() * 8;
          
          this.ctx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${alpha * 0.8})`;
          this.ctx.beginPath();
          this.ctx.arc(px, py, pSize, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
      
      this.ctx.restore();
    }
  }

  private renderEnemies(enemies: Enemy[]): void {
    if (!this.ctx) return;

    for (const enemy of enemies) {
      if (!enemy.active || enemy.state === 'dying') continue;
      
      const x = enemy.position.x;
      const y = enemy.position.y;
      const size = GAME_CONFIG.TILE_SIZE * 0.8;
      
      this.ctx.save();
      this.ctx.translate(x + size / 2, y + size / 2);
      
      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, size / 2 - 4, size / 3, size / 6, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw based on enemy type
      this.drawEnemyByType(enemy, size);
      
      // Shield effect
      if (enemy.isShielded && enemy.shieldTimer > 0) {
        this.ctx.strokeStyle = 'rgba(0, 191, 255, 0.8)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2 + 4, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      this.ctx.restore();
    }
  }

  private drawEnemyByType(enemy: Enemy, size: number): void {
    if (!this.ctx) return;

    const colors: Record<string, { main: string; accent: string }> = {
      slime: { main: '#32CD32', accent: '#228B22' },
      bat: { main: '#8B008B', accent: '#4B0082' },
      ghost: { main: '#E6E6FA', accent: '#D8BFD8' },
      bomber: { main: '#FF4500', accent: '#8B0000' },
      charger: { main: '#DC143C', accent: '#8B0000' },
      teleporter: { main: '#00CED1', accent: '#008B8B' },
      shield: { main: '#4169E1', accent: '#191970' },
      splitter: { main: '#9ACD32', accent: '#6B8E23' },
    };

    const color = colors[enemy.type] || colors.slime;
    
    // Body gradient
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
    gradient.addColorStop(0, color.main);
    gradient.addColorStop(1, color.accent);
    
    this.ctx.fillStyle = gradient;
    
    // Different shapes for different enemies
    switch (enemy.type) {
      case 'slime':
        // Blob shape
        this.ctx.beginPath();
        this.ctx.ellipse(0, 4, size / 2, size / 2 - 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        break;
        
      case 'bat':
        // Bat with wings
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
        this.ctx.fill();
        // Wings
        const wingFlap = Math.sin(this.animTime * 0.02) * 10;
        this.ctx.beginPath();
        this.ctx.moveTo(-size / 3, 0);
        this.ctx.quadraticCurveTo(-size / 2, -size / 3 + wingFlap, -size / 2 - 4, 0);
        this.ctx.quadraticCurveTo(-size / 2, size / 4, -size / 3, 0);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(size / 3, 0);
        this.ctx.quadraticCurveTo(size / 2, -size / 3 + wingFlap, size / 2 + 4, 0);
        this.ctx.quadraticCurveTo(size / 2, size / 4, size / 3, 0);
        this.ctx.fill();
        break;
        
      case 'ghost':
        // Ghost shape with wavy bottom
        this.ctx.beginPath();
        this.ctx.arc(0, -size / 6, size / 2 - 4, Math.PI, 0);
        this.ctx.lineTo(size / 2 - 4, size / 3);
        for (let i = 0; i < 4; i++) {
          const wx = size / 2 - 4 - (i + 1) * (size - 8) / 4;
          const wy = size / 3 + (i % 2 === 0 ? 8 : 0);
          this.ctx.lineTo(wx, wy);
        }
        this.ctx.closePath();
        this.ctx.fill();
        break;
        
      default:
        // Default circle
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2 - 4, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Eyes
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(-6, -4, 5, 0, Math.PI * 2);
    this.ctx.arc(6, -4, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Pupils (follow player direction)
    this.ctx.fillStyle = enemy.type === 'ghost' ? '#000' : '#f00';
    const pupilOffset = { x: enemy.direction.x * 2, y: enemy.direction.y * 2 };
    this.ctx.beginPath();
    this.ctx.arc(-6 + pupilOffset.x, -4 + pupilOffset.y, 2, 0, Math.PI * 2);
    this.ctx.arc(6 + pupilOffset.x, -4 + pupilOffset.y, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderBoss(boss: Boss): void {
    if (!this.ctx) return;

    const x = boss.position.x;
    const y = boss.position.y;
    const size = GAME_CONFIG.TILE_SIZE * 3; // Bosses are larger
    
    this.ctx.save();
    this.ctx.translate(x + size / 2, y + size / 2);
    
    // Boss shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, size / 2, size / 2, size / 6, 0, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Boss body with gradient
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
    gradient.addColorStop(0, '#8B0000');
    gradient.addColorStop(0.5, '#4B0000');
    gradient.addColorStop(1, '#2B0000');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Boss details (crown, horns, etc.)
    this.ctx.fillStyle = '#FFD700';
    // Crown
    this.ctx.beginPath();
    this.ctx.moveTo(-size / 4, -size / 2);
    this.ctx.lineTo(-size / 6, -size / 2 - 20);
    this.ctx.lineTo(0, -size / 2);
    this.ctx.lineTo(size / 6, -size / 2 - 20);
    this.ctx.lineTo(size / 4, -size / 2);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Eyes
    this.ctx.fillStyle = '#FF0000';
    this.ctx.beginPath();
    this.ctx.arc(-size / 6, -size / 8, 12, 0, Math.PI * 2);
    this.ctx.arc(size / 6, -size / 8, 12, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Health bar
    const healthPercent = boss.health / boss.maxHealth;
    const barWidth = size * 0.8;
    const barHeight = 8;
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(-barWidth / 2, -size / 2 - 30, barWidth, barHeight);
    
    this.ctx.fillStyle = healthPercent > 0.5 ? '#32CD32' : healthPercent > 0.25 ? '#FFD700' : '#FF4500';
    this.ctx.fillRect(-barWidth / 2, -size / 2 - 30, barWidth * healthPercent, barHeight);
    
    // Boss name
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(boss.name, 0, -size / 2 - 40);
    
    this.ctx.restore();
  }

  private renderPowerUps(powerUps: PowerUp[]): void {
    if (!this.ctx) return;

    for (const powerUp of powerUps) {
      if (!powerUp.active) continue;
      
      const x = powerUp.position.x;
      const y = powerUp.position.y;
      const size = GAME_CONFIG.TILE_SIZE;
      
      // Floating animation
      const float = Math.sin(this.animTime * 0.005 + powerUp.position.x) * 4;
      
      this.ctx.save();
      this.ctx.translate(x + size / 2, y + size / 2 + float);
      
      // Glow effect
      const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
      glowGradient.addColorStop(0, this.getPowerUpColor(powerUp.type));
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      this.ctx.fillStyle = glowGradient;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Power-up icon
      this.ctx.fillStyle = '#fff';
      this.ctx.strokeStyle = this.getPowerUpColor(powerUp.type);
      this.ctx.lineWidth = 2;
      
      this.drawPowerUpIcon(powerUp.type, size / 3);
      
      this.ctx.restore();
    }
  }

  private getPowerUpColor(type: string): string {
    const colors: Record<string, string> = {
      speed: '#00BFFF',
      bomb_count: '#FF6B35',
      fire_range: '#FF4500',
      power_bomb: '#FF0000',
      remote_bomb: '#9400D3',
      line_bomb: '#32CD32',
    };
    return colors[type] || '#FFD700';
  }

  private drawPowerUpIcon(type: string, size: number): void {
    if (!this.ctx) return;

    this.ctx.beginPath();
    
    switch (type) {
      case 'speed':
        // Lightning bolt
        this.ctx.moveTo(-size / 3, -size / 2);
        this.ctx.lineTo(size / 6, 0);
        this.ctx.lineTo(-size / 6, 0);
        this.ctx.lineTo(size / 3, size / 2);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(size / 6, 0);
        this.ctx.closePath();
        break;
        
      case 'bomb_count':
        // Plus sign
        this.ctx.rect(-size / 6, -size / 2, size / 3, size);
        this.ctx.rect(-size / 2, -size / 6, size, size / 3);
        break;
        
      case 'fire_range':
        // Flame
        this.ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
        break;
        
      default:
        // Star
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
          const x = Math.cos(angle) * size / 2;
          const y = Math.sin(angle) * size / 2;
          if (i === 0) this.ctx.moveTo(x, y);
          else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
    }
    
    this.ctx.fill();
    this.ctx.stroke();
  }

  private adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  public destroy(): void {
    this.canvas = null;
    this.ctx = null;
  }
}

export const renderer = new Renderer();
