import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressStorage } from './ProgressStorage';
import { DEFAULT_PROGRESS, DEFAULT_SETTINGS } from './StorageValidation';
import { SavedProgress } from './storageTypes';

describe('ProgressStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default progress when localStorage is empty', () => {
    const progress = ProgressStorage.loadProgress();
    expect(progress.currentLevel).toBe(DEFAULT_PROGRESS.currentLevel);
    expect(progress.highestUnlockedLevel).toBe(DEFAULT_PROGRESS.highestUnlockedLevel);
    expect(progress.settings.musicEnabled).toBe(DEFAULT_SETTINGS.musicEnabled);
  });

  it('should save and load progress correctly', () => {
    const progress: SavedProgress = {
      version: 1,
      currentLevel: 3,
      highestUnlockedLevel: 4,
      currentSeed: 'custom-seed',
      completedLevels: [1, 2],
      playerPosition: { row: 1, column: 2 },
      settings: {
        musicEnabled: false,
        soundEnabled: true,
        reducedMotion: true,
        highContrast: false,
        automaticHints: false,
        automaticNextLevel: true,
      },
    };

    ProgressStorage.saveProgress(progress);
    const loaded = ProgressStorage.loadProgress();

    expect(loaded.currentLevel).toBe(3);
    expect(loaded.highestUnlockedLevel).toBe(4);
    expect(loaded.currentSeed).toBe('custom-seed');
    expect(loaded.completedLevels).toEqual([1, 2]);
    expect(loaded.playerPosition).toEqual({ row: 1, column: 2 });
    expect(loaded.settings.musicEnabled).toBe(false);
    expect(loaded.settings.reducedMotion).toBe(true);
  });

  it('should recover gracefully from malformed localStorage JSON', () => {
    localStorage.setItem('p-maze-progress', '{invalid json...}');
    const progress = ProgressStorage.loadProgress();
    expect(progress.currentLevel).toBe(DEFAULT_PROGRESS.currentLevel);
    expect(progress.settings.musicEnabled).toBe(DEFAULT_SETTINGS.musicEnabled);
  });

  it('should handle partial or corrupted progress fields by falling back to defaults', () => {
    const corruptData = {
      version: 1,
      currentLevel: 'three', // Should be number
      highestUnlockedLevel: -5, // Should be positive
      completedLevels: 'none', // Should be array
      settings: {
        musicEnabled: 'yes', // Should be boolean
      },
    };

    localStorage.setItem('p-maze-progress', JSON.stringify(corruptData));
    const loaded = ProgressStorage.loadProgress();

    expect(loaded.currentLevel).toBe(DEFAULT_PROGRESS.currentLevel);
    expect(loaded.highestUnlockedLevel).toBe(DEFAULT_PROGRESS.highestUnlockedLevel);
    expect(loaded.completedLevels).toEqual([]);
    expect(loaded.settings.musicEnabled).toBe(DEFAULT_SETTINGS.musicEnabled); // Restored default
  });

  it('should reset progress while preserving settings', () => {
    const initialProgress: SavedProgress = {
      version: 1,
      currentLevel: 5,
      highestUnlockedLevel: 5,
      currentSeed: 'seed',
      completedLevels: [1, 2, 3, 4],
      settings: {
        musicEnabled: false,
        soundEnabled: false,
        reducedMotion: true,
        highContrast: true,
        automaticHints: false,
        automaticNextLevel: false,
      },
    };

    ProgressStorage.saveProgress(initialProgress);
    const resetProgress = ProgressStorage.resetProgress();

    expect(resetProgress.currentLevel).toBe(1);
    expect(resetProgress.highestUnlockedLevel).toBe(1);
    expect(resetProgress.completedLevels).toEqual([]);
    // Settings preserved
    expect(resetProgress.settings.musicEnabled).toBe(false);
    expect(resetProgress.settings.reducedMotion).toBe(true);
    expect(resetProgress.settings.highContrast).toBe(true);
  });
});
