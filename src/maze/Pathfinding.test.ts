import { describe, it, expect } from 'vitest';
import { MazeGenerator } from './MazeGenerator';
import { findShortestPath } from './Pathfinding';

describe('Pathfinding', () => {
  it('should find a valid shortest path from start to exit', () => {
    const maze = MazeGenerator.generate(6, 6, 'pathfind-test');
    const path = findShortestPath(maze.cells, maze.start, maze.exit);

    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual(maze.start);
    expect(path[path.length - 1]).toEqual(maze.exit);

    // Verify adjacency and wall crossings
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];

      // Must be adjacent
      const rDiff = Math.abs(current.row - next.row);
      const cDiff = Math.abs(current.column - next.column);
      expect(rDiff + cDiff).toBe(1);

      // Verify walls
      const cell = maze.cells[current.row][current.column];
      if (next.row < current.row) {
        expect(cell.walls.up).toBe(false);
      } else if (next.row > current.row) {
        expect(cell.walls.down).toBe(false);
      } else if (next.column < current.column) {
        expect(cell.walls.left).toBe(false);
      } else if (next.column > current.column) {
        expect(cell.walls.right).toBe(false);
      }
    }
  });

  it('should return empty path if exit is unreachable (e.g. all walls closed)', () => {
    // Generate a simple mock maze with fully closed exit
    const cells = [
      [
        { row: 0, column: 0, walls: { up: true, down: true, left: true, right: true } },
        { row: 0, column: 1, walls: { up: true, down: true, left: true, right: true } },
      ],
    ];
    const start = { row: 0, column: 0 };
    const exit = { row: 0, column: 1 };

    const path = findShortestPath(cells, start, exit);
    expect(path).toEqual([]);
  });

  it('should handle single-cell path queries (start === exit)', () => {
    const cells = [
      [{ row: 0, column: 0, walls: { up: true, down: true, left: true, right: true } }],
    ];
    const start = { row: 0, column: 0 };
    const path = findShortestPath(cells, start, start);
    expect(path).toEqual([start]);
  });
});
