import { Maze, Position } from '../maze/mazeTypes';
import { MazeGenerator } from '../maze/MazeGenerator';
import { findShortestPath } from '../maze/Pathfinding';
import { Direction, MoveSource } from '../input/inputTypes';
import { getGridSize, generateLevelSeed, getAutoHintThreshold } from './levelConfig';
import { ProgressStorage } from '../storage/ProgressStorage';
import { SavedProgress, GameSettings } from '../storage/storageTypes';

export type ScreenState = 'start' | 'playing' | 'paused' | 'completed' | 'settings';

export class GameState {
  // Game screens
  screen: ScreenState = 'start';

  // Level info
  level = 1;
  highestUnlockedLevel = 1;
  completedLevels: number[] = [];
  maze!: Maze;
  playerPosition!: Position;

  // Settings
  settings!: GameSettings;

  // Movement animation
  visualRow = 0;
  visualCol = 0;
  isMoving = false;
  moveFrom!: Position;
  moveTo!: Position;
  moveProgress = 0; // 0 to 1
  moveDuration = 100; // ms

  // Bump animation (squash/bounce on wall hit)
  isBumping = false;
  bumpDirection: Direction | null = null;
  bumpProgress = 0; // 0 to 1
  bumpDuration = 100; // ms

  // Hint state
  showHint = false;
  hintPath: Position[] = [];
  hintActiveTime = 0;
  hintMaxDuration = 3000; // 3 seconds
  inactivityTimer = 0;
  autoHintTriggered = false;

  // Callbacks for sound effects and music state changes
  onSoundTrigger?: (effect: 'move' | 'bump' | 'success' | 'click' | 'hint') => void;
  onLevelChange?: (level: number) => void;
  onScreenChange?: (screen: ScreenState) => void;

  constructor() {
    this.loadFromStorage();
    this.initLevel(this.level, true); // Restore playerPosition from save if available
  }

  /**
   * Loads state from local storage.
   */
  loadFromStorage() {
    const saved = ProgressStorage.loadProgress();
    this.level = saved.currentLevel;
    this.highestUnlockedLevel = saved.highestUnlockedLevel;
    this.completedLevels = [...saved.completedLevels];
    this.settings = { ...saved.settings };
  }

  /**
   * Saves the current game state to local storage.
   */
  saveToStorage() {
    const progress: SavedProgress = {
      version: 1,
      currentLevel: this.level,
      highestUnlockedLevel: this.highestUnlockedLevel,
      currentSeed: this.maze.seed,
      completedLevels: this.completedLevels,
      playerPosition: this.playerPosition,
      settings: this.settings,
    };
    ProgressStorage.saveProgress(progress);
  }

  /**
   * Initializes a level by generating its maze.
   */
  initLevel(level: number, restorePosition = false) {
    this.level = level;
    const size = getGridSize(level);
    const seed = generateLevelSeed(level);
    this.maze = MazeGenerator.generate(size, size, seed);

    const saved = ProgressStorage.loadProgress();
    if (restorePosition && saved.currentLevel === level && saved.playerPosition) {
      // Validate saved position is within maze bounds
      const { row, column } = saved.playerPosition;
      if (row >= 0 && row < size && column >= 0 && column < size) {
        this.playerPosition = { ...saved.playerPosition };
      } else {
        this.playerPosition = { ...this.maze.start };
      }
    } else {
      this.playerPosition = { ...this.maze.start };
    }

    this.visualRow = this.playerPosition.row;
    this.visualCol = this.playerPosition.column;
    this.isMoving = false;
    this.isBumping = false;
    this.showHint = false;
    this.inactivityTimer = 0;
    this.autoHintTriggered = false;

    // Pre-calculate hint path
    this.hintPath = findShortestPath(this.maze.cells, this.playerPosition, this.maze.exit);

    if (this.onLevelChange) {
      this.onLevelChange(level);
    }
  }

  /**
   * Changes the active screen.
   */
  setScreen(newScreen: ScreenState) {
    this.screen = newScreen;
    if (newScreen === 'playing') {
      this.inactivityTimer = 0; // Reset inactivity timer when playing starts
    }
    if (this.onScreenChange) {
      this.onScreenChange(newScreen);
    }
    this.saveToStorage();
  }

  /**
   * Handles user move command.
   */
  move(direction: Direction, _source: MoveSource) {
    if (this.screen !== 'playing') return;
    if (this.isMoving || this.isBumping) return;

    // Reset inactivity timer on any action
    this.inactivityTimer = 0;
    this.autoHintTriggered = false;

    const { row, column } = this.playerPosition;
    let nextRow = row;
    let nextCol = column;

    if (direction === 'up') nextRow--;
    else if (direction === 'down') nextRow++;
    else if (direction === 'left') nextCol--;
    else if (direction === 'right') nextCol++;

    // Check bounds
    if (nextRow < 0 || nextRow >= this.maze.rows || nextCol < 0 || nextCol >= this.maze.columns) {
      this.triggerBump(direction);
      return;
    }

    // Check walls
    const currentCell = this.maze.cells[row][column];
    let wallBlocked = false;
    if (direction === 'up' && currentCell.walls.up) wallBlocked = true;
    if (direction === 'down' && currentCell.walls.down) wallBlocked = true;
    if (direction === 'left' && currentCell.walls.left) wallBlocked = true;
    if (direction === 'right' && currentCell.walls.right) wallBlocked = true;

    if (wallBlocked) {
      this.triggerBump(direction);
      return;
    }

    // Start movement transition
    this.isMoving = true;
    this.moveFrom = { row, column };
    this.moveTo = { row: nextRow, column: nextCol };
    this.moveProgress = 0;
    this.playerPosition = { row: nextRow, column: nextCol };

    if (this.onSoundTrigger) {
      this.onSoundTrigger('move');
    }

    // Auto save progress after successful movement
    this.saveToStorage();
  }

