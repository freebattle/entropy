import React, { useState, useEffect } from 'react';
import { X, Minus, Square, Copy, Pin } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface TitleBarProps {
    theme: 'light' | 'dark';
}

export const TitleBar: React.FC<TitleBarProps> = ({ theme }) => {
    const isDark = theme === 'dark';
    const appWindow = getCurrentWindow();
    const [isPinned, setIsPinned] = useState(false);

    // 初始化时检查当前置顶状态
    useEffect(() => {
        const checkPinned = async () => {
            const pinned = await appWindow.isAlwaysOnTop();
            setIsPinned(pinned);
        };
        checkPinned();
    }, []);

    const handlePin = async () => {
        const newPinned = !isPinned;
        await appWindow.setAlwaysOnTop(newPinned);
        setIsPinned(newPinned);
    };

    const handleMinimize = async () => {
        await appWindow.minimize();
    };

    const handleMaximize = async () => {
        const isMaximized = await appWindow.isMaximized();
        if (isMaximized) {
            await appWindow.unmaximize();
        } else {
            await appWindow.maximize();
        }
    };

    const handleClose = async () => {
        await appWindow.hide();
    };

    return (
        <div
            className={`fixed top-0 left-0 right-0 h-8 flex items-center justify-between z-50 transition-colors ${isDark ? 'bg-black/80' : 'bg-stone-50/80'
                } backdrop-blur-sm`}
        >
            {/* Drag region */}
            <div
                data-tauri-drag-region
                className="flex-1 h-full flex items-center px-4"
            >
                <span className={`text-xs font-mono tracking-wider ${isDark ? 'text-zinc-500' : 'text-stone-400'
                    }`}>
                    ENTROPY
                </span>
            </div>

            {/* Window controls */}
            <div className="flex h-full">
                <button
                    onClick={handlePin}
                    className={`w-12 h-full flex items-center justify-center transition-colors ${isPinned
                        ? (isDark ? 'bg-amber-600/80 text-white' : 'bg-amber-500/80 text-white')
                        : (isDark
                            ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                            : 'hover:bg-stone-200 text-stone-400 hover:text-stone-900')
                        }`}
                    title={isPinned ? "取消置顶" : "置顶窗口"}
                >
                    <Pin size={12} className={isPinned ? "rotate-45" : ""} />
                </button>
                <button
                    onClick={handleMinimize}
                    className={`w-12 h-full flex items-center justify-center transition-colors ${isDark
                        ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                        : 'hover:bg-stone-200 text-stone-400 hover:text-stone-900'
                        }`}
                    title="Minimize"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={handleMaximize}
                    className={`w-12 h-full flex items-center justify-center transition-colors ${isDark
                        ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                        : 'hover:bg-stone-200 text-stone-400 hover:text-stone-900'
                        }`}
                    title="Maximize"
                >
                    <Copy size={12} className="rotate-90" />
                </button>
                <button
                    onClick={handleClose}
                    className={`w-12 h-full flex items-center justify-center transition-colors ${isDark
                        ? 'hover:bg-rose-600 text-zinc-400 hover:text-white'
                        : 'hover:bg-rose-600 text-stone-400 hover:text-white'
                        }`}
                    title="Close to tray"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
