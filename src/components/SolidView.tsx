

import React, { useState, useEffect, useRef } from 'react';
import { EntropyReason, Task, Theme, TimerDisplayMode } from '../types';
import { LONG_PRESS_DURATION } from '../constants';
import { AlertTriangle, Minimize2 } from 'lucide-react';
import { Translation } from '../translations';
import { showNotification } from '../utils/notification';

interface SolidViewProps {
  task: Task;
  onComplete: () => void;
  onEntropy: (reason: EntropyReason) => void;
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
  // Clockwise wipe from 12 o'clock:
  // rotate(-90deg) puts start at 12.
  // strokeDasharray = C.
  // strokeDashoffset = C * (1 - progress).
  // As progress goes from 1 to 0, offset goes from 0 to C.
  // Positive offset shifts the pattern "backwards" (CW on standard path),
  // effectively creating a gap that grows from the start.
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: 'rotate(90deg) scaleX(-1)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDark ? '#27272a' : '#e5e5e5'}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
          style={{ filter: isDark ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))' : 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.3))' }}
        />
      </svg>
      {/* Center text */}
      <div className={`absolute text-center font-mono ${isDark ? 'text-zinc-500' : 'text-stone-400'}`}>
        <div className="text-2xl">{timeString}</div>
      </div>
    </div>
  );
};

export const SolidView: React.FC<SolidViewProps> = ({ task, onComplete, onEntropy, onMiniMode, theme, timeLeft, totalDuration, timerDisplayMode, t }) => {
  const isDark = theme === 'dark';
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [entropyTriggered, setEntropyTriggered] = useState(false);

  // Use number for browser compatibility as window.setInterval returns a number
  const holdIntervalRef = useRef<number | null>(null);
  // Ref to ensure onComplete is only called once
  const completedRef = useRef(false);

  // Handle Timer Completion (timer is managed by App.tsx)
  useEffect(() => {
    if (timeLeft <= 0 && !entropyTriggered && !completedRef.current) {
      completedRef.current = true; // Prevent multiple calls
      showNotification({
        title: t.notification.pomodoroComplete,
        body: t.notification.pomodoroCompleteBody,
        type: 'pomodoro',
      });
      onComplete();
    }
  }, [timeLeft, entropyTriggered, onComplete, t]);

  // Long Press Logic
  const startHold = () => {
    if (entropyTriggered) return;
    setIsHolding(true);
    const start = Date.now();

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        setEntropyTriggered(true);
        setIsHolding(false);
        return;
      }

      if (elapsed < LONG_PRESS_DURATION) {
        holdIntervalRef.current = requestAnimationFrame(animate);
      }
    };

    holdIntervalRef.current = requestAnimationFrame(animate);
  };

  const endHold = () => {
    if (entropyTriggered) return;
    setIsHolding(false);
    setHoldProgress(0);
    if (holdIntervalRef.current) cancelAnimationFrame(holdIntervalRef.current);
  };

  // Format Time
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Progress for ring (0 to 1)
  const progress = totalDuration > 0 ? timeLeft / totalDuration : 0;

  // Get Reason Keys from the translation object to ensure sync
  const reasonKeys = Object.keys(t.reasons) as EntropyReason[];

  if (entropyTriggered) {
    return (
      <div className={`flex flex-col items-center justify-center h-full animate-fade-in p-8 z-50 absolute inset-0 ${isDark ? 'bg-zinc-950' : 'bg-stone-50'}`}>
        <AlertTriangle size={64} className="mb-6 animate-pulse text-ash" />
        <h2 className={`text-3xl font-mono mb-8 text-center uppercase tracking-widest border-b pb-4 ${isDark ? 'text-ash border-ash/30' : 'text-ash border-ash/30'}`}>
          {t.solid.structureCollapsed}
        </h2>
        <p className={`mb-8 font-sans ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>{t.solid.energyLost}</p>

        <div className="grid gap-4 w-full max-w-md">
          {reasonKeys.map((reasonKey) => (
            <button
              key={reasonKey}
              onClick={() => onEntropy(reasonKey)}
              className={`p-4 border text-left transition-all rounded font-mono text-sm group ${isDark
                ? 'border-zinc-800 hover:border-ash hover:bg-ash/10 text-zinc-300'
                : 'border-stone-300 hover:border-ash hover:bg-ash/10 text-stone-700'
                }`}
            >
              <span className="text-ash mr-2">{'>'}</span>
              {t.reasons[reasonKey]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-zinc-950' : 'bg-stone-100'}`}>
      {/* Background Ambience */}
      <div className={`absolute inset-0 z-0 pointer-events-none ${isDark
        ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 to-black'
        : 'bg-white/50'
        }`}></div>

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

      {/* Task Info */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <h3 className={`text-sm uppercase tracking-[0.2em] mb-4 ${isDark ? 'text-zinc-500' : 'text-stone-500'}`}>{t.solid.currentFocus}</h3>
        <h1 className={`text-3xl md:text-4xl font-bold text-center font-mono leading-tight max-w-4xl mb-8 ${isDark ? 'text-white' : 'text-stone-900'}`}>
          {task.title}
        </h1>

        {/* Timer - Ring or Countdown */}
        {timerDisplayMode === 'ring' ? (
          <RingProgress progress={progress} isDark={isDark} timeString={timeString} />
        ) : (
          <div className={`font-mono text-[120px] md:text-[200px] leading-none tracking-tighter transition-all duration-100 ${isHolding
            ? 'text-ash blur-[2px] translate-x-1'
            : (isDark ? 'text-white' : 'text-stone-900')
            }`}>
            {timeString}
          </div>
        )}
      </div>

      {/* Entropy Trigger */}
      <div className="relative z-10 w-full">
        <div
          className={`w-full p-8 cursor-pointer transition-colors relative group select-none ${isDark
            ? 'bg-zinc-900 border-t border-zinc-800 active:bg-zinc-800'
            : 'bg-stone-200 border-t border-stone-300 active:bg-stone-300'
            }`}
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
        >
          {/* Progress Overlay */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-ash/20 transition-[width] ease-linear"
            style={{ width: `${holdProgress}%` }}
          />

          <div className={`relative flex flex-col items-center justify-center transition-colors ${isDark ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-stone-500 group-hover:text-stone-700'
            }`}>
            <span className="uppercase tracking-widest text-xs font-bold mb-1">
              {isHolding ? t.solid.holdToEntropy : t.solid.acceptEntropy}
            </span>
            <div className={`h-1 w-24 rounded-full overflow-hidden mt-2 ${!isHolding ? 'opacity-0' : 'opacity-100'} ${isDark ? 'bg-zinc-800' : 'bg-stone-300'}`}>
              <div className="h-full bg-ash" style={{ width: `${holdProgress}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};