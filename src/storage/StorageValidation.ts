import { SavedProgress, GameSettings } from './storageTypes';
import { generateLevelSeed } from '../game/levelConfig';

export const DEFAULT_SETTINGS: GameSettings = {
  musicEnabled: true,
  soundEnabled: true,
  reducedMotion: false,
  highContrast: false,
  automaticHints: true,
  automaticNextLevel: true,
};

export const DEFAULT_PROGRESS: SavedProgress = {
  version: 1,
  highestUnlockedLevel: 1,
  currentLevel: 1,
  currentSeed: generateLevelSeed(1),
  completedLevels: [],
  settings: DEFAULT_SETTINGS,
};

/**
 * Validates settings and replaces missing or invalid fields with defaults.
 */
export function validateSettings(input: any): GameSettings {
  const settings = { ...DEFAULT_SETTINGS };

  if (input && typeof input === 'object') {
    if (typeof input.musicEnabled === 'boolean') settings.musicEnabled = input.musicEnabled;
    if (typeof input.soundEnabled === 'boolean') settings.soundEnabled = input.soundEnabled;
    if (typeof input.reducedMotion === 'boolean') settings.reducedMotion = input.reducedMotion;
    if (typeof input.highContrast === 'boolean') settings.highContrast = input.highContrast;
    if (typeof input.automaticHints === 'boolean') settings.automaticHints = input.automaticHints;
    if (typeof input.automaticNextLevel === 'boolean')
      settings.automaticNextLevel = input.automaticNextLevel;
  }

  return settings;
}

/**
 * Validates progress data and performs migrations if version differs.
 * Recovers gracefully with default values for invalid fields.
 */
export function validateAndMigrateProgress(raw: any): SavedProgress {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PROGRESS, settings: { ...DEFAULT_SETTINGS } };
  }

  // Handle version-based migration
  let data = { ...raw };
  const currentVersion = 1;

  if (typeof data.version !== 'number' || data.version < currentVersion) {
    // Perform migrations if we ever bump version, e.g. from version 0 or invalid version
    data = runMigrations(data, currentVersion);
  }

  // Strict type validations & fallbacks
  const progress: SavedProgress = {
    version: currentVersion,
    highestUnlockedLevel:
      typeof data.highestUnlockedLevel === 'number' && data.highestUnlockedLevel > 0
        ? data.highestUnlockedLevel
        : DEFAULT_PROGRESS.highestUnlockedLevel,
    currentLevel:
      typeof data.currentLevel === 'number' && data.currentLevel > 0
        ? data.currentLevel
        : DEFAULT_PROGRESS.currentLevel,
    currentSeed:
      typeof data.currentSeed === 'string' && data.currentSeed.length > 0
        ? data.currentSeed
        : generateLevelSeed(typeof data.currentLevel === 'number' ? data.currentLevel : 1),
    completedLevels: Array.isArray(data.completedLevels)
      ? data.completedLevels.filter((x: any): x is number => typeof x === 'number')
      : [],
    settings: validateSettings(data.settings),
  };

  // Optional player position validation
  if (data.playerPosition && typeof data.playerPosition === 'object') {
    const row = data.playerPosition.row;
    const col = data.playerPosition.column;
    if (typeof row === 'number' && typeof col === 'number' && row >= 0 && col >= 0) {
      progress.playerPosition = { row, column: col };
    }
  }

  return progress;
}

/**
 * Empty migration logic for now since version is 1.
 * Ready for future extension.
 */
function runMigrations(data: any, targetVersion: number): any {
  let migrated = { ...data };

  // Example migration flow:
  // if (currentVer < 1) {
  //   migrated = migrateToV1(migrated);
  // }

  migrated.version = targetVersion;
  return migrated;
}
