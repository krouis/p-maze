import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from './GameState';

describe('GameState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should initialize with correct default level and settings', () => {
    const state = new GameState();
    expect(state.level).toBe(1);
    expect(state.highestUnlockedLevel).toBe(1);
    expect(state.screen).toBe('start');
    expect(state.settings.musicEnabled).toBe(true);
  });

  it('should move the player correctly and update visual position in update()', () => {
    const state = new GameState();
    state.setScreen('playing');

    // Force a 5x5 maze with known corridors (first move is down or right from 0,0)
    // Let's check where the walls are. 0,0 has no wall to either down or right in a perfect maze.
    // Let's attempt moving right
    const cell00 = state.maze.cells[0][0];
    const canMoveRight = !cell00.walls.right;

    const direction = canMoveRight ? 'right' : 'down';
    const soundTriggerSpy = vi.fn();
    state.onSoundTrigger = soundTriggerSpy;

    state.move(direction, 'keyboard');

    expect(state.isMoving).toBe(true);
    expect(soundTriggerSpy).toHaveBeenCalledWith('move');

    // Call update to advance animation by 50ms
    state.update(50);
    expect(state.isMoving).toBe(true);
    expect(state.moveProgress).toBeCloseTo(0.5);

    // Call update to complete the movement
    state.update(50);
    expect(state.isMoving).toBe(false);
    expect(state.moveProgress).toBe(1);
    if (direction === 'right') {
      expect(state.playerPosition).toEqual({ row: 0, column: 1 });
    } else {
      expect(state.playerPosition).toEqual({ row: 1, column: 0 });
    }
  });

  it('should trigger bump when moving into a wall', () => {
    const state = new GameState();
    state.setScreen('playing');

    // Moving up from (0,0) is out of bounds, should trigger bump
    const soundTriggerSpy = vi.fn();
    state.onSoundTrigger = soundTriggerSpy;

    state.move('up', 'keyboard');

    expect(state.isBumping).toBe(true);
    expect(state.bumpDirection).toBe('up');
    expect(soundTriggerSpy).toHaveBeenCalledWith('bump');

    // Advance bump animation
    state.update(50);
    expect(state.isBumping).toBe(true);
    expect(state.visualRow).toBeLessThan(0); // Bumping upwards shifts visualRow negatively

    // Complete bump animation
    state.update(50);
    expect(state.isBumping).toBe(false);
    expect(state.visualRow).toBe(0); // Resets to player logical position
  });

  it('should trigger automatic hints on inactive early levels', () => {
    const state = new GameState();
    state.setScreen('playing'); // Inactivity threshold is 15000ms on level 1

    const soundTriggerSpy = vi.fn();
    state.onSoundTrigger = soundTriggerSpy;

    expect(state.showHint).toBe(false);

    // Tick by 14000ms
    state.update(14000);
    expect(state.showHint).toBe(false);

    // Tick another 1000ms (totals 15000ms)
    state.update(1000);
    expect(state.showHint).toBe(true);
    expect(soundTriggerSpy).toHaveBeenCalledWith('hint');

    // Hint should clear after 3 seconds (3000ms)
    state.update(3000);
    expect(state.showHint).toBe(false);
  });

  it('should transition to completed screen when exit is reached', () => {
    const state = new GameState();
    state.setScreen('playing');

    // Move player logical position directly to the exit neighbor
    const path = state.hintPath;
    expect(path.length).toBeGreaterThan(1);

    // Position player at the second to last cell on path
    const secondLastCell = path[path.length - 2];
    state.playerPosition = { ...secondLastCell };
    state.visualRow = secondLastCell.row;
    state.visualCol = secondLastCell.column;

    // Trigger movement to exit (which is the last cell on path)
    const exitCell = path[path.length - 1];
    let dir: 'up' | 'down' | 'left' | 'right' = 'down';
    if (exitCell.row < secondLastCell.row) dir = 'up';
    if (exitCell.row > secondLastCell.row) dir = 'down';
    if (exitCell.column < secondLastCell.column) dir = 'left';
    if (exitCell.column > secondLastCell.column) dir = 'right';

    state.move(dir, 'keyboard');

    // Complete movement animation
    state.update(100);

    expect(state.screen).toBe('completed');
    expect(state.completedLevels.includes(state.level)).toBe(true);
    expect(state.highestUnlockedLevel).toBe(2);
  });
});
