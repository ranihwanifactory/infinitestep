import React from 'react';
import { Direction, Stair, Player } from '../types';
import { COLORS, GAME_CONFIG } from '../constants';

interface StairRendererProps {
  stairs: Stair[];
  player: Player;
}

export const StairRenderer: React.FC<StairRendererProps> = ({ stairs, player }) => {
  // Guard against empty stairs (initial render before game start)
  if (!stairs || stairs.length === 0) {
    return null;
  }

  const playerStair = stairs.find(s => s.id === player.currentStepIndex) || stairs[0];
  
  // --- Camera Logic ---
  // We want the player to appear static at (CenterX, FixedY) on the screen.
  // To achieve this, we translate the entire world container opposite to the player's position.
  
  const centerX = window.innerWidth / 2;
  // Target vertical position for the player's feet (relative to screen bottom)
  const targetY = GAME_CONFIG.PLAYER_OFFSET_Y; 

  // Calculate Container Transform:
  // X: Shift world left by player's X, then add centerX to center it.
  const cameraX = centerX - playerStair.x;
  
  // Y: We use `bottom` positioning for elements.
  // If player is at `y=100`, and we want them visually at `bottom=300`:
  // We need to shift the container UP/DOWN.
  // CSS `translateY(val)` moves elements DOWN.
  // VisualBottom = LogicalBottom - TranslateY
  // TargetY = PlayerY - TranslateY
  // TranslateY = PlayerY - TargetY
  const cameraY = playerStair.y - targetY;

  const STEP_WIDTH = 60;
  const STEP_HEIGHT = 40;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div 
        className="relative w-full h-full transition-transform duration-100 ease-out will-change-transform"
        style={{
          // transform3d activates hardware acceleration for smoother scrolling
          transform: `translate3d(${cameraX}px, ${cameraY}px, 0)` 
        }}
      >
        {/* Render Stairs */}
        {stairs.map((stair) => {
           // Optimization: Only render stairs strictly within the visible viewport + buffer
           if (stair.id < player.currentStepIndex - 8 || stair.id > player.currentStepIndex + 15) return null;

           const isLeft = stair.direction === Direction.LEFT;

           return (
             <div
                key={stair.id}
                className="absolute"
                style={{
                  left: `${stair.x}px`,
                  bottom: `${stair.y}px`, // Positive Y goes UP
                  width: `${STEP_WIDTH}px`,
                  height: `${STEP_HEIGHT}px`,
                  transform: 'translateX(-50%)' // Center pivot
                }}
             >
               {/* Stair Visual (pseudo-3D) */}
               <div className={`w-full h-full relative`}>
                  {/* Top Face */}
                  <div className={`absolute top-0 left-0 w-full h-4 ${COLORS.stairTop} z-10 border-b-2 border-black/10`}></div>
                  {/* Front Face */}
                  <div className={`absolute top-4 left-0 w-full h-full ${COLORS.stair} z-0 shadow-lg`}></div>
                  {/* Side Face (Optional depth) */}
                  <div className={`absolute top-4 ${isLeft ? '-right-2' : '-left-2'} w-2 h-full ${COLORS.stairSide}`}></div>
               </div>
             </div>
           );
        })}

        {/* Render Player */}
        {/* The player is part of the world coordinate space, but since the camera centers on it,
            it appears static. */}
        <div
            className="absolute z-20 transition-transform duration-75"
            style={{
                left: `${playerStair.x}px`,
                bottom: `${playerStair.y}px`,
                transform: `translateX(-50%) scaleX(${player.facing === Direction.RIGHT ? 1 : -1})`,
                width: '40px',
                height: '60px',
            }}
        >
             {/* Inner wrapper for bounce animation and fine-tuning vertical sit position */}
             <div className="w-full h-full relative animate-bounce-short" style={{ bottom: '38px' }}>
                  {/* Character Body Parts */}
                  {/* Head */}
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-5 h-5 ${COLORS.player} rounded-sm border-2 border-black`}>
                     <div className="absolute top-1 left-0 w-full h-1 bg-red-500"></div>
                  </div>
                  {/* Torso */}
                  <div className={`absolute top-5 left-1/2 -translate-x-1/2 w-6 h-6 bg-blue-500 rounded-sm border-2 border-black`}></div>
                  {/* Legs */}
                  <div className="absolute top-11 left-2 w-2 h-4 bg-black"></div>
                  <div className="absolute top-11 right-2 w-2 h-4 bg-black"></div>
                  {/* Arm (Swinging) */}
                  <div className={`absolute top-6 -left-1 w-2 h-4 ${COLORS.player} rounded-full origin-top animate-swing`}></div>
             </div>
        </div>

      </div>
    </div>
  );
};