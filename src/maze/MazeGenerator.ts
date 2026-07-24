import { Maze, MazeCell, Position } from './mazeTypes';
import { SeededRandom } from './SeededRandom';
import { bfs } from './Pathfinding';

/**
 * Procedural Maze Generator using randomized Depth-First Search (DFS)
 * with recursive backtracking.
 */
export class MazeGenerator {
  /**
   * Generates a solvable perfect maze of size rows x columns using a seed.
   */
  static generate(rows: number, columns: number, seed: string): Maze {
    if (rows < 2 || columns < 2) {
      throw new Error('Maze dimensions must be at least 2x2');
    }

    const rng = new SeededRandom(seed);

    // Initialize all cells with all walls intact
    const cells: MazeCell[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowCells: MazeCell[] = [];
      for (let c = 0; c < columns; c++) {
        rowCells.push({
          row: r,
          column: c,
          walls: {
            up: true,
            down: true,
            left: true,
            right: true,
          },
        });
      }
      cells.push(rowCells);
    }

    // DFS with recursive backtracking
    const visited = Array.from({ length: rows }, () => Array(columns).fill(false));
    const stack: Position[] = [];

    // Choose a start cell for generation
    let current: Position = { row: 0, column: 0 };
    visited[current.row][current.column] = true;
    let visitedCount = 1;
    const totalCells = rows * columns;

    while (visitedCount < totalCells) {
      const neighbors = this.getUnvisitedNeighbors(current, rows, columns, visited);

      if (neighbors.length > 0) {
        // Choose a random unvisited neighbor
        const nextCell = rng.choose(neighbors);

        // Remove walls between current and nextCell
        this.removeWalls(cells[current.row][current.column], cells[nextCell.row][nextCell.column]);

        // Move to neighbor
        stack.push(current);
        current = nextCell;
        visited[current.row][current.column] = true;
        visitedCount++;
      } else if (stack.length > 0) {
        // Backtrack
        current = stack.pop()!;
      } else {
        // Fallback (should not be reached in normal execution)
        break;
      }
    }

    // Start position is always (0, 0) for ease and predictability
    const start: Position = { row: 0, column: 0 };

    // Run BFS to find farthest cells for the exit
    const distances = bfs(cells, start);

    let maxDistance = -1;
    let farthestPositions: Position[] = [];

    for (const [key, value] of distances.entries()) {
      const [r, c] = key.split(',').map(Number);
      const pos: Position = { row: r, column: c };

      // Skip start position
      if (r === start.row && c === start.column) continue;

      if (value.distance > maxDistance) {
        maxDistance = value.distance;
        farthestPositions = [pos];
      } else if (value.distance === maxDistance) {
        farthestPositions.push(pos);
      }
    }

    // Pick exit from among the farthest positions using the RNG
    if (farthestPositions.length === 0) {
      throw new Error('Could not find a valid exit position');
    }
    const exit = rng.choose(farthestPositions);

    return {
      rows,
      columns,
      cells,
      start,
      exit,
      seed,
    };
  }

  /**
   * Helper to get unvisited neighbors around a position.
   */
  private static getUnvisitedNeighbors(
    pos: Position,
    rows: number,
    columns: number,
    visited: boolean[][],
  ): Position[] {
    const neighbors: Position[] = [];
    const { row, column } = pos;

    // Up
    if (row > 0 && !visited[row - 1][column]) {
      neighbors.push({ row: row - 1, column });
    }
    // Down
    if (row < rows - 1 && !visited[row + 1][column]) {
      neighbors.push({ row: row + 1, column });
    }
    // Left
    if (column > 0 && !visited[row][column - 1]) {
      neighbors.push({ row, column: column - 1 });
    }
    // Right
    if (column < columns - 1 && !visited[row][column + 1]) {
      neighbors.push({ row, column: column + 1 });
    }

    return neighbors;
  }

  /**
   * Removes the walls between cell A and cell B (assuming they are adjacent).
   */
  private static removeWalls(a: MazeCell, b: MazeCell) {
    if (a.row === b.row) {
      if (a.column < b.column) {
        a.walls.right = false;
        b.walls.left = false;
      } else {
        a.walls.left = false;
        b.walls.right = false;
      }
    } else if (a.column === b.column) {
      if (a.row < b.row) {
        a.walls.down = false;
        b.walls.up = false;
      } else {
        a.walls.up = false;
        b.walls.down = false;
      }
    }
  }
}
