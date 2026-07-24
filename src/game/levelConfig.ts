/**
 * Configuration and helpers for level progression, sizing, and hint timings.
 */

/**
 * Calculates the grid size (rows/columns) for a given level.
 * Size increases every 4 levels, capped at 21. Grid size is always odd for visual balance.
 */
export function getGridSize(level: number): number {
  if (level >= 1 && level <= 3) return 5;
  if (level >= 4 && level <= 7) return 7;
  if (level >= 8 && level <= 12) return 9;
  if (level >= 13 && level <= 18) return 11;
  if (level >= 19 && level <= 25) return 13;

  // Level 26 and above: increase size by 2 every 6 levels, capped at 21.
  const extra = level - 25;
  const size = 13 + 2 * Math.floor((extra + 5) / 6);
  return Math.min(21, size);
}

/**
 * Generates a deterministic seed string for a given level.
 */
export function generateLevelSeed(level: number): string {
  // Simple deterministic seed generation
  return `pixel-maze-level-${level}-seed-xyz`;
}

/**
 * Returns the automatic hint threshold in milliseconds.
 * Levels 1-3: 15 seconds
 * Levels 4-8: 25 seconds
 * Later levels: manual only (null)
 */
export function getAutoHintThreshold(level: number): number | null {
  if (level >= 1 && level <= 3) {
    return 15000;
  } else if (level >= 4 && level <= 8) {
    return 25000;
  }
  return null;
}
