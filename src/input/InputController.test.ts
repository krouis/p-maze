import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameState } from '../game/GameState';
import { InputController } from './InputController';

describe('InputController', () => {
  let state: GameState;
  let container: HTMLDivElement;
  let controller: InputController;

  beforeEach(() => {
    state = new GameState();
    state.setScreen('playing');
    container = document.createElement('div');
    controller = new InputController(state, container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    controller.destroy();
    vi.useRealTimers();
  });

  it('should map movement keys correctly and prevent default browser scrolling', () => {
    const moveSpy = vi.spyOn(state, 'move');

    const e = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    const preventDefaultSpy = vi.spyOn(e, 'preventDefault');

    window.dispatchEvent(e);

    expect(moveSpy).toHaveBeenCalledWith('down', 'keyboard');
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should support WASD and Vim keys', () => {
    const moveSpy = vi.spyOn(state, 'move');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    expect(moveSpy).toHaveBeenCalledWith('up', 'keyboard');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'H' }));
    expect(moveSpy).toHaveBeenCalledWith('left', 'keyboard');
  });

  it('should repeat input on hold with correct intervals', () => {
    const moveSpy = vi.spyOn(state, 'move');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(moveSpy).toHaveBeenCalledTimes(1); // Immediate

    // Advance 100ms (before repeat)
    vi.advanceTimersByTime(100);
    expect(moveSpy).toHaveBeenCalledTimes(1);

    // Advance another 100ms (totals 200ms initial delay)
    vi.advanceTimersByTime(100);
    expect(moveSpy).toHaveBeenCalledTimes(2);

    // Advance 110ms (first repeat interval)
    vi.advanceTimersByTime(110);
    expect(moveSpy).toHaveBeenCalledTimes(3);

    // Key up stops repeat
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }));
    vi.advanceTimersByTime(500);
    expect(moveSpy).toHaveBeenCalledTimes(3); // Stopped
  });

  it('should reset key states and timers on window blur', () => {
    const moveSpy = vi.spyOn(state, 'move');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(moveSpy).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('blur'));

    vi.advanceTimersByTime(500);
    expect(moveSpy).toHaveBeenCalledTimes(1); // Stopped repeating
  });

  it('should parse swipe events into directions', () => {
    const moveSpy = vi.spyOn(state, 'move');

    // Simulate touching start
    const startEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as any],
    });
    container.dispatchEvent(startEvent);

    // Simulate swiping down
    const endEvent = new TouchEvent('touchend', {
      changedTouches: [{ clientX: 100, clientY: 200 } as any],
    });
    container.dispatchEvent(endEvent);

    expect(moveSpy).toHaveBeenCalledWith('down', 'swipe');
  });
});
