'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type TargetAndTransition, type Transition } from 'framer-motion';
import { Button } from '@/components/ui/button';

/** Game configuration — tune thresholds and timing here */
const GAME_CONFIG = {
  /** Pixel distance that counts as "you moved" */
  movementThreshold: 5,
  /** How often the score counter updates (ms) */
  scoreTickMs: 100,
  /** Score = elapsed ms / scoreUnit */
  scoreUnit: 100,
} as const;

/** Distracting visual elements that try to make you move */
const DISTRACTIONS: Array<{ className: string; animate: TargetAndTransition; transition: Transition }> = [
  { className: 'absolute top-4 left-4 w-6 h-6 sm:w-8 sm:h-8 bg-red-500 rounded-full', animate: { rotate: 360 }, transition: { duration: 2, repeat: Infinity, ease: 'linear' } },
  { className: 'absolute top-4 right-4 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded', animate: { y: [0, 80, 0] }, transition: { duration: 1.5, repeat: Infinity } },
  { className: 'absolute bottom-4 left-4 w-5 h-5 sm:w-7 sm:h-7 bg-emerald-500 rounded-full', animate: { x: [0, 60, 0], opacity: [1, 0.3, 1] }, transition: { duration: 2.5, repeat: Infinity } },
  { className: 'absolute bottom-4 right-4 w-5 h-5 sm:w-7 sm:h-7 bg-amber-500', animate: { rotate: [0, 180, 360], scale: [1, 1.5, 1] }, transition: { duration: 3, repeat: Infinity } },
  { className: 'absolute top-1/3 left-8 w-3 h-3 sm:w-4 sm:h-4 bg-fuchsia-500 rounded-full', animate: { y: [0, -40, 0], x: [0, 30, 0] }, transition: { duration: 1.8, repeat: Infinity } },
  { className: 'absolute top-1/3 right-8 w-4 h-4 sm:w-5 sm:h-5 bg-cyan-400 rounded-full', animate: { scale: [1, 2, 1], opacity: [0.8, 0.2, 0.8] }, transition: { duration: 1.2, repeat: Infinity } },
];

/** Taunts shown at different score milestones */
const TAUNTS = [
  { min: 0, text: 'Stay still...' },
  { min: 30, text: 'Not bad...' },
  { min: 80, text: 'Impressive...' },
  { min: 150, text: 'Are you even breathing?!' },
  { min: 300, text: '🗿' },
] as const;

/** Shame messages for when you lose */
const SHAME_MESSAGES = [
  'The average person lasts longer.',
  'My grandma could do better.',
  'That was... something.',
  'A valiant 0.5 seconds.',
  'Try being a statue next time.',
  'Even your heartbeat counts as movement.',
] as const;

export function DontMoveApp() {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'lost'>('ready');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [shameMsg, setShameMsg] = useState('');
  const lastPos = useRef({ x: 0, y: 0 });
  const startTime = useRef(0);

  const currentTaunt = TAUNTS.filter(t => score >= t.min).pop()?.text ?? '';

  const startGame = useCallback(() => { 
    setGameState('playing'); 
    setScore(0); 
    startTime.current = Date.now(); 
    lastPos.current = { x: 0, y: 0 }; 
  }, []);

  const handleMovement = useCallback((currentX: number, currentY: number) => {
    if (gameState !== 'playing') return;
    
    if (lastPos.current.x !== 0 || lastPos.current.y !== 0) {
      const distance = Math.sqrt(Math.pow(currentX - lastPos.current.x, 2) + Math.pow(currentY - lastPos.current.y, 2));
      if (distance > GAME_CONFIG.movementThreshold) {
        const finalScore = Math.floor((Date.now() - startTime.current) / GAME_CONFIG.scoreUnit);
        if (finalScore > highScore) setHighScore(finalScore);
        setShameMsg(SHAME_MESSAGES[Math.floor(Math.random() * SHAME_MESSAGES.length)]);
        setGameState('lost'); 
        setScore(finalScore);
      }
    }
    lastPos.current = { x: currentX, y: currentY };
  }, [gameState, highScore]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleMovement(e.clientX, e.clientY);
  }, [handleMovement]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMovement(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handleMovement]);

  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => setScore(Math.floor((Date.now() - startTime.current) / GAME_CONFIG.scoreUnit)), GAME_CONFIG.scoreTickMs);
      return () => clearInterval(interval);
    }
  }, [gameState]);

  return (
    <div className="py-4 sm:py-8 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl sm:text-6xl mb-3 sm:mb-4">✋</motion.div>
      <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Don&apos;t Move</h2>
      <p className="text-zinc-400 text-sm sm:text-base mb-6 sm:mb-8 px-4">Stay perfectly still. Test your patience.</p>
      <div 
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-72 sm:h-80 md:h-96 bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl overflow-hidden touch-none select-none mx-4 sm:mx-0"
      >
        <AnimatePresence mode="wait">
          {gameState === 'ready' && (
            <motion.div 
              key="ready"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4"
            >
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 border border-fuchsia-500/30 flex items-center justify-center mb-5"
              >
                <span className="text-3xl sm:text-4xl">🤫</span>
              </motion.div>
              <p className="text-zinc-500 text-sm mb-5 text-center">Hold your device steady or keep your mouse still after starting</p>
              <Button 
                onClick={startGame} 
                size="lg" 
                className="bg-gradient-to-r from-fuchsia-600 to-violet-600 active:from-fuchsia-700 active:to-violet-700 min-h-[48px] px-8 shadow-lg shadow-fuchsia-500/20"
              >
                Start Game
              </Button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              {/* Score display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <motion.div 
                  key={score}
                  className="text-5xl sm:text-7xl font-bold text-fuchsia-400 tabular-nums"
                  style={{ textShadow: '0 0 40px rgba(217, 70, 239, 0.3)' }}
                >
                  {score}
                </motion.div>
                <motion.p 
                  key={currentTaunt}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-zinc-600 text-xs sm:text-sm mt-2"
                >
                  {currentTaunt}
                </motion.p>
              </div>

              {/* Distracting animated shapes */}
              {DISTRACTIONS.map((d, i) => (
                <motion.div 
                  key={i} 
                  animate={d.animate} 
                  transition={d.transition} 
                  className={d.className} 
                />
              ))}

              {/* Pulsing border to increase tension */}
              <motion.div 
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 border-2 border-fuchsia-500/50 rounded-xl sm:rounded-2xl pointer-events-none"
              />
            </motion.div>
          )}

          {gameState === 'lost' && (
            <motion.div 
              key="lost"
              initial={{ opacity: 0, scale: 1.05 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="absolute inset-0 flex flex-col items-center justify-center px-4 bg-gradient-to-b from-red-950/30 to-transparent"
            >
              <motion.div 
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="text-4xl sm:text-5xl mb-3"
              >
                💀
              </motion.div>
              <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-1">You moved!</div>
              <p className="text-zinc-600 text-xs sm:text-sm italic mb-4">{shameMsg}</p>
              <div className="text-xl sm:text-2xl text-zinc-400 mb-1">
                Score: <span className="text-fuchsia-400 font-bold">{score}</span>
              </div>
              <div className="text-zinc-500 text-sm mb-6">
                Best: <span className="text-violet-400">{highScore}</span>
              </div>
              <Button onClick={startGame} className="bg-gradient-to-r from-fuchsia-600 to-violet-600 active:from-fuchsia-700 active:to-violet-700 min-h-[44px] shadow-lg shadow-fuchsia-500/20">
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
