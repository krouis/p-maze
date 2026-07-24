import { GameState } from '../game/GameState';
import { CanvasRenderer } from '../rendering/CanvasRenderer';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { AudioEngine } from '../audio/AudioEngine';
import { InputController } from '../input/InputController';
import { ScreenManager } from './ScreenManager';

export class App {
  private state: GameState;
  private particles: ParticleSystem;
  private renderer: CanvasRenderer;
  private audio: AudioEngine;
  private inputs: InputController;
  private screens: ScreenManager;

  // Timers and loops
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private autoNextLevelTimer: number | null = null;

  // Hold-to-reset states
  private resetHoldTime = 0;
  private isHoldingReset = false;
  private resetHoldDuration = 2000; // 2 seconds

  constructor() {
    this.state = new GameState();
    this.particles = new ParticleSystem();
    this.audio = new AudioEngine();
    this.screens = new ScreenManager();

    // Setup rendering container
    const container = document.getElementById('canvas-container')!;
    this.renderer = new CanvasRenderer(container, this.state, this.particles);
    this.inputs = new InputController(this.state, document.body);

    this.bindCallbacks();
    this.bindDOMEvents();
    this.applySettingsToDOM();

    // Start rendering and updates
    this.lastTime = performance.now();
    this.loop(this.lastTime);

    // Initial screen setup
    this.screens.showScreen(this.state.screen);
    this.updateContinueButtonVisibility();
    this.drawStartScreenCharacter();

    // Expose app instance globally for E2E testing assertions
    (window as any).app = this;
  }

  /**
   * Binds GameState callbacks to UI and Audio.
   */
  private bindCallbacks() {
    this.state.onSoundTrigger = (effect) => {
      this.audio.playSFX(effect);
      if (effect === 'success') {
        this.renderer.triggerCelebration();
        this.triggerAutoNextLevel();
      }
    };

    this.state.onLevelChange = (level) => {
      const label = document.getElementById('label-level')!;
      label.textContent = `Level ${level}`;
      this.audio.setupSequencerForLevel(level);
      this.renderer.resize(); // Recalculate cell sizes for new maze
    };

    this.state.onScreenChange = (screen) => {
      this.screens.showScreen(screen);
      this.updateContinueButtonVisibility();

      // Stop/start music sequences
      if (screen === 'playing') {
        this.audio.resume();
      } else if (screen === 'paused' || screen === 'start') {
        this.audio.setupSequencerForLevel(this.state.level); // reload
      }

      this.clearAutoNextLevel();
    };
  }

