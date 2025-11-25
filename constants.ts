
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

// --- Character Assets ---

const BASE_SVG_START = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 18' shape-rendering='crispEdges'%3E";
// Eyes shifted to the right (x=7 and x=10) to create a profile view. 
// When flipped horizontally via CSS, they will look Left.
const BASE_SVG_END = "%3Cpath d='M7 3h2v2H7zM10 3h2v2H10z' fill='%23000'/%3E%3C/svg%3E";

// Helper to generate colored SVG
const createCharSvg = (color: string) => 
  `${BASE_SVG_START}%3Cpath d='M4 0h6v2H4zM2 2h10v6H2zM4 8h6v4H4zM2 12h4v6H2zM8 12h4v6H8z' fill='${color.replace('#', '%23')}'/%3E${BASE_SVG_END}`;

export const CHARACTER_SKINS = [
  { id: 'default', name: '기본 (노랑)', src: createCharSvg('#fbbf24') }, // Yellow
  { id: 'red', name: '히어로 (빨강)', src: createCharSvg('#ef4444') }, // Red
  { id: 'blue', name: '비즈니스 (파랑)', src: createCharSvg('#3b82f6') }, // Blue
  { id: 'green', name: '좀비 (초록)', src: createCharSvg('#22c55e') }, // Green
  { id: 'purple', name: '닌자 (보라)', src: createCharSvg('#a855f7') }, // Purple
  { id: 'custom', name: '업로드 (1.png)', src: './1.png' }, 
];