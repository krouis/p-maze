import { describe, it, expect } from 'vitest';
import { getGridSize, generateLevelSeed, getAutoHintThreshold } from './levelConfig';

describe('levelConfig', () => {
  it('should calculate correct grid sizes', () => {
    // Levels 1-3 -> 5
    expect(getGridSize(1)).toBe(5);
    expect(getGridSize(2)).toBe(5);
    expect(getGridSize(3)).toBe(5);

    // Levels 4-7 -> 7
    expect(getGridSize(4)).toBe(7);
    expect(getGridSize(7)).toBe(7);

    // Levels 8-11 -> 9
    expect(getGridSize(8)).toBe(9);
    expect(getGridSize(11)).toBe(9);

    // Max cap at 21
    expect(getGridSize(100)).toBe(21);
  });

  it('should generate level seeds deterministically', () => {
    expect(generateLevelSeed(1)).toBe(generateLevelSeed(1));
    expect(generateLevelSeed(5)).not.toBe(generateLevelSeed(6));
  });

  it('should return correct auto hint thresholds', () => {
    // 1-3 -> 15s (15000 ms)
    expect(getAutoHintThreshold(1)).toBe(15000);
    expect(getAutoHintThreshold(3)).toBe(15000);

    // 4-8 -> 25s (25000 ms)
    expect(getAutoHintThreshold(4)).toBe(25000);
    expect(getAutoHintThreshold(8)).toBe(25000);

    // Later -> manual only (null)
    expect(getAutoHintThreshold(9)).toBeNull();
  });
});
