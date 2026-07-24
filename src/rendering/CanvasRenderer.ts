import { GameState } from '../game/GameState';
import { Position } from '../maze/mazeTypes';
import { getThemeForLevel } from '../themes/themes';
import { ParticleSystem } from './ParticleSystem';

export class CanvasRenderer {
  private container: HTMLElement;
  private staticCanvas: HTMLCanvasElement;
  private dynamicCanvas: HTMLCanvasElement;
  private staticCtx: CanvasRenderingContext2D;
  private dynamicCtx: CanvasRenderingContext2D;

  private state: GameState;
  private particles: ParticleSystem;

  // Layout sizing
  private cellSize = 32;
  private offsetX = 0;
  private offsetY = 0;
  private dpr = 1;

  // Animation states
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private blinkTimer = 0;
  private isBlinking = false;
  private blinkDuration = 150; // ms
  private pulseTime = 0;

  constructor(container: HTMLElement, state: GameState, particles: ParticleSystem) {
    this.container = container;
    this.state = state;
    this.particles = particles;

    // Create static canvas
    this.staticCanvas = document.createElement('canvas');
    this.staticCanvas.style.position = 'absolute';
    this.staticCanvas.style.top = '0';
    this.staticCanvas.style.left = '0';
    this.staticCanvas.style.zIndex = '1';
    this.staticCanvas.style.imageRendering = 'pixelated';

    // Create dynamic canvas
    this.dynamicCanvas = document.createElement('canvas');
    this.dynamicCanvas.style.position = 'absolute';
    this.dynamicCanvas.style.top = '0';
    this.dynamicCanvas.style.left = '0';
    this.dynamicCanvas.style.zIndex = '2';
    this.dynamicCanvas.style.imageRendering = 'pixelated';

    this.container.appendChild(this.staticCanvas);
    this.container.appendChild(this.dynamicCanvas);

    this.staticCtx = this.staticCanvas.getContext('2d')!;
    this.dynamicCtx = this.dynamicCanvas.getContext('2d')!;

    window.addEventListener('resize', this.handleResize);
    this.resize();
  }

