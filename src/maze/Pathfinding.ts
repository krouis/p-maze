import { Position, MazeCell } from './mazeTypes';

/**
 * Generates a string key for a position to use in maps/sets.
 */
export function getPosKey(pos: Position): string {
  return `${pos.row},${pos.column}`;
}

/**
 * Parses a position key back into a Position object.
 */
export function parsePosKey(key: string): Position {
  const [row, column] = key.split(',').map(Number);
  return { row, column };
}

/**
 * Returns a list of valid unblocked neighbors for a given cell.
 */
export function getValidNeighbors(pos: Position, cells: MazeCell[][]): Position[] {
  const rows = cells.length;
  const cols = cells[0].length;
  const neighbors: Position[] = [];
  const cell = cells[pos.row]?.[pos.column];

  if (!cell) return neighbors;

  // Up
  if (!cell.walls.up && pos.row > 0) {
    neighbors.push({ row: pos.row - 1, column: pos.column });
  }
  // Down
  if (!cell.walls.down && pos.row < rows - 1) {
    neighbors.push({ row: pos.row + 1, column: pos.column });
  }
  // Left
  if (!cell.walls.left && pos.column > 0) {
    neighbors.push({ row: pos.row, column: pos.column - 1 });
  }
  // Right
  if (!cell.walls.right && pos.column < cols - 1) {
    neighbors.push({ row: pos.row, column: pos.column + 1 });
  }

  return neighbors;
}

/**
 * Performs BFS from a start position to compute distances and parent pointers for all reachable cells.
 */
export function bfs(
  cells: MazeCell[][],
  start: Position,
): Map<string, { distance: number; parent: Position | null }> {
  const infoMap = new Map<string, { distance: number; parent: Position | null }>();
  const queue: Position[] = [start];
  const startKey = getPosKey(start);

  infoMap.set(startKey, { distance: 0, parent: null });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentKey = getPosKey(current);
    const currentInfo = infoMap.get(currentKey)!;

    const neighbors = getValidNeighbors(current, cells);
    for (const neighbor of neighbors) {
      const neighborKey = getPosKey(neighbor);
      if (!infoMap.has(neighborKey)) {
        infoMap.set(neighborKey, {
          distance: currentInfo.distance + 1,
          parent: current,
        });
        queue.push(neighbor);
      }
    }
  }

  return infoMap;
}

/**
 * Finds the shortest path from start to exit using the BFS info map.
 * Returns an array of Positions from start to exit.
 */
export function findShortestPath(cells: MazeCell[][], start: Position, exit: Position): Position[] {
  const infoMap = bfs(cells, start);
  const path: Position[] = [];

  const exitKey = getPosKey(exit);
  if (!infoMap.has(exitKey)) {
    // No path found (should not happen in a perfect solvable maze)
    return [];
  }

  let current: Position | null = exit;
  while (current !== null) {
    path.push(current);
    const currentKey = getPosKey(current);
    current = infoMap.get(currentKey)!.parent;
  }

  return path.reverse();
}
