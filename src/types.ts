

export type TaskStatus = 'active' | 'completed' | 'archived';

export interface Task {
  id: string;
  listId: string; // Domain/List ID
  title: string;
  estimate: number; // 1-4 pomodoros. 0 if container.
  completedPomodoros: number;
  failedPomodoros: number;
  parentId?: string; // If this is a subtask
  createdAt: number;
  status: TaskStatus;
  isProject?: boolean; // If true, it's a container, not actionable directly
  sortOrder: number; // For drag and drop sorting
}

export interface List {
  id: string;
  name: string;
  type: 'inbox' | 'user' | 'done' | 'trash';
  icon?: string;
}

export type EntropyReason = 'internal' | 'external' | 'cognitive';

export interface LogEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  type: 'creation' | 'start' | 'crystallization' | 'entropy';
  timestamp: number;
  entropyReason?: EntropyReason;
  duration?: number; // Duration in seconds if applicable
}

export type AppMode = 'PLAN' | 'SOLID' | 'LIQUID' | 'MIRROR' | 'SETTINGS';

export type Theme = 'light' | 'dark';

export type Language = 'en' | 'zh';

export type TimerDisplayMode = 'countdown' | 'ring';

export interface Settings {
  pomodoroDuration: number; // in minutes
  breakDuration: number; // in minutes
  showCategories: boolean;
  language: Language;
  autoStart?: boolean; // Auto start on system boot
  timerDisplayMode: TimerDisplayMode; // Display countdown numbers or ring progress
}

export interface AppState {
  tasks: Task[];
  logs: LogEntry[];
  currentTaskId: string | null;
  mode: AppMode;
  settings: Settings;
}