
import React, { useState, useEffect } from 'react';
import { Direction, Stair, Player } from '../types';
import { COLORS, GAME_CONFIG, CHARACTER_SKINS } from '../constants';

interface StairRendererProps {
  stairs: Stair[];
  player: Player;
}

export const StairRenderer: React.FC<StairRendererProps> = ({ stairs, player }) => {
  // State to handle image source for custom uploads
  // Only really used if player.skin === 'custom', but we track it generally.
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    const skinDef = CHARACTER_SKINS.find(s => s.id === player.skin) || CHARACTER_SKINS[0];
    
    // If custom skin, append timestamp to bypass browser cache in case of previous 404s
    if (skinDef.id === 'custom') {
        setImgSrc(`${skinDef.src}?t=${Date.now()}`);
    } else {
        setImgSrc(skinDef.src);
    }
  }, [player.skin]);

  // Guard against empty stairs (initial render before game start)
  if (!stairs || stairs.length === 0) {
    return null;
  }

  const playerStair = stairs.find(s => s.id === player.currentStepIndex) || stairs[0];
  
  // --- Camera Logic ---
  const centerX = window.innerWidth / 2;
  const targetY = GAME_CONFIG.PLAYER_OFFSET_Y; 

  const cameraX = centerX - playerStair.x;
  const cameraY = playerStair.y - targetY;

  const STEP_WIDTH = 60;
  const STEP_HEIGHT = 40;

  // Fallback logic for custom skin
  const handleImageError = () => {
    if (player.skin === 'custom') {
        console.warn("Custom image (1.png) not found, switching to default.");
        setImgSrc(CHARACTER_SKINS[0].src);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div 
        className="relative w-full h-full transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `translate3d(${cameraX}px, ${cameraY}px, 0)` 
        }}
      >
        {/* Render Stairs */}
        {stairs.map((stair) => {
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
               {/* Stair Visual */}
               <div className={`w-full h-full relative`}>
                  <div className={`absolute top-0 left-0 w-full h-4 ${COLORS.stairTop} z-10 border-b-2 border-black/10`}></div>
                  <div className={`absolute top-4 left-0 w-full h-full ${COLORS.stair} z-0 shadow-lg`}></div>
                  <div className={`absolute top-4 ${isLeft ? '-right-2' : '-left-2'} w-2 h-full ${COLORS.stairSide}`}></div>
               </div>
             </div>
           );
        })}

        {/* Render Player */}
        <div
            className="absolute z-20 transition-transform duration-75"
            style={{
                left: `${playerStair.x}px`,
                bottom: `${playerStair.y}px`,
                transform: `translateX(-50%) scaleX(${player.facing === Direction.RIGHT ? 1 : -1})`,
                width: '70px',
                height: '90px',
            }}
        >
             <div className="w-full h-full relative animate-bounce-short" style={{ bottom: '40px' }}>
                  <img 
                    src={imgSrc}
                    alt="Player" 
                    className="w-full h-full object-contain"
                    style={{ 
                      imageRendering: 'pixelated',
                      filter: 'drop-shadow(0 4px 2px rgba(0,0,0,0.3))'
                    }}
                    onError={handleImageError}
                  />
             </div>
        </div>

      </div>
    </div>
  );
};