  /**
   * Triggers the bump animation when hitting a wall.
   */
  private triggerBump(direction: Direction) {
    this.isBumping = true;
    this.bumpDirection = direction;
    this.bumpProgress = 0;

    if (this.onSoundTrigger) {
      this.onSoundTrigger('bump');
    }
  }

  /**
   * Triggers a hint display.
   */
  triggerHint() {
    if (this.screen !== 'playing') return;
    this.hintPath = findShortestPath(this.maze.cells, this.playerPosition, this.maze.exit);
    this.showHint = true;
    this.hintActiveTime = 0;

    if (this.onSoundTrigger) {
      this.onSoundTrigger('hint');
    }
  }

  /**
   * Retries the current level (recreates the same maze).
   */
  restartLevel() {
    this.initLevel(this.level, false);
    this.setScreen('playing');
  }

  /**
   * Moves to the next level.
   */
  nextLevel() {
    this.initLevel(this.level + 1, false);
    this.setScreen('playing');
  }

  /**
   * Resets all progress.
   */
  resetGame() {
    ProgressStorage.resetProgress();
    this.loadFromStorage();
    this.initLevel(1, false);
    this.setScreen('start');
  }

  /**
   * Main game loop tick update (dt in milliseconds).
   */
  update(dt: number) {
    if (this.screen !== 'playing') return;

    // 1. Update movement animation
    if (this.isMoving) {
      this.moveProgress += dt / this.moveDuration;
      if (this.moveProgress >= 1) {
        this.moveProgress = 1;
        this.visualRow = this.moveTo.row;
        this.visualCol = this.moveTo.column;
        this.isMoving = false;

        // Check level completion
        if (
          this.playerPosition.row === this.maze.exit.row &&
          this.playerPosition.column === this.maze.exit.column
        ) {
          this.completeLevel();
        }
      } else {
        this.visualRow =
          this.moveFrom.row + (this.moveTo.row - this.moveFrom.row) * this.moveProgress;
        this.visualCol =
          this.moveFrom.column + (this.moveTo.column - this.moveFrom.column) * this.moveProgress;
      }
    }

    // 2. Update bump animation
    if (this.isBumping) {
      this.bumpProgress += dt / this.bumpDuration;
      if (this.bumpProgress >= 1) {
        this.isBumping = false;
        this.bumpProgress = 0;
        this.bumpDirection = null;
        this.visualRow = this.playerPosition.row;
        this.visualCol = this.playerPosition.column;
      } else {
        // Sine wave offset for squashing/bouncing: move out, then return
        // bumpProgress from 0 to 1 maps to sin(0) to sin(pi) which goes 0 -> 1 -> 0
        const offsetMagnitude = 0.22 * Math.sin(this.bumpProgress * Math.PI);
        let rowOffset = 0;
        let colOffset = 0;

        if (this.bumpDirection === 'up') rowOffset = -offsetMagnitude;
        else if (this.bumpDirection === 'down') rowOffset = offsetMagnitude;
        else if (this.bumpDirection === 'left') colOffset = -offsetMagnitude;
        else if (this.bumpDirection === 'right') colOffset = offsetMagnitude;

        this.visualRow = this.playerPosition.row + rowOffset;
        this.visualCol = this.playerPosition.column + colOffset;
      }
    }

    // 3. Update hint timing
    if (this.showHint) {
      this.hintActiveTime += dt;
      if (this.hintActiveTime >= this.hintMaxDuration) {
        this.showHint = false;
      }
    }

    // 4. Update automatic hint inactivity timer
    if (this.settings.automaticHints && !this.showHint && !this.isMoving && !this.isBumping) {
      const autoThreshold = getAutoHintThreshold(this.level);
      if (autoThreshold !== null) {
        this.inactivityTimer += dt;
        if (this.inactivityTimer >= autoThreshold && !this.autoHintTriggered) {
          this.triggerHint();
          this.autoHintTriggered = true;
        }
      }
    }
  }

  /**
   * Action triggered when the exit is reached.
   */
  private completeLevel() {
    if (!this.completedLevels.includes(this.level)) {
      this.completedLevels.push(this.level);
    }

    // Unlock next level
    if (this.level === this.highestUnlockedLevel) {
      this.highestUnlockedLevel = this.level + 1;
    }

    this.setScreen('completed');

    if (this.onSoundTrigger) {
      this.onSoundTrigger('success');
    }

    this.saveToStorage();
  }
}
