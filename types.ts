export enum Direction {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum PlayerState {
  IDLE = 'IDLE',
  CLIMBING = 'CLIMBING',
  TURNING = 'TURNING',
}

export interface Stair {
  id: number;
  direction: Direction; // The direction of this stair relative to the previous one (or absolute visual space)
  x: number; // Visual X coordinate (0 is center)
  y: number; // Visual Y coordinate (0 is base)
}

export interface Player {
  currentStepIndex: number;
  facing: Direction;
  state: PlayerState;
  skin: string;
}