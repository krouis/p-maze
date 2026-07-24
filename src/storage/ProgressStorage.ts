import { SavedProgress } from './storageTypes';
import { validateAndMigrateProgress, DEFAULT_PROGRESS } from './StorageValidation';

const STORAGE_KEY = 'p-maze-progress';

/**
 * Accessor for progress and settings stored in the browser's localStorage.
 * Ensures the game never crashes due to disabled or full localStorage.
 */
export class ProgressStorage {
  /**
   * Retrieves and validates the saved progress. Returns defaults if empty or invalid.
   */
  static loadProgress(): SavedProgress {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return this.cloneDefault();
      }
      const parsed = JSON.parse(serialized);
      return validateAndMigrateProgress(parsed);
    } catch (e) {
      console.error('Failed to load progress from localStorage', e);
      return this.cloneDefault();
    }
  }

  /**
   * Saves the player progress to localStorage.
   */
  static saveProgress(progress: SavedProgress): void {
    try {
      const validated = validateAndMigrateProgress(progress);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    } catch (e) {
      console.error('Failed to save progress to localStorage', e);
    }
  }

  /**
   * Resets the player progress to default, preserving settings if possible.
   */
  static resetProgress(): SavedProgress {
    try {
      const current = this.loadProgress();
      const resetData: SavedProgress = {
        ...this.cloneDefault(),
        settings: current.settings, // Preserve user preferences on reset
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
      return resetData;
    } catch (e) {
      console.error('Failed to reset progress in localStorage', e);
      return this.cloneDefault();
    }
  }

  /**
   * Helper to perform a deep clone of the default progress structure.
   */
  private static cloneDefault(): SavedProgress {
    return {
      ...DEFAULT_PROGRESS,
      settings: { ...DEFAULT_PROGRESS.settings },
      completedLevels: [...DEFAULT_PROGRESS.completedLevels],
    };
  }
}
