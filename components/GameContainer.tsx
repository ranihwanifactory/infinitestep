import React, { useState, useEffect, useRef, useCallback } from 'react';
import { COLORS, GAME_CONFIG } from '../constants';
import { Direction, GameState, Player, PlayerState, Stair } from '../types';
import { StairRenderer } from './StairRenderer';
import { generateGameOverMessage } from '../services/geminiService';
import { Trophy, Timer, Repeat, Play, Volume2, VolumeX } from 'lucide-react';
import { AudioController } from '../utils/audio';

export const GameContainer: React.FC = () => {
  // State
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_CONFIG.INITIAL_TIME);
  const [stairs, setStairs] = useState<Stair[]>([]);
  const [player, setPlayer] = useState<Player>({
    currentStepIndex: 0,
    facing: Direction.RIGHT,
    state: PlayerState.IDLE,
    skin: 'default'
  });
  const [gameOverMsg, setGameOverMsg] = useState<string>("");
  const [isLoadingMsg, setIsLoadingMsg] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Refs
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<AudioController | null>(null);

  // Initialize Audio Controller instance (lightweight)
  useEffect(() => {
    audioRef.current = new AudioController();
    return () => {
      audioRef.current?.stopBGM();
    };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      // Ensure audio context is created/resumed on user interaction
      audioRef.current.init();
      
      const muted = audioRef.current.toggleMute();
      setIsMuted(muted);
      
      // Restart BGM if we are playing and just unmuted
      if (!muted && gameState === GameState.PLAYING) {
        audioRef.current.startBGM();
      }
    }
  };
  
  // Initialize Game
  const initGame = useCallback(() => {
    // Initialize audio context on user interaction
    audioRef.current?.init();
    audioRef.current?.startBGM();

    // Generate initial stairs with proper logic
    const properStairs = generateInitialStairs();
    
    setStairs(properStairs);
    setPlayer({
      currentStepIndex: 0,
      // Determine initial facing based on where the second step is relative to the first
      facing: properStairs[1].x > properStairs[0].x ? Direction.RIGHT : Direction.LEFT,
      state: PlayerState.IDLE,
      skin: 'default'
    });
    setScore(0);
    setTimeLeft(GAME_CONFIG.MAX_TIME);
    setGameState(GameState.PLAYING);
    setGameOverMsg("");
  }, []);

  // Stair Generation Logic
  const generateInitialStairs = (): Stair[] => {
    const s: Stair[] = [];
    let x = 0;
    let y = 0;
    // Start with first stair at 0,0
    s.push({ id: 0, direction: Direction.RIGHT, x: 0, y: 0 });
    
    // Direction of the "flow" of stairs
    let flowDir = Math.random() > 0.5 ? Direction.RIGHT : Direction.LEFT; 
    
    for (let i = 1; i < 20; i++) {
       // Logic: Steps usually come in runs of 3-8 before turning
       // 20% chance to change flow direction
       if (i > 3 && Math.random() < 0.3) {
          flowDir = flowDir === Direction.RIGHT ? Direction.LEFT : Direction.RIGHT;
       }

       // Calculate new position based on flow
       const stepWidth = 40;
       const stepHeight = 40;
       
       if (flowDir === Direction.RIGHT) {
         x += stepWidth;
       } else {
         x -= stepWidth;
       }
       y += stepHeight;

       s.push({ id: i, direction: flowDir, x, y });
    }
    return s;
  };

  const addNextStair = (currentStairs: Stair[]) => {
    const lastStair = currentStairs[currentStairs.length - 1];
    const secondLastStair = currentStairs[currentStairs.length - 2];
    
    // Determine current flow
    const currentFlow = lastStair.x > secondLastStair.x ? Direction.RIGHT : Direction.LEFT;
    let nextFlow = currentFlow;

    // Randomly switch direction (zig-zag logic)
    const switchChance = 0.3; // 30% chance to switch direction
    if (Math.random() < switchChance) {
      nextFlow = currentFlow === Direction.RIGHT ? Direction.LEFT : Direction.RIGHT;
    }

    const stepWidth = 40;
    const stepHeight = 40;
    let newX = lastStair.x;
    
    if (nextFlow === Direction.RIGHT) {
      newX += stepWidth;
    } else {
      newX -= stepWidth;
    }
    
    return {
      id: lastStair.id + 1,
      direction: nextFlow,
      x: newX,
      y: lastStair.y + stepHeight
    };
  };

  // Game Loop (Timer)
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            handleGameOver();
            return 0;
          }
          // Decay speeds up slightly as score increases
          const decay = GAME_CONFIG.TIME_DECAY_RATE + (score * 0.005);
          return Math.max(0, prev - decay);
        });
      }, GAME_CONFIG.TICK_RATE);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, score]);

  const handleGameOver = async () => {
    setGameState(GameState.GAME_OVER);
    if (timerRef.current) clearInterval(timerRef.current);
    
    audioRef.current?.stopBGM();
    audioRef.current?.playGameOver();

    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('infiniteStairs_best', score.toString());
    }

    // Fetch Gemini Message
    setIsLoadingMsg(true);
    const msg = await generateGameOverMessage(score);
    setGameOverMsg(msg);
    setIsLoadingMsg(false);
  };

  // Input Logic
  const handleInput = (action: 'CLIMB' | 'TURN') => {
    if (gameState !== GameState.PLAYING) return;
    
    // Optimization: Direct access since indices match IDs
    const currentStair = stairs[player.currentStepIndex];
    const nextStair = stairs[player.currentStepIndex + 1];

    if (!currentStair || !nextStair) return;

    // Determine the direction required to reach the next stair
    // Visually: if next.x > current.x, we need to be facing RIGHT.
    // if next.x < current.x, we need to be facing LEFT.
    const requiredFacing = nextStair.x > currentStair.x ? Direction.RIGHT : Direction.LEFT;

    let newFacing = player.facing;
    let correctMove = false;

    if (action === 'CLIMB') {
      // CLIMB means: Move forward in CURRENT direction.
      // So requiredFacing must match current facing.
      if (player.facing === requiredFacing) {
        correctMove = true;
      }
    } else if (action === 'TURN') {
      // TURN means: Switch direction, THEN move forward.
      // So requiredFacing must be OPPOSITE to current facing.
      if (player.facing !== requiredFacing) {
        newFacing = requiredFacing;
        correctMove = true;
      }
    }

    if (correctMove) {
      // Success
      const newScore = score + 1;
      setScore(newScore);
      
      // Play sound
      if (action === 'CLIMB') {
        audioRef.current?.playStep();
      } else {
        audioRef.current?.playTurn();
      }

      // Add Time
      setTimeLeft(prev => Math.min(GAME_CONFIG.MAX_TIME, prev + GAME_CONFIG.TIME_BONUS));

      // Update Player
      setPlayer({
        ...player,
        currentStepIndex: player.currentStepIndex + 1,
        facing: newFacing,
        state: PlayerState.CLIMBING
      });

      // Generate new stairs ahead
      setStairs(prev => [...prev, addNextStair(prev)]);

    } else {
      // Failure
      handleGameOver();
    }
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === GameState.MENU || gameState === GameState.GAME_OVER) {
        if (e.code === 'Space' || e.code === 'Enter') {
          initGame();
        }
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'z' || e.key === 'Z') {
        handleInput('TURN');
      } else if (e.key === 'ArrowRight' || e.key === 'x' || e.key === 'X') {
        handleInput('CLIMB');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, player, stairs, score]);

  // Initial Load Best Score
  useEffect(() => {
    const saved = localStorage.getItem('infiniteStairs_best');
    if (saved) setBestScore(parseInt(saved));
  }, []);


  // --- RENDER ---
  
  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-between overflow-hidden bg-slate-900">
      
      {/* --- TOP UI --- */}
      <div className="absolute top-0 left-0 w-full p-4 z-50 flex justify-between items-start text-white pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-yellow-400">
            <Trophy size={20} />
            <span className="font-bold text-xl">{bestScore}</span>
          </div>
          <div className="text-sm opacity-70 font-bold">최고기록</div>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-5xl font-black tracking-tighter drop-shadow-lg">{score}</span>
        </div>

        {/* Volume Toggle */}
        <div className="w-16 flex justify-end pointer-events-auto">
          <button 
            onClick={toggleMute}
            className="p-2 bg-black/30 backdrop-blur rounded-full hover:bg-black/50 transition-colors"
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>
      </div>

      {/* --- TIMER BAR --- */}
      {gameState === GameState.PLAYING && (
        <div className="absolute top-24 w-64 h-4 bg-slate-800 rounded-full border-2 border-slate-700 z-40 overflow-hidden">
          <div 
            className={`h-full transition-all duration-75 ease-linear ${timeLeft < 30 ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${timeLeft}%` }}
          ></div>
        </div>
      )}

      {/* --- GAME WORLD --- */}
      <div className="w-full h-full relative">
         <StairRenderer stairs={stairs} player={player} />
      </div>

      {/* --- MENU SCREEN --- */}
      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 drop-shadow-sm">
            INFINITE STAIRS
          </h1>
          <p className="text-slate-400 mb-8 font-medium">무한의 계단 AI 에디션</p>
          
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-xs w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 text-sm text-slate-300 font-medium">
              <span>⬅️ 방향전환 (Z)</span>
              <span>오르기 (X) ➡️</span>
            </div>
            <button 
              onClick={initGame}
              className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Play size={24} fill="black" />
              게임 시작
            </button>
          </div>
        </div>
      )}

      {/* --- GAME OVER SCREEN --- */}
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="mb-2 text-red-500 font-bold text-2xl uppercase tracking-widest">Game Over</div>
          <div className="text-7xl font-black text-white mb-6">{score}</div>
          
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-600 max-w-md w-full mb-8 shadow-2xl min-h-[120px] flex flex-col justify-center items-center relative">
             <div className="absolute -top-3 left-4 bg-indigo-600 px-2 py-1 text-xs rounded text-white font-bold">AI 코치</div>
             {isLoadingMsg ? (
               <div className="flex gap-2">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
               </div>
             ) : (
               <p className="text-lg text-slate-200 font-medium leading-snug break-keep">
                 "{gameOverMsg}"
               </p>
             )}
          </div>

          <button 
            onClick={initGame}
            className="px-12 py-4 bg-white hover:bg-gray-100 text-black font-bold rounded-full text-xl transition-transform active:scale-95 flex items-center gap-2"
          >
            <Repeat size={24} />
            다시 하기
          </button>
        </div>
      )}

      {/* --- CONTROLS (MOBILE) --- */}
      <div className="absolute bottom-0 left-0 w-full h-40 sm:h-48 z-40 flex pb-safe">
        {/* Turn Button */}
        <button
          className={`flex-1 m-2 mb-4 rounded-2xl shadow-inner border-b-4 active:border-b-0 active:translate-y-1 transition-all
            flex flex-col items-center justify-center gap-2
            ${gameState === GameState.PLAYING ? 'bg-blue-600 border-blue-800 text-white' : 'bg-slate-700 border-slate-900 text-slate-500'}
          `}
          onPointerDown={(e) => { e.preventDefault(); handleInput('TURN'); }}
        >
          <Repeat size={32} className="transform scale-x-[-1]" />
          <span className="font-bold text-xl">방향전환</span>
          <span className="text-xs opacity-50 hidden sm:block">(Key: Z)</span>
        </button>

        {/* Climb Button */}
        <button
          className={`flex-1 m-2 mb-4 rounded-2xl shadow-inner border-b-4 active:border-b-0 active:translate-y-1 transition-all
            flex flex-col items-center justify-center gap-2
            ${gameState === GameState.PLAYING ? 'bg-red-600 border-red-800 text-white' : 'bg-slate-700 border-slate-900 text-slate-500'}
          `}
          onPointerDown={(e) => { e.preventDefault(); handleInput('CLIMB'); }}
        >
          <Trophy size={32} className="hidden" /> {/* Icon placeholder */}
          <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <span className="font-bold text-xl">오르기</span>
          <span className="text-xs opacity-50 hidden sm:block">(Key: X)</span>
        </button>
      </div>

    </div>
  );
};