export type Position = {
  row: number;
  column: number;
};

export type MazeCell = {
  row: number;
  column: number;
  walls: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
};

export type Maze = {
  rows: number;
  columns: number;
  cells: MazeCell[][];
  start: Position;
  exit: Position;
  seed: string;
};
