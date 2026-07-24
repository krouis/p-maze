export type Direction = 'up' | 'down' | 'left' | 'right';

export type MoveSource = 'keyboard' | 'touch' | 'swipe';

export type MoveAction = {
  direction: Direction;
  source: MoveSource;
  timestamp: number;
};