  /**
   * Setup UI buttons event bindings.
   */
  private bindDOMEvents() {
    // Start Screen
    document.getElementById('btn-play')!.addEventListener('click', async () => {
      this.audio.playSFX('click');
      await this.audio.start();
      this.state.initLevel(1, false);
      this.state.setScreen('playing');
    });

    const btnContinue = document.getElementById('btn-continue')!;
    btnContinue.addEventListener('click', async () => {
      this.audio.playSFX('click');
      await this.audio.start();
      // Resume current saved level and position
      this.state.loadFromStorage();
      this.state.initLevel(this.state.level, true);
      this.state.setScreen('playing');
    });

    document.getElementById('btn-start-settings')!.addEventListener('click', () => {
      this.audio.playSFX('click');
      this.screens.openSettings('btn-start-settings');
    });

    // Game Screen Header Actions
    document.getElementById('btn-hint')!.addEventListener('click', () => {
      this.state.triggerHint();
    });

    document.getElementById('btn-restart')!.addEventListener('click', () => {
      this.audio.playSFX('click');
      this.state.restartLevel();
    });

    const btnSound = document.getElementById('btn-sound-toggle')!;
    btnSound.addEventListener('click', () => {
      // Toggle both music and sfx simultaneously via master
      const enabled = !this.state.settings.musicEnabled || !this.state.settings.soundEnabled;
      this.state.settings.musicEnabled = enabled;
      this.state.settings.soundEnabled = enabled;

      this.audio.setMusicEnabled(enabled);
      this.audio.setSFXEnabled(enabled);

      this.audio.playSFX('click');
      this.applySettingsToDOM();
      this.state.saveToStorage();
    });

    document.getElementById('btn-pause')!.addEventListener('click', () => {
      this.audio.playSFX('click');
      this.state.setScreen('paused');
    });

    // Pause Screen Actions
    document.getElementById('btn-resume')!.addEventListener('click', () => {
      this.audio.playSFX('click');
      this.state.setScreen('playing');
    });

    document.getElementById('btn-pause-restart')!.addEventListener('click', () => {
      this.audio.playSFX('click');
      this.state.restartLevel();
    });

    document.getElementById('btn-home')!.addEventListener('click', () => {
      this.audio.playSFX('click');
      this.audio.suspend();
      this.state.setScreen('start');
    });

    document.getElementById('btn-pause-settings')!.addEventListener('click', () => {
      this.audio.playSFX('click');
      this.screens.openSettings('btn-pause-settings');
    });

    // Completion Screen Actions
    document.getElementById('btn-next')!.addEventListener('click', () => {
      this.audio.playSFX('click');
      this.clearAutoNextLevel();
      this.state.nextLevel();
    });

    document.getElementById('btn-replay')!.addEventListener('click', () => {
      this.audio.playSFX('click');
      this.clearAutoNextLevel();
      this.state.restartLevel();
    });

    // Mobile D-pad hooks
    this.bindDpadButton('dpad-up', 'up');
    this.bindDpadButton('dpad-left', 'left');
    this.bindDpadButton('dpad-right', 'right');
    this.bindDpadButton('dpad-down', 'down');

    // Settings closing
    document.getElementById('btn-settings-close')!.addEventListener('click', () => {
      this.audio.playSFX('click');
      this.screens.closeSettings();
    });

    // Settings Toggle Elements
    this.bindCheckbox('chk-music', (val) => {
      this.state.settings.musicEnabled = val;
      this.audio.setMusicEnabled(val);
      this.state.saveToStorage();
    });

    this.bindCheckbox('chk-sfx', (val) => {
      this.state.settings.soundEnabled = val;
      this.audio.setSFXEnabled(val);
      this.state.saveToStorage();
    });

    this.bindCheckbox('chk-motion', (val) => {
      this.state.settings.reducedMotion = val;
      this.applyReducedMotionStyle(val);
      this.state.saveToStorage();
    });

    this.bindCheckbox('chk-contrast', (val) => {
      this.state.settings.highContrast = val;
      this.applyHighContrastStyle(val);
      this.renderer.resize(); // Redraw maze with new high-contrast palette
      this.state.saveToStorage();
    });

    this.bindCheckbox('chk-hints', (val) => {
      this.state.settings.automaticHints = val;
      this.state.saveToStorage();
    });

    this.bindCheckbox('chk-autonext', (val) => {
      this.state.settings.automaticNextLevel = val;
      this.state.saveToStorage();
    });

    // Hold-to-reset progress triggers
    const btnResetHold = document.getElementById('btn-reset-hold')!;
    btnResetHold.addEventListener('mousedown', this.startResetHold);
    btnResetHold.addEventListener('touchstart', this.startResetHold, { passive: true });

    window.addEventListener('mouseup', this.stopResetHold);
    window.addEventListener('touchend', this.stopResetHold, { passive: true });

    // Handle visibility changes (Auto-pause on background)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.state.screen === 'playing') {
          this.state.setScreen('paused');
        }
        this.audio.suspend();
      } else {
        if (this.state.screen === 'playing') {
          this.audio.resume();
        }
      }
    });
  }

  private bindDpadButton(id: string, dir: 'up' | 'down' | 'left' | 'right') {
    const btn = document.getElementById(id)!;

    // Support press-and-hold repeating movement
    btn.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        this.inputs.startTouchHold(dir);
      },
      { passive: false },
    );

    btn.addEventListener(
      'touchend',
      (e) => {
        e.preventDefault();
        this.inputs.stopTouchHold();
      },
      { passive: false },
    );

    btn.addEventListener('touchcancel', () => {
      this.inputs.stopTouchHold();
    });

    // Support simple mouse clicks on laptop touch pads
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.inputs.startTouchHold(dir);
    });

    btn.addEventListener('mouseup', () => {
      this.inputs.stopTouchHold();
    });

    btn.addEventListener('mouseleave', () => {
      this.inputs.stopTouchHold();
    });
  }

  private bindCheckbox(id: string, callback: (val: boolean) => void) {
    const chk = document.getElementById(id) as HTMLInputElement;
    chk.addEventListener('change', () => {
      this.audio.playSFX('click');
      callback(chk.checked);
    });
  }

  /**
   * Reads settings from state and updates DOM selectors.
   */
  private applySettingsToDOM() {
    const settings = this.state.settings;

    (document.getElementById('chk-music') as HTMLInputElement).checked = settings.musicEnabled;
    (document.getElementById('chk-sfx') as HTMLInputElement).checked = settings.soundEnabled;
    (document.getElementById('chk-motion') as HTMLInputElement).checked = settings.reducedMotion;
    (document.getElementById('chk-contrast') as HTMLInputElement).checked = settings.highContrast;
    (document.getElementById('chk-hints') as HTMLInputElement).checked = settings.automaticHints;
    (document.getElementById('chk-autonext') as HTMLInputElement).checked =
      settings.automaticNextLevel;

    // Apply header speaker icon state
    const btnSound = document.getElementById('btn-sound-toggle')!;
    if (settings.musicEnabled && settings.soundEnabled) {
      btnSound.textContent = '🔊';
      btnSound.setAttribute('aria-label', 'Mute all sounds');
    } else {
      btnSound.textContent = '🔇';
      btnSound.setAttribute('aria-label', 'Unmute all sounds');
    }

    this.applyReducedMotionStyle(settings.reducedMotion);
    this.applyHighContrastStyle(settings.highContrast);
  }

  private applyReducedMotionStyle(reduced: boolean) {
    if (reduced) {
      document.body.classList.add('reduced-motion-mode');
    } else {
      document.body.classList.remove('reduced-motion-mode');
    }
  }

  private applyHighContrastStyle(hc: boolean) {
    if (hc) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
  }

  private updateContinueButtonVisibility() {
    const btn = document.getElementById('btn-continue')!;
    const saved =
      this.state.level > 1 ||
      this.state.playerPosition.row > 0 ||
      this.state.playerPosition.column > 0;
    if (saved) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  }

  // Hold-to-reset handlers
  private startResetHold = () => {
    this.isHoldingReset = true;
    this.resetHoldTime = 0;
  };

  private stopResetHold = () => {
    this.isHoldingReset = false;
    this.resetHoldTime = 0;
    const fill = document.getElementById('reset-progress-fill')!;
    fill.style.width = '0%';
  };

  /**
   * Sets up 5-second automatic progression on level completion.
   */
  private triggerAutoNextLevel() {
    this.clearAutoNextLevel();
    if (!this.state.settings.automaticNextLevel) return;

    this.autoNextLevelTimer = window.setTimeout(() => {
      if (this.state.screen === 'completed') {
        this.state.nextLevel();
      }
    }, 5000);
  }

  private clearAutoNextLevel() {
    if (this.autoNextLevelTimer !== null) {
      clearTimeout(this.autoNextLevelTimer);
      this.autoNextLevelTimer = null;
    }
  }

  /**
   * Main game loop runner.
   */
  private loop = (time: number) => {
    const dt = time - this.lastTime;
    this.lastTime = time;

    // Handle reset holding progress
    if (this.isHoldingReset) {
      this.resetHoldTime += dt;
      const fill = document.getElementById('reset-progress-fill')!;
      const percent = Math.min(100, (this.resetHoldTime / this.resetHoldDuration) * 100);
      fill.style.width = `${percent}%`;

      if (this.resetHoldTime >= this.resetHoldDuration) {
        this.isHoldingReset = false;
        this.resetHoldTime = 0;
        fill.style.width = '0%';

        // Execute reset
        this.state.resetGame();
        this.applySettingsToDOM();
        this.screens.closeSettings();
        this.audio.playSFX('success');
      }
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Draws a static animated character on the start screen canvas.
   */
  private drawStartScreenCharacter() {
    const canvas = document.getElementById('canvas-character') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Run simple sprite animation on the main screen
    let frame = 0;
    const animate = () => {
      if (this.state.screen !== 'start') return;
      ctx.clearRect(0, 0, 100, 100);

      // Body (Square yellow character)
      const size = 48;
      const x = 50;
      const y = 50 + 4 * Math.sin(frame * 0.15); // breathing float

      ctx.save();
      ctx.translate(x, y);

      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(-size / 2, -size / 2, size, size);

      // Accent top
      ctx.fillStyle = '#ffea70';
      ctx.fillRect(-size / 2, -size / 2, size, 8);

      // Eyes (white)
      ctx.fillStyle = '#ffffff';
      const eyeSize = 10;
      const eyeSpacing = 8;
      const isBlinking = frame % 100 < 5; // blink frames

      if (isBlinking) {
        ctx.fillStyle = '#ffea70';
        ctx.fillRect(-eyeSpacing - eyeSize / 2, -2, eyeSize, 3);
        ctx.fillRect(eyeSpacing - eyeSize / 2, -2, eyeSize, 3);
      } else {
        ctx.fillRect(-eyeSpacing - eyeSize / 2, -5, eyeSize, eyeSize);
        ctx.fillRect(eyeSpacing - eyeSize / 2, -5, eyeSize, eyeSize);

        // Pupils
        ctx.fillStyle = '#000000';
        ctx.fillRect(-eyeSpacing - 1, -3, 4, 4);
        ctx.fillRect(eyeSpacing - 1, -3, 4, 4);
      }

      ctx.restore();

      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Shuts down app components.
   */
  destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.clearAutoNextLevel();
    this.renderer.destroy();
    this.inputs.destroy();
  }
}
