import { describe, it, expect } from 'vitest';
import { MazeGenerator } from './MazeGenerator';
import { bfs, getPosKey } from './Pathfinding';

describe('MazeGenerator', () => {
  it('should generate a maze with valid dimensions', () => {
    const rows = 10;
    const cols = 10;
    const maze = MazeGenerator.generate(rows, cols, 'test-dim');

    expect(maze.rows).toBe(rows);
    expect(maze.columns).toBe(cols);
    expect(maze.cells.length).toBe(rows);
    expect(maze.cells[0].length).toBe(cols);
  });

  it('should fail for invalid dimensions', () => {
    expect(() => MazeGenerator.generate(1, 5, 'fail')).toThrow();
    expect(() => MazeGenerator.generate(5, 1, 'fail')).toThrow();
  });

  it('should generate identical mazes for identical seeds', () => {
    const maze1 = MazeGenerator.generate(5, 5, 'same-seed');
    const maze2 = MazeGenerator.generate(5, 5, 'same-seed');

    expect(maze1.start).toEqual(maze2.start);
    expect(maze1.exit).toEqual(maze2.exit);
    expect(maze1.cells).toEqual(maze2.cells);
  });

  it('should generate different mazes for different seeds', () => {
    const maze1 = MazeGenerator.generate(8, 8, 'seed-A');
    const maze2 = MazeGenerator.generate(8, 8, 'seed-B');

    // Walls should differ somewhere
    let differ = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const walls1 = maze1.cells[r][c].walls;
        const walls2 = maze2.cells[r][c].walls;
        if (
          walls1.up !== walls2.up ||
          walls1.down !== walls2.down ||
          walls1.left !== walls2.left ||
          walls1.right !== walls2.right
        ) {
          differ = true;
          break;
        }
      }
    }
    expect(differ).toBe(true);
  });

  it('should have symmetrical neighboring wall states', () => {
    const maze = MazeGenerator.generate(7, 7, 'symmetry');
    const { cells, rows, columns } = maze;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const cell = cells[r][c];

        // Up neighbor
        if (r > 0) {
          const neighbor = cells[r - 1][c];
          expect(cell.walls.up).toBe(neighbor.walls.down);
        }
        // Down neighbor
        if (r < rows - 1) {
          const neighbor = cells[r + 1][c];
          expect(cell.walls.down).toBe(neighbor.walls.up);
        }
        // Left neighbor
        if (c > 0) {
          const neighbor = cells[r][c - 1];
          expect(cell.walls.left).toBe(neighbor.walls.right);
        }
        // Right neighbor
        if (c < columns - 1) {
          const neighbor = cells[r][c + 1];
          expect(cell.walls.right).toBe(neighbor.walls.left);
        }
      }
    }
  });

  it('should keep outer boundaries closed', () => {
    const maze = MazeGenerator.generate(6, 6, 'boundaries');
    const { cells, rows, columns } = maze;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < columns; c++) {
        const cell = cells[r][c];
        if (r === 0) expect(cell.walls.up).toBe(true);
        if (r === rows - 1) expect(cell.walls.down).toBe(true);
        if (c === 0) expect(cell.walls.left).toBe(true);
        if (c === columns - 1) expect(cell.walls.right).toBe(true);
      }
    }
  });

  it('should be a connected perfect maze (edge count = cell count - 1)', () => {
    const rows = 8;
    const cols = 8;
    const maze = MazeGenerator.generate(rows, cols, 'perfect');

    // In a perfect grid maze:
    // Cell count = rows * cols
    // Edges (passages) count = sum of all open passages (divided by 2 for symmetry)
    let passageCount = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = maze.cells[r][c];
        if (!cell.walls.up) passageCount++;
        if (!cell.walls.down) passageCount++;
        if (!cell.walls.left) passageCount++;
        if (!cell.walls.right) passageCount++;
      }
    }

    const uniquePassages = passageCount / 2;
    const cellCount = rows * cols;

    expect(uniquePassages).toBe(cellCount - 1);

    // Verify all cells are reachable via BFS
    const distances = bfs(maze.cells, maze.start);
    expect(distances.size).toBe(cellCount);
  });

  it('should not overlap start and exit, and exit should be reachable', () => {
    const maze = MazeGenerator.generate(5, 5, 'exit-check');
    expect(getPosKey(maze.start)).not.toBe(getPosKey(maze.exit));

    const distances = bfs(maze.cells, maze.start);
    const exitKey = getPosKey(maze.exit);
    expect(distances.has(exitKey)).toBe(true);
    expect(distances.get(exitKey)!.distance).toBeGreaterThanOrEqual(2);
  });
});
