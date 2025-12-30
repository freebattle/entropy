import React, { useEffect, useState } from 'react';
import { X, Coffee, Timer } from 'lucide-react';

export interface NotificationData {
    id: string;
    title: string;
    body: string;
    type: 'pomodoro' | 'break';
}

interface NotificationToastProps {
    notification: NotificationData;
    onClose: (id: string) => void;
    theme: 'light' | 'dark';
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose, theme }) => {
    const isDark = theme === 'dark';
    const isBreak = notification.type === 'break';

    useEffect(() => {
        // Auto close after 5 seconds
        const timer = setTimeout(() => {
            onClose(notification.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    return (
        <div
            className={`
        animate-slide-in-right
        flex items-start gap-3 p-4 rounded-xl shadow-2xl
        min-w-[300px] max-w-[360px]
        border backdrop-blur-sm
        ${isBreak
                    ? (isDark ? 'bg-cyan-950/95 border-cyan-800/50' : 'bg-cyan-50/95 border-cyan-200')
                    : (isDark ? 'bg-violet-950/95 border-violet-800/50' : 'bg-violet-50/95 border-violet-200')
                }
      `}
        >
            {/* Icon */}
            <div className={`
        flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
        ${isBreak
                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600'
                    : 'bg-gradient-to-br from-violet-500 to-purple-600'
                }
      `}>
                {isBreak ? (
                    <Coffee size={20} className="text-white" />
                ) : (
                    <Timer size={20} className="text-white" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {notification.title}
                </h4>
                <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {notification.body}
                </p>
            </div>

            {/* Close button */}
            <button
                onClick={() => onClose(notification.id)}
                className={`
          flex-shrink-0 p-1.5 rounded-lg transition-colors
          ${isDark
                        ? 'text-gray-400 hover:text-white hover:bg-white/10'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }
        `}
            >
                <X size={16} />
            </button>
        </div>
    );
};

interface NotificationContainerProps {
    notifications: NotificationData[];
    onClose: (id: string) => void;
    theme: 'light' | 'dark';
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
    notifications,
    onClose,
    theme,
}) => {
    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
            {notifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onClose={onClose}
                    theme={theme}
                />
            ))}
        </div>
    );
};
