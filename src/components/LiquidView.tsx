import React, { useEffect, useRef } from 'react';
import { Theme, TimerDisplayMode } from '../types';
import { Translation } from '../translations';
import { showNotification } from '../utils/notification';
import { Minimize2 } from 'lucide-react';

interface LiquidViewProps {
  onFinishBreak: () => void;
  onMiniMode?: () => void;
  theme: Theme;
  timeLeft: number;           // Received from parent (App.tsx)
  totalDuration: number;      // Total duration for progress calculation
  timerDisplayMode: TimerDisplayMode;
  t: Translation;
}

const RingProgress: React.FC<{ progress: number; isDark: boolean; timeString: string }> = ({ progress, isDark, timeString }) => {
  const size = 280;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center mb-8">
      <svg width={size} height={size} style={{ transform: 'rotate(90deg) scaleX(-1)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDark ? '#1e293b' : '#e0f2fe'}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDark ? '#22d3ee' : '#06b6d4'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
          style={{ filter: isDark ? 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.5))' : 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.3))' }}
        />
      </svg>
      {/* Center text */}
      <div className={`absolute text-center font-mono ${isDark ? 'text-cyan-400/50' : 'text-cyan-600/50'}`}>
        <div className="text-3xl font-thin">{timeString}</div>
      </div>
    </div>
  );
};

export const LiquidView: React.FC<LiquidViewProps> = ({ onFinishBreak, onMiniMode, theme, timeLeft, totalDuration, timerDisplayMode, t }) => {
  const isDark = theme === 'dark';
  const completedRef = useRef(false);

  // Handle Break Completion (timer is managed by App.tsx)
  useEffect(() => {
    if (timeLeft <= 0 && !completedRef.current) {
      completedRef.current = true;
      showNotification({
        title: t.notification.breakComplete,
        body: t.notification.breakCompleteBody,
        type: 'break',
      });
      onFinishBreak();
    }
  }, [timeLeft, onFinishBreak, t]);

  const minutes = Math.floor(Math.max(0, timeLeft) / 60);
  const seconds = Math.max(0, timeLeft) % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Progress for ring (0 to 1)
  const progress = totalDuration > 0 ? timeLeft / totalDuration : 0;

  return (
    <div className={`flex flex-col items-center justify-center h-full relative overflow-hidden transition-colors duration-500 ${isDark
      ? 'bg-gradient-to-b from-slate-900 to-zinc-950 text-white'
      : 'bg-gradient-to-b from-cyan-50 to-white text-stone-900'
      }`}>

      {/* Mini Mode Button */}
      {onMiniMode && (
        <button
          onClick={onMiniMode}
          className={`absolute top-3 right-3 z-20 p-2 rounded-lg transition-colors ${isDark
            ? 'text-zinc-500 hover:text-white hover:bg-zinc-800/80'
            : 'text-stone-400 hover:text-stone-900 hover:bg-stone-200/80'
            }`}
          title="迷你窗口"
        >
          <Minimize2 size={18} />
        </button>
      )}

      {/* Breathing Flower Animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[300px] h-[300px] animate-breathe-slow">
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <div
              key={i}
              className={`absolute w-32 h-32 rounded-full blur-2xl opacity-40 ${isDark ? 'bg-cyan-500 mix-blend-screen' : 'bg-cyan-400 mix-blend-multiply'
                }`}
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${deg}deg) translate(60px)`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 text-center">
        <h2 className={`text-3xl font-light tracking-widest mb-2 font-sans ${isDark ? 'text-cyan-100' : 'text-cyan-900'
          }`}>
          {t.liquid.restoration}
        </h2>

        {timerDisplayMode === 'ring' ? (
          <RingProgress progress={progress} isDark={isDark} timeString={timeString} />
        ) : (
          <div className={`text-8xl font-mono font-thin my-8 ${isDark ? 'text-cyan-700/50' : 'text-cyan-600/30'
            }`}>
            {timeString}
          </div>
        )}
      </div>

      <button
        onClick={onFinishBreak}
        className={`absolute bottom-12 text-xs uppercase tracking-widest transition-colors ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-stone-400 hover:text-stone-600'
          }`}
      >
        {t.liquid.skip}
      </button>
    </div>
  );
};