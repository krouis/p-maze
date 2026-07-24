import { Direction, MoveSource } from './inputTypes';
import { GameState } from '../game/GameState';

export class InputController {
  private state: GameState;
  private container: HTMLElement;

  // Keyboard state
  private activeKeys = new Set<string>();
  private repeatTimeout: number | null = null;
  private repeatInterval: number | null = null;
  private currentDirection: Direction | null = null;

  // Swipe gesture state
  private touchStartX = 0;
  private touchStartY = 0;
  private minSwipeDistance = 35; // px

  // D-pad repeating state
  private dpadRepeatInterval: number | null = null;

  // Mappings
  private keyMap: { [key: string]: Direction } = {
    // Arrow keys
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    // WASD (case insensitive handled dynamically)
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right',
    W: 'up',
    S: 'down',
    A: 'left',
    D: 'right',
    // HJKL
    k: 'up',
    j: 'down',
    h: 'left',
    l: 'right',
    K: 'up',
    J: 'down',
    H: 'left',
    L: 'right',
    // Physical Code Mappings (layout & shift independent)
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
    KeyK: 'up',
    KeyJ: 'down',
    KeyH: 'left',
    KeyL: 'right',
  };

  constructor(state: GameState, container: HTMLElement) {
    this.state = state;
    this.container = container;

    // Attach listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);

    // Swipe listeners
    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.container.addEventListener('touchend', this.handleTouchEnd, { passive: false });
  }

