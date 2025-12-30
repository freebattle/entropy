import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';

export interface NotificationOptions {
    title: string;
    body: string;
    type: 'pomodoro' | 'break';
}

// Event emitter for notifications
type NotificationCallback = (notification: NotificationOptions & { id: string }) => void;
let notificationCallback: NotificationCallback | null = null;

export function onNotification(callback: NotificationCallback) {
    notificationCallback = callback;
}

export async function showNotification(options: NotificationOptions): Promise<void> {
    const { title, body, type } = options;

    try {
        // Use Rust command to force show and focus window
        await invoke('force_show_window');

        // Trigger the notification callback
        if (notificationCallback) {
            notificationCallback({
                id: `notification-${Date.now()}`,
                title,
                body,
                type,
            });
        }
    } catch (error) {
        console.error('Failed to show notification:', error);

        // Fallback: try frontend API
        try {
            const mainWindow = getCurrentWindow();
            await mainWindow.show();
            await mainWindow.unminimize();
            await mainWindow.setFocus();
        } catch (e) {
            console.error('Fallback also failed:', e);
        }

        // Still show the notification
        if (notificationCallback) {
            notificationCallback({
                id: `notification-${Date.now()}`,
                title,
                body,
                type,
            });
        }
    }
}
