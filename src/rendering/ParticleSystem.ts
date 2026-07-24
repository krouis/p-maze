import { LevelTheme } from '../themes/themeTypes';
import { SeededRandom } from '../maze/SeededRandom';

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number; // 0 to 1
  decay: number;
  shape: 'circle' | 'square' | 'sparkle';
};

export class ParticleSystem {
  private particles: Particle[] = [];
  private rng = new SeededRandom('particles-init');

  constructor() {}

  /**
   * Resets particles.
   */
  clear() {
    this.particles = [];
  }

  /**
   * Spawns celebration confetti at a specific coordinate.
   */
  spawnCelebration(x: number, y: number, theme: LevelTheme, count = 100) {
    const colors = [theme.player, theme.exit, theme.wallHighlight, '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = this.rng.next() * Math.PI * 2;
      const speed = this.rng.next() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Slight upward bias
        size: this.rng.nextInt(4, 8),
        color: this.rng.choose(colors),
        alpha: 1.0,
        life: 1.0,
        decay: this.rng.next() * 0.02 + 0.015,
        shape: this.rng.next() > 0.5 ? 'square' : 'circle',
      });
    }
  }

  /**
   * Spawns ambient particles inside the canvas bounds.
   */
  spawnAmbient(width: number, height: number, theme: LevelTheme, reducedMotion: boolean) {
    if (reducedMotion) return;
    if (this.particles.length > 30) return; // Keep ambient count low

    // Spawn a particle at a random boundary (top or bottom depending on theme wind)
    const shapes: ('circle' | 'square' | 'sparkle')[] = ['circle', 'square'];
    if (theme.id === 'neon-arcade' || theme.id === 'dark-space') {
      shapes.push('sparkle');
    }

    const colors = [theme.wallHighlight, theme.player, theme.exit];

    this.particles.push({
      x: this.rng.next() * width,
      y: height + 10, // Start below screen
      vx: (this.rng.next() - 0.5) * 0.5,
      vy: -(this.rng.next() * 0.8 + 0.3), // Float upwards
      size: this.rng.nextInt(2, 6),
      color: this.rng.choose(colors),
      alpha: this.rng.next() * 0.5 + 0.2,
      life: 1.0,
      decay: this.rng.next() * 0.005 + 0.002,
      shape: this.rng.choose(shapes),
    });
  }

  /**
   * Updates particle positions and scales life.
   */
  update(dt: number, width: number, height: number, gravity = 0.1) {
    // Convert dt to frames (assuming 60fps, 1 frame = 16.67ms)
    const frames = dt / 16.67;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * frames;
      p.y += p.vy * frames;

      // If it's a celebration particle, apply gravity and air resistance
      if (p.decay > 0.01) {
        p.vy += gravity * frames;
        p.vx *= Math.pow(0.98, frames);
        p.vy *= Math.pow(0.98, frames);
      }

      p.life -= p.decay * frames;
      p.alpha = Math.max(0, p.life);

      // Remove dead or offscreen particles
      if (p.life <= 0 || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Renders the active particles on a Canvas 2D Context.
   */
  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'sparkle') {
        // Draw cross star
        ctx.beginPath();
        ctx.moveTo(p.x - p.size, p.y);
        ctx.lineTo(p.x + p.size, p.y);
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
