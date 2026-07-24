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

  it('should support WASD, Vim keys, and physical codes', () => {
    const moveSpy = vi.spyOn(state, 'move');

    // Test lowercase w
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
    expect(moveSpy).toHaveBeenCalledWith('up', 'keyboard');

    // Test lowercase d
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
    expect(moveSpy).toHaveBeenCalledWith('right', 'keyboard');

    // Test Vim keys (hjkl)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));
    expect(moveSpy).toHaveBeenCalledWith('left', 'keyboard');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    expect(moveSpy).toHaveBeenCalledWith('down', 'keyboard');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    expect(moveSpy).toHaveBeenCalledWith('up', 'keyboard');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    expect(moveSpy).toHaveBeenCalledWith('right', 'keyboard');

    // Test physical scan codes by defining code property manually for jsdom
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'l' }));
    moveSpy.mockClear();
    const codeEvent = new KeyboardEvent('keydown');
    Object.defineProperty(codeEvent, 'code', { value: 'KeyA' });
    window.dispatchEvent(codeEvent);
    expect(moveSpy).toHaveBeenCalledWith('left', 'keyboard');
  });

  it('should handle Escape key for pause and dialog actions', () => {
    const screenSpy = vi.spyOn(state, 'setScreen');

    // Escape in playing pauses
    state.setScreen('playing');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(screenSpy).toHaveBeenCalledWith('paused');

    // Escape in paused resumes
    state.setScreen('paused');
    screenSpy.mockClear();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(screenSpy).toHaveBeenCalledWith('playing');
  });

  it('should navigate menu focus when not playing', () => {
    state.setScreen('start');

    // Create focusable buttons in document body
    const btn1 = document.createElement('button');
    btn1.className = 'focusable primary';
    btn1.id = 'test-btn-1';
    const btn2 = document.createElement('button');
    btn2.className = 'focusable';
    btn2.id = 'test-btn-2';

    // Mock offsetParent for jsdom filter
    Object.defineProperty(btn1, 'offsetParent', { get: () => document.body });
    Object.defineProperty(btn2, 'offsetParent', { get: () => document.body });

    document.body.appendChild(btn1);
    document.body.appendChild(btn2);

    // Initial state: activeElement is body
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(document.activeElement).toBe(btn1); // Focuses primary first

    // Press ArrowDown again to focus next element
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(document.activeElement).toBe(btn2);

    // Press Enter to trigger click
    const clickSpy = vi.spyOn(btn2, 'click');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(clickSpy).toHaveBeenCalled();

    // Clean up DOM
    document.body.removeChild(btn1);
    document.body.removeChild(btn2);
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
