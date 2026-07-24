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
    // If typing in an input or settings, do not capture
    if (document.activeElement?.tagName === 'INPUT') return;

    const dir = this.keyMap[e.key];
    if (!dir) return;

    // Prevent default scrolling for game controls
    e.preventDefault();

    if (this.activeKeys.has(e.key)) return;
    this.activeKeys.add(e.key);

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
    const dir = this.keyMap[e.key];
    if (!dir) return;

    this.activeKeys.delete(e.key);

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
}
