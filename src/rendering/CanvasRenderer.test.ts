import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from '../game/GameState';
import { ParticleSystem } from './ParticleSystem';
import { CanvasRenderer } from './CanvasRenderer';

describe('CanvasRenderer & ParticleSystem', () => {
  let container: HTMLDivElement;
  let state: GameState;
  let particles: ParticleSystem;

  beforeEach(() => {
    // Setup Mock DOM
    container = document.createElement('div');
    // Set custom bounds on container
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 400,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    state = new GameState();
    particles = new ParticleSystem();

    // Mock Canvas Context 2D methods
    const contextMock = {
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      resetTransform: vi.fn(),
      imageSmoothingEnabled: false,
    };

    // Override HTMLCanvasElement.prototype.getContext
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((type) => {
      if (type === '2d') return contextMock as any;
      return null;
    });
  });

  it('should initialize and append two canvas layers to the container', () => {
    const renderer = new CanvasRenderer(container, state, particles);

    const canvases = container.querySelectorAll('canvas');
    expect(canvases.length).toBe(2);
    expect(canvases[0].style.position).toBe('absolute');
    expect(canvases[1].style.position).toBe('absolute');

    renderer.destroy();
  });

  it('should compute cell size and offsets on resize', () => {
    const renderer = new CanvasRenderer(container, state, particles);

    // Width and height of container are 400x400.
    // Level 1 is 5x5. Max cell size = 400 / 5 = 80.
    expect(renderer.getCellSize()).toBe(80);

    renderer.destroy();
  });

  it('should convert screen coordinates to cell coordinates correctly', () => {
    const renderer = new CanvasRenderer(container, state, particles);

    // Grid fits 400x400 perfectly (no offset because 400 / 5 = 80 cell size, 5 * 80 = 400)
    const cellAtCorner = renderer.screenToCell(10, 10);
    expect(cellAtCorner).toEqual({ row: 0, column: 0 });

    const cellAtFar = renderer.screenToCell(350, 350);
    expect(cellAtFar).toEqual({ row: 4, column: 4 });

    const cellOutOfBounds = renderer.screenToCell(500, 500);
    expect(cellOutOfBounds).toBeNull();

    renderer.destroy();
  });

  it('should update and render particles', () => {
    particles.spawnCelebration(200, 200, getThemeForLevel(1, false), 10);

    // Update particle positions
    particles.update(16.67, 400, 400);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    expect(() => particles.render(ctx)).not.toThrow();
  });
});

// Helper for tests
function getThemeForLevel(_level: number, _hc: boolean) {
  return {
    id: 'green-meadow',
    name: 'Green Meadow',
    background: '#000',
    floor: '#111',
    wall: '#fff',
    wallHighlight: '#fff',
    player: '#ff0',
    playerAccent: '#fff',
    exit: '#f0f',
    start: '#0f0',
    overlay: '#000',
    text: '#fff',
  };
}
