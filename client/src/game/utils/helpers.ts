// Helper utilities for Super Bomberman 6

import { GAME_CONFIG } from '../constants';
import { GridPosition, Position } from '../types';

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Convert grid position to pixel position
export function gridToPixel(gridPos: GridPosition): Position {
  return {
    x: gridPos.col * GAME_CONFIG.TILE_SIZE,
    y: gridPos.row * GAME_CONFIG.TILE_SIZE,
  };
}

// Convert pixel position to grid position
export function pixelToGrid(pixelPos: Position): GridPosition {
  return {
    col: Math.floor(pixelPos.x / GAME_CONFIG.TILE_SIZE),
    row: Math.floor(pixelPos.y / GAME_CONFIG.TILE_SIZE),
  };
}

// Calculate distance between two positions
export function distance(a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate Manhattan distance between two grid positions
export function manhattanDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(b.col - a.col) + Math.abs(b.row - a.row);
}

// Normalize a vector
export function normalize(vec: Position): Position {
  const len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: vec.x / len, y: vec.y / len };
}

// Clamp a value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Random integer between min and max (inclusive)
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Random element from array
export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Shuffle array (Fisher-Yates)
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Check if two rectangles overlap
export function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Ease functions for animations
export const ease = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutElastic: (t: number) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
  },
  easeOutBounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
};

// Format time as MM:SS
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Format score with commas
export function formatScore(score: number): string {
  return score.toLocaleString();
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Check if device is mobile
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

// Check if device supports touch
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Get canvas scale factor for high DPI displays
export function getPixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}

// Create a seeded random number generator
export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    hash ^= hash >>> 16;
    return (hash >>> 0) / 4294967296;
  };
}

// A* Pathfinding
export function findPath(
  start: GridPosition,
  end: GridPosition,
  isWalkable: (pos: GridPosition) => boolean,
  maxIterations: number = 1000
): GridPosition[] {
  const openSet: GridPosition[] = [start];
  const cameFrom = new Map<string, GridPosition>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  
  const key = (pos: GridPosition) => `${pos.col},${pos.row}`;
  
  gScore.set(key(start), 0);
  fScore.set(key(start), manhattanDistance(start, end));
  
  let iterations = 0;
  
  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;
    
    // Find node with lowest fScore
    let current = openSet[0];
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if ((fScore.get(key(openSet[i])) || Infinity) < (fScore.get(key(current)) || Infinity)) {
        current = openSet[i];
        currentIndex = i;
      }
    }
    
    if (current.col === end.col && current.row === end.row) {
      // Reconstruct path
      const path: GridPosition[] = [current];
      while (cameFrom.has(key(current))) {
        current = cameFrom.get(key(current))!;
        path.unshift(current);
      }
      return path;
    }
    
    openSet.splice(currentIndex, 1);
    
    // Check neighbors
    const neighbors: GridPosition[] = [
      { col: current.col, row: current.row - 1 },
      { col: current.col, row: current.row + 1 },
      { col: current.col - 1, row: current.row },
      { col: current.col + 1, row: current.row },
    ];
    
    for (const neighbor of neighbors) {
      if (!isWalkable(neighbor)) continue;
      
      const tentativeGScore = (gScore.get(key(current)) || 0) + 1;
      
      if (tentativeGScore < (gScore.get(key(neighbor)) || Infinity)) {
        cameFrom.set(key(neighbor), current);
        gScore.set(key(neighbor), tentativeGScore);
        fScore.set(key(neighbor), tentativeGScore + manhattanDistance(neighbor, end));
        
        if (!openSet.some(n => n.col === neighbor.col && n.row === neighbor.row)) {
          openSet.push(neighbor);
        }
      }
    }
  }
  
  return []; // No path found
}