  /**
   * Cleans up listeners and animations.
   */
  destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.stopLoop();
  }

  private handleResize = () => {
    this.resize();
  };

  /**
   * Resizes canvases matching container bounds and scales for DPR.
   */
  resize() {
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || 320;
    const height = rect.height || 320;

    this.dpr = window.devicePixelRatio || 1;

    // Configure static canvas
    this.staticCanvas.width = width * this.dpr;
    this.staticCanvas.height = height * this.dpr;
    this.staticCanvas.style.width = `${width}px`;
    this.staticCanvas.style.height = `${height}px`;

    // Configure dynamic canvas
    this.dynamicCanvas.width = width * this.dpr;
    this.dynamicCanvas.height = height * this.dpr;
    this.dynamicCanvas.style.width = `${width}px`;
    this.dynamicCanvas.style.height = `${height}px`;

    // Reset scaling
    this.staticCtx.resetTransform();
    this.staticCtx.scale(this.dpr, this.dpr);
    this.dynamicCtx.resetTransform();
    this.dynamicCtx.scale(this.dpr, this.dpr);

    // Disable antialiasing for sharp pixel art
    this.staticCtx.imageSmoothingEnabled = false;
    this.dynamicCtx.imageSmoothingEnabled = false;

    // Calculate layout sizing
    const maze = this.state.maze;
    if (maze) {
      const maxCellSize = Math.floor(Math.min(width / maze.columns, height / maze.rows));
      this.cellSize = Math.max(16, maxCellSize);

      this.offsetX = Math.floor((width - this.cellSize * maze.columns) / 2);
      this.offsetY = Math.floor((height - this.cellSize * maze.rows) / 2);
    }

    this.drawStaticMaze();
  }

  /**
   * Draws the unchanging background, floor, start cell, and walls.
   */
  drawStaticMaze() {
    const maze = this.state.maze;
    if (!maze) return;

    const theme = getThemeForLevel(this.state.level, this.state.settings.highContrast);

    const width = this.staticCanvas.width / this.dpr;
    const height = this.staticCanvas.height / this.dpr;

    // Clear and fill background
    this.staticCtx.fillStyle = theme.background;
    this.staticCtx.fillRect(0, 0, width, height);

    // Draw floor
    this.staticCtx.fillStyle = theme.floor;
    this.staticCtx.fillRect(
      this.offsetX,
      this.offsetY,
      this.cellSize * maze.columns,
      this.cellSize * maze.rows,
    );

    // Draw start cell indicator (slightly lighter pixel patch)
    this.staticCtx.fillStyle = theme.start;
    this.staticCtx.fillRect(
      this.offsetX + maze.start.column * this.cellSize + 2,
      this.offsetY + maze.start.row * this.cellSize + 2,
      this.cellSize - 4,
      this.cellSize - 4,
    );

    // Draw walls
    this.staticCtx.fillStyle = theme.wall;
    const wallThickness = Math.max(2, Math.floor(this.cellSize * 0.15));

    for (let r = 0; r < maze.rows; r++) {
      for (let c = 0; c < maze.columns; c++) {
        const cell = maze.cells[r][c];
        const x = this.offsetX + c * this.cellSize;
        const y = this.offsetY + r * this.cellSize;

        // Draw individual walls
        if (cell.walls.up) {
          this.staticCtx.fillRect(x, y, this.cellSize, wallThickness);
        }
        if (cell.walls.down) {
          this.staticCtx.fillRect(
            x,
            y + this.cellSize - wallThickness,
            this.cellSize,
            wallThickness,
          );
        }
        if (cell.walls.left) {
          this.staticCtx.fillRect(x, y, wallThickness, this.cellSize);
        }
        if (cell.walls.right) {
          this.staticCtx.fillRect(
            x + this.cellSize - wallThickness,
            y,
            wallThickness,
            this.cellSize,
          );
        }
      }
    }

    // Optional Wall 3D highlight (for non high-contrast)
    if (!this.state.settings.highContrast) {
      this.staticCtx.fillStyle = theme.wallHighlight;
      const highlightThickness = Math.max(1, Math.floor(wallThickness / 2));

      for (let r = 0; r < maze.rows; r++) {
        for (let c = 0; c < maze.columns; c++) {
          const cell = maze.cells[r][c];
          const x = this.offsetX + c * this.cellSize;
          const y = this.offsetY + r * this.cellSize;

          if (cell.walls.up) {
            this.staticCtx.fillRect(x, y, this.cellSize, highlightThickness);
          }
          if (cell.walls.left) {
            this.staticCtx.fillRect(x, y, highlightThickness, this.cellSize);
          }
        }
      }
    }
  }

  /**
   * Start rendering loop.
   */
  startLoop() {
    this.lastTime = performance.now();
    this.stopLoop();
    this.loop(this.lastTime);
  }

  /**
   * Stop rendering loop.
   */
  stopLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (time: number) => {
    const dt = time - this.lastTime;
    this.lastTime = time;

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Updates animations and system tickers.
   */
  private update(dt: number) {
    // Limit delta time to prevent physics/animation jumps on lag
    const clampedDt = Math.min(dt, 100);

    // Update game state timers
    this.state.update(clampedDt);

    const width = this.dynamicCanvas.width / this.dpr;
    const height = this.dynamicCanvas.height / this.dpr;
    const theme = getThemeForLevel(this.state.level, this.state.settings.highContrast);

    // Update particles
    this.particles.update(clampedDt, width, height);

    // Ambient particles spawning
    this.particles.spawnAmbient(width, height, theme, this.state.settings.reducedMotion);

    // Exit pulse pulseTime
    this.pulseTime += clampedDt;

    // Handle blinking logic for character eyes
    this.blinkTimer += clampedDt;
    if (this.isBlinking) {
      if (this.blinkTimer >= this.blinkDuration) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    } else {
      // Roll random blink chance every 3-5 seconds
      if (this.blinkTimer >= 3000) {
        if (Math.random() < 0.3) {
          this.isBlinking = true;
          this.blinkTimer = 0;
        } else {
          this.blinkTimer = 2500; // Retry quickly
        }
      }
    }
  }

  /**
   * Main render call for dynamic entities.
   */
  private render() {
    const width = this.dynamicCanvas.width / this.dpr;
    const height = this.dynamicCanvas.height / this.dpr;

    // Clear dynamic context
    this.dynamicCtx.clearRect(0, 0, width, height);

    if (this.state.screen !== 'playing' && this.state.screen !== 'completed') return;

    this.drawExit();
    this.drawHint();
    this.drawPlayer();

    // Draw particles (ambient + confetti)
    this.particles.render(this.dynamicCtx);
  }

  /**
   * Draws the exit portal with concentric swirling pixel rings.
   */
  private drawExit() {
    const maze = this.state.maze;
    if (!maze) return;

    const theme = getThemeForLevel(this.state.level, this.state.settings.highContrast);
    const x = this.offsetX + maze.exit.column * this.cellSize + this.cellSize / 2;
    const y = this.offsetY + maze.exit.row * this.cellSize + this.cellSize / 2;

    const maxRadius = this.cellSize * 0.42;
    const ctx = this.dynamicCtx;

    ctx.save();

    if (this.state.settings.reducedMotion) {
      // Static simplified circle
      ctx.fillStyle = theme.exit;
      ctx.beginPath();
      ctx.arc(x, y, maxRadius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Dynamic scaling pulses
      const pulseFactor = 0.12 * Math.sin(this.pulseTime * 0.006);
      const outerRadius = maxRadius * (1.0 + pulseFactor);
      const innerRadius = maxRadius * 0.5 * (1.0 - pulseFactor);

      // Outer glowing ring
      ctx.fillStyle = theme.exit;
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
      ctx.fill();

      // Middle contrast ring
      ctx.fillStyle = theme.floor;
      ctx.beginPath();
      ctx.arc(x, y, outerRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      // Inner glowing core
      ctx.fillStyle = theme.wallHighlight;
      ctx.beginPath();
      ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draws the hint path breadcrumbs.
   */
  private drawHint() {
    if (!this.state.showHint) return;

    const theme = getThemeForLevel(this.state.level, this.state.settings.highContrast);
    const ctx = this.dynamicCtx;
    ctx.save();

    // Show next 3 steps along path
    const maxHintSteps = 3;
    const pathSteps = this.state.hintPath.slice(0, maxHintSteps + 1);

    // Calculate alpha fading over duration
    const timeLeft = this.state.hintMaxDuration - this.state.hintActiveTime;
    const fadeThreshold = 800; // start fading at last 800ms
    const alpha = timeLeft < fadeThreshold ? timeLeft / fadeThreshold : 1.0;

    ctx.globalAlpha = Math.max(0, Math.min(1.0, alpha)) * 0.75;
    ctx.fillStyle = theme.player;

    for (let i = 1; i < pathSteps.length; i++) {
      const step = pathSteps[i];
      const cx = this.offsetX + step.column * this.cellSize + this.cellSize / 2;
      const cy = this.offsetY + step.row * this.cellSize + this.cellSize / 2;

      const size = this.state.settings.reducedMotion
        ? 6
        : 6 + 2 * Math.sin(this.pulseTime * 0.008 + i);

      // Cute square breadcrumb
      ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    }

    ctx.restore();
  }

  /**
   * Draws the player character.
   */
  private drawPlayer() {
    const theme = getThemeForLevel(this.state.level, this.state.settings.highContrast);
    const size = Math.floor(this.cellSize * 0.65);

    // Get animated visual coordinates
    const px = this.offsetX + this.state.visualCol * this.cellSize + this.cellSize / 2;
    const py = this.offsetY + this.state.visualRow * this.cellSize + this.cellSize / 2;

    const ctx = this.dynamicCtx;
    ctx.save();
    ctx.translate(px, py);

    // Breathing squash/stretch scaling
    let scaleX = 1.0;
    let scaleY = 1.0;

    if (!this.state.settings.reducedMotion) {
      if (this.state.isBumping) {
        // Squash on wall hit
        scaleX = 1.15;
        scaleY = 0.85;
      } else {
        // Gentle breathing idle
        const breath = 0.03 * Math.sin(this.pulseTime * 0.005);
        scaleX = 1.0 + breath;
        scaleY = 1.0 - breath;
      }
    }

    ctx.scale(scaleX, scaleY);

    // Draw main body
    ctx.fillStyle = theme.player;
    ctx.fillRect(-size / 2, -size / 2, size, size);

    // Draw accent stripes or eyes
    if (!this.state.settings.highContrast) {
      ctx.fillStyle = theme.playerAccent;
      // Draw a pixel cap/hat or top highlight
      ctx.fillRect(-size / 2, -size / 2, size, Math.max(2, Math.floor(size * 0.15)));
    }

    // Draw Eyes (two white squares with black pupils)
    // Eyes shift slightly depending on movement direction
    let eyeOffsetX = 0;
    let eyeOffsetY = 0;

    if (this.state.isMoving) {
      const from = this.state.moveFrom;
      const to = this.state.moveTo;
      if (to.column > from.column) eyeOffsetX = 2;
      else if (to.column < from.column) eyeOffsetX = -2;
      else if (to.row > from.row) eyeOffsetY = 2;
      else if (to.row < from.row) eyeOffsetY = -2;
    } else if (this.state.isBumping && this.state.bumpDirection) {
      if (this.state.bumpDirection === 'right') eyeOffsetX = 2;
      else if (this.state.bumpDirection === 'left') eyeOffsetX = -2;
      else if (this.state.bumpDirection === 'down') eyeOffsetY = 2;
      else if (this.state.bumpDirection === 'up') eyeOffsetY = -2;
    }

    const eyeSize = Math.max(3, Math.floor(size * 0.22));
    const eyeSpacing = Math.floor(size * 0.18);
    const eyeY = -Math.floor(size * 0.1);

    ctx.fillStyle = '#ffffff';

    if (this.isBlinking) {
      // Draw closed slit eyes
      ctx.fillStyle = theme.playerAccent;
      ctx.fillRect(-eyeSpacing - eyeSize / 2 + eyeOffsetX, eyeY + eyeOffsetY, eyeSize, 1.5);
      ctx.fillRect(eyeSpacing - eyeSize / 2 + eyeOffsetX, eyeY + eyeOffsetY, eyeSize, 1.5);
    } else {
      // Draw open eyes
      const eyeL_X = -eyeSpacing - eyeSize / 2 + eyeOffsetX;
      const eyeR_X = eyeSpacing - eyeSize / 2 + eyeOffsetX;
      const eye_Y = eyeY - eyeSize / 2 + eyeOffsetY;

      // Left eye white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(eyeL_X, eye_Y, eyeSize, eyeSize);
      // Right eye white
      ctx.fillRect(eyeR_X, eye_Y, eyeSize, eyeSize);

      // Pupils (black, looking forward/direction)
      ctx.fillStyle = '#000000';
      const pupilSize = Math.max(1.5, Math.floor(eyeSize / 2));
      const pupilOffsetX = eyeOffsetX > 0 ? 1 : eyeOffsetX < 0 ? -1 : 0;
      const pupilOffsetY = eyeOffsetY > 0 ? 1 : eyeOffsetY < 0 ? -1 : 0;

      ctx.fillRect(
        eyeL_X + eyeSize / 2 - pupilSize / 2 + pupilOffsetX,
        eye_Y + eyeSize / 2 - pupilSize / 2 + pupilOffsetY,
        pupilSize,
        pupilSize,
      );
      ctx.fillRect(
        eyeR_X + eyeSize / 2 - pupilSize / 2 + pupilOffsetX,
        eye_Y + eyeSize / 2 - pupilSize / 2 + pupilOffsetY,
        pupilSize,
        pupilSize,
      );
    }

    ctx.restore();
  }

  /**
   * Spawns celebration explosion at the exit portal location.
   */
  triggerCelebration() {
    const maze = this.state.maze;
    if (!maze) return;
    const x = this.offsetX + maze.exit.column * this.cellSize + this.cellSize / 2;
    const y = this.offsetY + maze.exit.row * this.cellSize + this.cellSize / 2;
    const theme = getThemeForLevel(this.state.level, this.state.settings.highContrast);

    this.particles.spawnCelebration(x, y, theme);
  }

  /**
   * Utility to query active cell size in pixels.
   */
  getCellSize(): number {
    return this.cellSize;
  }

  /**
   * Utility to convert screen touch coords to grid cell coordinates.
   */
  screenToCell(screenX: number, screenY: number): Position | null {
    const rect = this.dynamicCanvas.getBoundingClientRect();
    const x = screenX - rect.left - this.offsetX;
    const y = screenY - rect.top - this.offsetY;

    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    const maze = this.state.maze;
    if (maze && row >= 0 && row < maze.rows && col >= 0 && col < maze.columns) {
      return { row, column: col };
    }
    return null;
  }
}
