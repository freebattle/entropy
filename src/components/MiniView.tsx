import React, { useEffect, useCallback, useRef } from 'react';
import { Task, Theme } from '../types';
import { Translation } from '../translations';

interface MiniViewProps {
    task: Task | null;
    isBreakMode: boolean;
    timeLeft: number;           // Received from parent (App.tsx)
    totalDuration: number;      // Total duration for progress calculation
    theme: Theme;
    onComplete: () => void;
    onReturnToMain: () => void;
    t: Translation;
}

/**
 * MiniView - Compact floating timer window
 * Shows task title (or "正在休息...") with a small circular progress ring.
 * Draggable via title bar, double-click to return to main window.
 * Timer state is managed by App.tsx and passed as props.
 */
export const MiniView: React.FC<MiniViewProps> = ({
    task,
    isBreakMode,
    timeLeft,
    totalDuration,
    theme,
    onComplete,
    onReturnToMain,
    t
}) => {
    const isDark = theme === 'dark';
    const completedRef = useRef(false);

    // Reset completion ref when mode changes
    useEffect(() => {
        completedRef.current = false;
    }, [isBreakMode]);

    // Handle timer completion (no notification in mini mode)
    useEffect(() => {
        if (timeLeft <= 0 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    }, [timeLeft, onComplete]);

    // Ring progress calculation
    const progress = totalDuration > 0 ? timeLeft / totalDuration : 0;
    const size = 24;
    const strokeWidth = 3;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    // Double-click handler
    const handleDoubleClick = useCallback(() => {
        onReturnToMain();
    }, [onReturnToMain]);

    // Title text
    const titleText = isBreakMode ? t.mini.resting : (task?.title || '');

    // Colors based on mode
    const ringColor = isBreakMode
        ? '#ffffff' // White for high contrast on blue background
        : '#ef4444'; // Tomato red for focus

    const bgRingColor = isBreakMode
        ? 'rgba(255, 255, 255, 0.2)'
        : (isDark ? '#27272a' : '#e5e5e5');

    return (
        <div
            className={`h-full w-full flex items-center gap-3 px-3 cursor-default select-none transition-all border shadow-xl overflow-hidden relative ${isBreakMode
                ? 'animate-liquid-flow border-cyan-400 text-white'
                : (isDark
                    ? 'bg-zinc-900/60 border-zinc-700/50 text-white'
                    : 'bg-white/60 border-white/50 text-stone-900')
                } backdrop-blur-md`}
            onDoubleClick={handleDoubleClick}
            data-tauri-drag-region
        >
            {/* Content (Z-index 10 to stay above liquid background) */}
            <div className="relative z-10 flex items-center gap-3 w-full" data-tauri-drag-region>
                {/* Compact Ring Progress */}
                <div className="relative flex-shrink-0">
                    <svg
                        width={size}
                        height={size}
                        style={{ transform: 'rotate(90deg) scaleX(-1)' }}
                    >
                        {/* Background circle */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={bgRingColor}
                            strokeWidth={strokeWidth}
                        />
                        {/* Progress circle */}
                        <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={ringColor}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>
                </div>

                {/* Title */}
                <div
                    className={`flex-1 text-sm font-medium truncate ${isDark ? 'text-zinc-200' : 'text-stone-700'
                        }`}
                    title={titleText}
                    data-tauri-drag-region
                >
                    {titleText}
                </div>
            </div>
        </div>
    );
};
