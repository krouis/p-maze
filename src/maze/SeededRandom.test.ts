import { describe, it, expect } from 'vitest';
import { SeededRandom } from './SeededRandom';

describe('SeededRandom', () => {
  it('should return the same sequence for the same seed', () => {
    const rng1 = new SeededRandom('hello');
    const rng2 = new SeededRandom('hello');

    for (let i = 0; i < 50; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('should return different sequences for different seeds', () => {
    const rng1 = new SeededRandom('hello');
    const rng2 = new SeededRandom('world');

    let matches = 0;
    for (let i = 0; i < 50; i++) {
      if (rng1.next() === rng2.next()) {
        matches++;
      }
    }
    // With very high probability, they should not match all 50 times
    expect(matches).toBeLessThan(10);
  });

  it('should generate numbers between 0 and 1', () => {
    const rng = new SeededRandom('test');
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should generate integers in range [min, max] inclusive', () => {
    const rng = new SeededRandom('test-int');
    const counts = new Map<number, number>();
    for (let i = 0; i < 1000; i++) {
      const val = rng.nextInt(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
      expect(Number.isInteger(val)).toBe(true);
      counts.set(val, (counts.get(val) || 0) + 1);
    }
    // Verify all integers in range were generated at least once
    for (let j = 5; j <= 10; j++) {
      expect(counts.get(j)).toBeGreaterThan(0);
    }
  });

  it('should choose random element from array', () => {
    const rng = new SeededRandom('test-choose');
    const arr = ['a', 'b', 'c'];
    const chosen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      chosen.add(rng.choose(arr));
    }
    expect(chosen.has('a')).toBe(true);
    expect(chosen.has('b')).toBe(true);
    expect(chosen.has('c')).toBe(true);
  });

  it('should throw error when choosing from empty array', () => {
    const rng = new SeededRandom('test-choose-empty');
    expect(() => rng.choose([])).toThrow();
  });

  it('should shuffle array deterministically', () => {
    const rng = new SeededRandom('test-shuffle');
    const arr = [1, 2, 3, 4, 5];
    const shuffled1 = rng.shuffle(arr);

    const rng2 = new SeededRandom('test-shuffle');
    const shuffled2 = rng2.shuffle(arr);

    expect(shuffled1).toEqual(shuffled2);
    // Original array should not be modified
    expect(arr).toEqual([1, 2, 3, 4, 5]);
  });
});
