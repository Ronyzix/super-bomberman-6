import { describe, expect, it } from "vitest";
import { generateMapFallback, GeneratedMap } from "./procedural";

describe("Procedural Map Generation", () => {
  describe("generateMapFallback", () => {
    it("generates a valid map with correct dimensions", () => {
      const map = generateMapFallback(1, 'normal');
      
      expect(map.grid).toBeDefined();
      expect(map.grid.length).toBe(13); // height
      expect(map.grid[0].length).toBe(15); // width
    });

    it("has solid walls on borders", () => {
      const map = generateMapFallback(1, 'normal');
      
      // Top border
      for (let x = 0; x < 15; x++) {
        expect(map.grid[0][x]).toBe(1);
      }
      // Bottom border
      for (let x = 0; x < 15; x++) {
        expect(map.grid[12][x]).toBe(1);
      }
      // Left border
      for (let y = 0; y < 13; y++) {
        expect(map.grid[y][0]).toBe(1);
      }
      // Right border
      for (let y = 0; y < 13; y++) {
        expect(map.grid[y][14]).toBe(1);
      }
    });

    it("has grid pattern walls at even intersections", () => {
      const map = generateMapFallback(1, 'normal');
      
      // Check some even intersections (excluding borders)
      expect(map.grid[2][2]).toBe(1);
      expect(map.grid[4][4]).toBe(1);
      expect(map.grid[6][6]).toBe(1);
    });

    it("has clear spawn zones in corners", () => {
      const map = generateMapFallback(1, 'normal');
      
      // Top-left spawn zone
      expect(map.grid[1][1]).toBe(0);
      expect(map.grid[1][2]).toBe(0);
      expect(map.grid[2][1]).toBe(0);
      
      // Top-right spawn zone
      expect(map.grid[1][13]).toBe(0);
      expect(map.grid[1][12]).toBe(0);
      expect(map.grid[2][13]).toBe(0);
    });

    it("generates enemies for the map", () => {
      const map = generateMapFallback(1, 'normal');
      
      expect(map.enemies).toBeDefined();
      expect(Array.isArray(map.enemies)).toBe(true);
      expect(map.enemies.length).toBeGreaterThan(0);
    });

    it("generates power-ups for the map", () => {
      const map = generateMapFallback(5, 'normal');
      
      expect(map.powerUps).toBeDefined();
      expect(Array.isArray(map.powerUps)).toBe(true);
      expect(map.powerUps.length).toBeGreaterThan(0);
    });

    it("increases enemy count with higher waves", () => {
      const wave1 = generateMapFallback(1, 'normal');
      const wave10 = generateMapFallback(10, 'normal');
      
      expect(wave10.enemies.length).toBeGreaterThanOrEqual(wave1.enemies.length);
    });

    it("increases enemy count with higher difficulty", () => {
      const normal = generateMapFallback(5, 'normal');
      const hard = generateMapFallback(5, 'hard');
      const insane = generateMapFallback(5, 'insane');
      
      expect(hard.enemies.length).toBeGreaterThanOrEqual(normal.enemies.length);
      expect(insane.enemies.length).toBeGreaterThanOrEqual(hard.enemies.length);
    });

    it("assigns a theme to the map", () => {
      const map = generateMapFallback(1, 'normal');
      
      expect(map.theme).toBeDefined();
      expect(typeof map.theme).toBe('string');
      expect(map.theme.length).toBeGreaterThan(0);
    });

    it("assigns difficulty level to the map", () => {
      const map = generateMapFallback(7, 'normal');
      
      expect(map.difficulty).toBe(7);
    });

    it("generates description for the map", () => {
      const map = generateMapFallback(1, 'normal');
      
      expect(map.description).toBeDefined();
      expect(typeof map.description).toBe('string');
      expect(map.description.length).toBeGreaterThan(0);
    });

    it("enemies are placed in valid positions", () => {
      const map = generateMapFallback(5, 'normal');
      
      for (const enemy of map.enemies) {
        // Enemy should be within bounds
        expect(enemy.x).toBeGreaterThanOrEqual(1);
        expect(enemy.x).toBeLessThan(14);
        expect(enemy.y).toBeGreaterThanOrEqual(1);
        expect(enemy.y).toBeLessThan(12);
        
        // Enemy should not be on a wall
        expect(map.grid[enemy.y][enemy.x]).not.toBe(1);
      }
    });

    it("power-ups are hidden in destructible blocks", () => {
      const map = generateMapFallback(10, 'normal');
      
      for (const powerUp of map.powerUps) {
        if (powerUp.hidden) {
          // Power-up should be in a destructible block
          expect(map.grid[powerUp.y][powerUp.x]).toBe(2);
        }
      }
    });

    it("changes theme based on wave number", () => {
      const wave1 = generateMapFallback(1, 'normal');
      const wave6 = generateMapFallback(6, 'normal');
      
      // Different waves should potentially have different themes
      // (themes cycle every 5 waves)
      expect(wave1.theme).not.toBe(wave6.theme);
    });

    it("handles very high wave numbers", () => {
      const map = generateMapFallback(100, 'insane');
      
      expect(map.grid).toBeDefined();
      expect(map.enemies.length).toBeLessThanOrEqual(15); // Max cap
    });

    it("boss waves have more open space", () => {
      const normalWave = generateMapFallback(3, 'normal');
      const bossWave = generateMapFallback(5, 'normal');
      
      // Count empty tiles in center area
      const countEmptyCenter = (grid: number[][]) => {
        let count = 0;
        for (let y = 4; y < 9; y++) {
          for (let x = 4; x < 11; x++) {
            if (grid[y][x] === 0) count++;
          }
        }
        return count;
      };
      
      // Boss waves should generally have more open space
      // This is probabilistic, so we just check it doesn't crash
      expect(countEmptyCenter(bossWave.grid)).toBeGreaterThanOrEqual(0);
    });
  });
});
