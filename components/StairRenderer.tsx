import React, { useState, useEffect } from 'react';
import { Direction, Stair, Player } from '../types';
import { COLORS, GAME_CONFIG } from '../constants';

interface StairRendererProps {
  stairs: Stair[];
  player: Player;
}

// Simple pixel art character SVG Data URI (Yellow figure)
// Used as a fallback if 1.png is not found
const FALLBACK_CHAR_IMG = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 18' shape-rendering='crispEdges'%3E%3Cpath d='M4 0h6v2H4zM2 2h10v6H2zM4 8h6v4H4zM2 12h4v6H2zM8 12h4v6H8z' fill='%23fbbf24'/%3E%3Cpath d='M4 3h2v2H4zM8 3h2v2H8z' fill='%23000'/%3E%3C/svg%3E`;

export const StairRenderer: React.FC<StairRendererProps> = ({ stairs, player }) => {
  // State to handle image source. Defaults to requested '1.png'
  const [imgSrc, setImgSrc] = useState("1.png");

  // If player skin changes or component remounts, try 1.png again (unless we know it failed)
  // but simple error handling is enough for this scope.

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
                // Assuming the image faces RIGHT by default.
                transform: `translateX(-50%) scaleX(${player.facing === Direction.RIGHT ? 1 : -1})`,
                width: '70px',
                height: '90px',
            }}
        >
             {/* Inner wrapper for bounce animation and fine-tuning vertical sit position */}
             {/* bottom: 40px ensures the feet (bottom of image) align with the top of the current stair (height 40px) */}
             <div className="w-full h-full relative animate-bounce-short" style={{ bottom: '40px' }}>
                  <img 
                    src={imgSrc}
                    alt="Player" 
                    className="w-full h-full object-contain"
                    style={{ 
                      imageRendering: 'pixelated',
                      filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.3))'
                    }}
                    onError={() => {
                      // If 1.png fails to load, switch to the internal fallback SVG
                      if (imgSrc !== FALLBACK_CHAR_IMG) {
                        console.warn("1.png not found, switching to fallback character.");
                        setImgSrc(FALLBACK_CHAR_IMG);
                      }
                    }}
                  />
             </div>
        </div>

      </div>
    </div>
  );
};