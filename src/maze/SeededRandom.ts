/**
 * Seeded pseudo-random number generator using the Mulberry32 algorithm.
 * This ensures deterministic generation for any given level seed.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: string | number) {
    if (typeof seed === 'number') {
      this.seed = seed;
    } else {
      this.seed = this.hashString(seed);
    }
  }

  /**
   * Generates a 32-bit hash value from a string.
   */
  private hashString(str: string): number {
    let hash = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
      hash = (hash << 13) | (hash >>> 19);
    }
    return hash >>> 0;
  }

  /**
   * Generates the next pseudo-random floating point number in range [0, 1).
   */
  next(): number {
    let z = (this.seed += 0x6d2b79f5) | 0;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a pseudo-random integer in range [min, max] inclusive.
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Selects a random element from an array.
   */
  choose<T>(arr: T[]): T {
    if (arr.length === 0) {
      throw new Error('Cannot choose from an empty array');
    }
    const idx = this.nextInt(0, arr.length - 1);
    return arr[idx];
  }

  /**
   * Shuffles an array in place deterministically.
   */
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }
}
