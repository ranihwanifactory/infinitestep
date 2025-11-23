export const GAME_CONFIG = {
  INITIAL_TIME: 100, // Percentage
  TIME_DECAY_RATE: 0.5, // How much time drains per tick
  TIME_BONUS: 15, // How much time you get back per step
  MAX_TIME: 100,
  TICK_RATE: 50, // ms
  STAIR_LOOKAHEAD: 20, // How many stairs to render/generate ahead
  PLAYER_OFFSET_Y: 300, // Where the player sits vertically on screen (px from bottom)
};

export const COLORS = {
  bg: 'bg-slate-900',
  stair: 'bg-indigo-500',
  stairTop: 'bg-indigo-400',
  stairSide: 'bg-indigo-700',
  player: 'bg-yellow-400',
  playerOutline: 'border-yellow-600',
};