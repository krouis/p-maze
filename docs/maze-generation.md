# Maze Generation & Pathfinding

This document details the procedural maze generation and pathfinding algorithms used in **Pixel Maze (p-maze)**.

## Maze Representation

A maze is represented as a structured 2D array of grid cells.

```typescript
type Position = {
  row: number;
  column: number;
};

type MazeCell = {
  row: number;
  column: number;
  walls: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
};
```

By default, every cell begins with all four walls (`up`, `down`, `left`, `right`) set to `true`.

## Perfect Maze Generation

The generation uses **Randomized Depth-First Search (DFS) with Recursive Backtracking**, driven by the deterministic `SeededRandom` Mulberry32 generator.

### Characteristics of a Perfect Maze

- **Solvability**: Every single cell is connected to every other cell.
- **Uniqueness**: There is exactly one simple path between any two cells (there are no loop cycles or closed islands).
- **Graph Property**: In a grid of size $R \times C$, the total cell count is $N = R \cdot C$. A perfect maze will contain exactly $N - 1$ open passages (edges), and the graph remains fully connected.

### Symmetrical Walls

When carving paths, wall states must remain consistent. If Cell A breaks its `right` wall to connect to Cell B, Cell B must break its `left` wall.

---

## Exit Selection & Pathfinding

To ensure the game is challenging and fun:

1. **Start Position**: The start is placed at `(0, 0)`.
2. **Breadth-First Search (BFS)**: We perform a BFS traversal starting from `(0, 0)`. We record the exact path distance from the start to every reachable cell.
3. **Farthest Cell Selection**: We identify all cells that have the _maximum_ possible path length from the start. We pick one of these farthest cells using the seeded RNG to act as the exit. This guarantees the longest possible, non-trivial route.
4. **Shortest Path Cash**: The parents list stored during BFS is used to resolve the path for the manual hint system.

---

## Pseudocode

### 1. Randomized DFS Generator

```text
function generateMaze(rows, cols, seed):
  cells = initialize_grid_with_walls(rows, cols)
  visited = 2D_boolean_array(rows, cols, false)
  stack = empty_stack()
  rng = SeededRandom(seed)

  current = (0, 0)
  visited[0][0] = true
  visited_count = 1
  total_cells = rows * cols

  while visited_count < total_cells:
    unvisited_neighbors = get_unvisited_neighbors(current, visited)
    if unvisited_neighbors is not empty:
      next_cell = rng.choose(unvisited_neighbors)
      remove_walls_between(current, next_cell)

      stack.push(current)
      current = next_cell
      visited[current.row][current.col] = true
      visited_count = visited_count + 1
    else if stack is not empty:
      current = stack.pop()

  return cells
```

### 2. BFS Path Solver

```text
function bfs(cells, start):
  infoMap = new Map() // key: "r,c", value: { distance, parent }
  queue = empty_queue()

  queue.enqueue(start)
  infoMap.set(start, { distance: 0, parent: null })

  while queue is not empty:
    current = queue.dequeue()
    current_info = infoMap.get(current)

    for neighbor in unblocked_neighbors(current, cells):
      if neighbor is not in infoMap:
        infoMap.set(neighbor, {
          distance: current_info.distance + 1,
          parent: current
        })
        queue.enqueue(neighbor)

  return infoMap
```