  /**
   * Cleans up event listeners and timers.
   */
  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);

    this.container.removeEventListener('touchstart', this.handleTouchStart);
    this.container.removeEventListener('touchmove', this.handleTouchMove);
    this.container.removeEventListener('touchend', this.handleTouchEnd);

    this.clearRepeatTimers();
    this.clearDpadRepeat();
  }

  /**
   * Triggers a single movement step from touch or keyboard.
   */
  triggerMove(direction: Direction, source: MoveSource) {
    if (this.state.screen === 'playing') {
      this.state.move(direction, source);
    }
  }

  /**
   * Triggers continuous move on hold.
   */
  startTouchHold(direction: Direction) {
    this.clearDpadRepeat();
    this.triggerMove(direction, 'touch');

    // Setup repeating touch hold
    this.dpadRepeatInterval = window.setInterval(() => {
      this.triggerMove(direction, 'touch');
    }, 110);
  }

  /**
   * Clears the continuous hold timer.
   */
  stopTouchHold() {
    this.clearDpadRepeat();
  }

  private clearDpadRepeat() {
    if (this.dpadRepeatInterval !== null) {
      clearInterval(this.dpadRepeatInterval);
      this.dpadRepeatInterval = null;
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // If typing in an input or settings, do not capture (unless it is a navigation key)
    if (
      document.activeElement?.tagName === 'INPUT' &&
      e.key !== 'ArrowUp' &&
      e.key !== 'ArrowDown' &&
      e.key !== 'ArrowLeft' &&
      e.key !== 'ArrowRight' &&
      e.key !== 'Enter' &&
      e.key !== 'Escape'
    ) {
      return;
    }

    // Handle Escape for pause/back navigation
    if (e.key === 'Escape') {
      e.preventDefault();
      this.handleEscapeKey();
      return;
    }

    // Handle Enter for menu activations
    if (e.key === 'Enter') {
      if (this.state.screen !== 'playing') {
        const current = document.activeElement as HTMLElement;
        if (current && current.classList.contains('focusable')) {
          e.preventDefault();
          current.click();
          return;
        }
      }
    }

    const dir = this.keyMap[e.code] || this.keyMap[e.key];
    if (!dir) return;

    // Prevent default scrolling for game controls
    e.preventDefault();

    // If we are not currently playing, Arrow keys navigate menu focus!
    if (this.state.screen !== 'playing') {
      this.navigateMenuFocus(dir);
      return;
    }

    const keyId = e.code || e.key;
    if (this.activeKeys.has(keyId)) return;
    this.activeKeys.add(keyId);

    // If changing direction or starting fresh
    if (this.currentDirection !== dir) {
      this.clearRepeatTimers();
      this.currentDirection = dir;

      // Immediate step
      this.triggerMove(dir, 'keyboard');

      // Set repeat timeout (200ms delay)
      this.repeatTimeout = window.setTimeout(() => {
        if (this.currentDirection) {
          this.triggerMove(this.currentDirection, 'keyboard');
        }
        this.repeatInterval = window.setInterval(() => {
          if (this.currentDirection) {
            this.triggerMove(this.currentDirection, 'keyboard');
          }
        }, 110); // 110ms intervals
      }, 200);
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const dir = this.keyMap[e.code] || this.keyMap[e.key];
    if (!dir) return;

    const keyId = e.code || e.key;
    this.activeKeys.delete(keyId);

    // If key released matches active direction, stop repeating
    if (this.currentDirection === dir) {
      this.clearRepeatTimers();

      // Fallback to another pressed key if any are active
      if (this.activeKeys.size > 0) {
        const nextKey = Array.from(this.activeKeys)[this.activeKeys.size - 1];
        const nextDir = this.keyMap[nextKey];
        if (nextDir) {
          this.currentDirection = nextDir;
          this.triggerMove(nextDir, 'keyboard');
        }
      }
    }
  };

  private handleBlur = () => {
    // Reset everything on blur to prevent sticking keys
    this.activeKeys.clear();
    this.clearRepeatTimers();
  };

  private clearRepeatTimers() {
    if (this.repeatTimeout !== null) {
      clearTimeout(this.repeatTimeout);
      this.repeatTimeout = null;
    }
    if (this.repeatInterval !== null) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
    }
    this.currentDirection = null;
  }

  // Touch Swipe handlers
  private handleTouchStart = (e: TouchEvent) => {
    if (this.state.screen !== 'playing') return;
    // Don't intercept touches on control buttons/D-pad elements
    if ((e.target as HTMLElement).closest('button, .d-pad-btn')) return;

    // Prevent default to disable double-tap zooming on game canvas
    e.preventDefault();

    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (this.state.screen !== 'playing') return;
    if ((e.target as HTMLElement).closest('button, .d-pad-btn')) return;

    e.preventDefault();
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (this.state.screen !== 'playing') return;
    if ((e.target as HTMLElement).closest('button, .d-pad-btn')) return;

    e.preventDefault();

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - this.touchStartX;
    const diffY = touch.clientY - this.touchStartY;

    // Determine swipe direction if distance exceeds threshold
    if (Math.max(Math.abs(diffX), Math.abs(diffY)) > this.minSwipeDistance) {
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal
        if (diffX > 0) {
          this.triggerMove('right', 'swipe');
        } else {
          this.triggerMove('left', 'swipe');
        }
      } else {
        // Vertical
        if (diffY > 0) {
          this.triggerMove('down', 'swipe');
        } else {
          this.triggerMove('up', 'swipe');
        }
      }
    }
  };

  private navigateMenuFocus(direction: Direction) {
    const focusables = Array.from(document.querySelectorAll('.focusable')).filter((el) => {
      const htmlEl = el as HTMLElement;
      return htmlEl.offsetParent !== null && !htmlEl.closest('.hidden');
    }) as HTMLElement[];

    if (focusables.length === 0) return;

    const current = document.activeElement as HTMLElement;
    let idx = focusables.indexOf(current);

    // If active element is not in our list, find the first primary one or first overall
    if (idx === -1) {
      const primary = focusables.find((el) => el.classList.contains('primary'));
      if (primary) {
        primary.focus();
        return;
      }
      focusables[0].focus();
      return;
    }

    if (direction === 'down' || direction === 'right') {
      const next = idx < focusables.length - 1 ? idx + 1 : 0;
      focusables[next].focus();
    } else if (direction === 'up' || direction === 'left') {
      const prev = idx > 0 ? idx - 1 : focusables.length - 1;
      focusables[prev].focus();
    }
  }

  private handleEscapeKey() {
    const settingsDialog = document.getElementById('dialog-settings') as HTMLDialogElement;
    if (settingsDialog && settingsDialog.open) {
      document.getElementById('btn-settings-close')?.click();
      return;
    }

    if (this.state.screen === 'playing') {
      this.state.setScreen('paused');
    } else if (this.state.screen === 'paused') {
      this.state.setScreen('playing');
    }
  }
}
