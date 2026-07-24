export type GameSettings = {
  musicEnabled: boolean;
  soundEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  automaticHints: boolean;
  automaticNextLevel: boolean;
};

export type SavedProgress = {
  version: number;
  highestUnlockedLevel: number;
  currentLevel: number;
  currentSeed: string;
  playerPosition?: {
    row: number;
    column: number;
  };
  completedLevels: number[];
  settings: GameSettings;
};
