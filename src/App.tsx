
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlanView } from './components/PlanView';
import { SolidView } from './components/SolidView';
import { LiquidView } from './components/LiquidView';
import { MirrorView } from './components/MirrorView';
import { SettingsView } from './components/SettingsView';
import { MiniView } from './components/MiniView';
import { NotificationContainer, NotificationData } from './components/NotificationToast';

import { Task, LogEntry, AppMode, EntropyReason, List, Theme, TaskStatus, Settings } from './types';
import { Sun, Moon, Settings as SettingsIcon, History, X, Pin, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { getTranslation } from './translations';
import { onNotification } from './utils/notification';
import {
  initDatabase,
  getLists,
  getTasks,
  getLogs,
  getSettings,
  saveTask,
  addLog as addLogToDb,
  saveSettings
} from './hooks/useTauriStorage';

// Default values
const DEFAULT_LISTS: List[] = [
  { id: 'inbox', name: 'Inbox', type: 'inbox' },
  { id: 'work', name: 'Work', type: 'user' },
  { id: 'life', name: 'Life', type: 'user' },
  { id: 'done', name: 'Done', type: 'done' },
];

const DEFAULT_SETTINGS: Settings = {
  pomodoroDuration: 25,
  breakDuration: 5,
  showCategories: true,
  language: 'en',
  timerDisplayMode: 'countdown',
};

const App: React.FC = () => {
  // --- State ---
  const [isLoading, setIsLoading] = useState(true);
  const [lists, setLists] = useState<List[]>(DEFAULT_LISTS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<AppMode>('PLAN');
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentListId, setCurrentListId] = useState<string>('inbox');
  const [theme, setTheme] = useState<Theme>('light');
  const [isPinned, setIsPinned] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Shared timer state - managed at App level for sync between mini and normal views
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Timer effect - runs every second when timer is active
  useEffect(() => {
    if (!timerStartedAt || timerDuration <= 0) {
      return;
    }

    const updateTimeLeft = () => {
      const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      setTimeLeft(remaining);
    };

    // Initial update
    updateTimeLeft();

    // Update every second
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [timerStartedAt, timerDuration]);

  // Ref to track if initial load is done (to prevent saving during load)
  const isInitialized = useRef(false);

  // --- Initialize Database and Load Data ---
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDatabase();

        // Load data from SQLite
        const [dbLists, dbTasks, dbLogs, dbSettings] = await Promise.all([
          getLists(),
          getTasks(),
          getLogs(),
          getSettings()
        ]);

        setLists(dbLists.length > 0 ? dbLists : DEFAULT_LISTS);
        setTasks(dbTasks);
        setLogs(dbLogs);
        setSettings(dbSettings);
        isInitialized.current = true;
      } catch (error) {
        console.error('Failed to load data from database:', error);
        isInitialized.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Notification handlers
  const handleCloseNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    onNotification((notification) => {
      setNotifications(prev => [...prev, notification]);
    });
  }, []);

  const t = getTranslation(settings.language || 'en');

  // --- Persistence - Save settings when changed ---
  useEffect(() => {
    if (!isInitialized.current) return;
    saveSettings(settings).catch(err => console.error('Failed to save settings:', err));
  }, [settings]);

  // --- Helpers ---
  const addLog = async (type: LogEntry['type'], taskId: string, taskTitle: string, reason?: EntropyReason) => {
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      taskId,
      taskTitle,
      entropyReason: reason,
    };
    setLogs(prev => [...prev, newLog]);
    if (isInitialized.current) {
      await addLogToDb(newLog).catch(err => console.error('Failed to save log:', err));
    }
  };

  // --- Handlers ---
  const handleAddProject = async (title: string): Promise<string> => {
    const projectId = crypto.randomUUID();
    const projectTask: Task = {
      id: projectId,
      listId: currentListId === 'done' ? 'inbox' : currentListId,
      title,
      estimate: 0,
      completedPomodoros: 0,
      failedPomodoros: 0,
      createdAt: Date.now(),
      status: 'active',
      isProject: true,
      sortOrder: tasks.length > 0 ? Math.max(...tasks.map(t => t.sortOrder)) + 100 : 1000
    };
    setTasks(prev => [...prev, projectTask]);
    if (isInitialized.current) {
      await saveTask(projectTask).catch(err => console.error('Failed to save project:', err));
    }
    await addLog('creation', projectId, title);
    return projectId;
  };

  const handleAddTask = async (title: string, estimate: number, parentId?: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      listId: currentListId === 'done' ? 'inbox' : currentListId,
      title,
      estimate,
      completedPomodoros: 0,
      failedPomodoros: 0,
      createdAt: Date.now(),
      status: 'active',
      parentId: parentId,
      sortOrder: tasks.length > 0 ? Math.max(...tasks.map(t => t.sortOrder)) + 100 : 1000
    };
    setTasks(prev => [...prev, newTask]);
    if (isInitialized.current) {
      await saveTask(newTask).catch(err => console.error('Failed to save task:', err));
    }
    await addLog('creation', newTask.id, title);
  };

  const handleStartTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setCurrentTaskId(taskId);
    setMode('SOLID');
    // Start timer - set timeLeft immediately
    const pomoDurationSecs = settings.pomodoroDuration * 60;
    setTimeLeft(pomoDurationSecs);
    setTimerDuration(pomoDurationSecs);
    setTimerStartedAt(Date.now());
    await addLog('start', taskId, task.title);
  };

  const handleDeleteTask = async (taskId: string) => {
    const updatedTasks: Task[] = [];
    setTasks(prev => {
      const newTasks = prev.map(t => {
        if (t.id === taskId || t.parentId === taskId) {
          const updated = { ...t, status: 'archived' as TaskStatus };
          updatedTasks.push(updated);
          return updated;
        }
        return t;
      });
      return newTasks;
    });
    // Save updated tasks to database
    if (isInitialized.current) {
      for (const task of updatedTasks) {
        await saveTask(task).catch(err => console.error('Failed to save task:', err));
      }
    }
  };

  const handleToggleTaskCompletion = async (taskId: string) => {
    const tasksToSave: Task[] = [];
    setTasks(prev => {
      // 1. Update the status of the target task
      let updatedTasks: Task[] = prev.map(t => {
        if (t.id === taskId) {
          const newStatus: TaskStatus = t.status === 'completed' ? 'active' : 'completed';
          const updated = { ...t, status: newStatus };
          tasksToSave.push(updated);
          return updated;
        }
        return t;
      });

      // 2. Check for Parent Auto-Completion Logic
      const toggledTask = updatedTasks.find(t => t.id === taskId);

      if (toggledTask && toggledTask.parentId && toggledTask.status === 'completed') {
        const parentId = toggledTask.parentId;
        const siblings = updatedTasks.filter(t => t.parentId === parentId && t.status !== 'archived');
        const allSiblingsDone = siblings.every(s => s.status === 'completed');

        if (allSiblingsDone) {
          updatedTasks = updatedTasks.map(t => {
            if (t.id === parentId) {
              const updated = { ...t, status: 'completed' as TaskStatus };
              tasksToSave.push(updated);
              return updated;
            }
            return t;
          });
        }
      }

      return updatedTasks;
    });
    // Save to database
    if (isInitialized.current) {
      for (const task of tasksToSave) {
        await saveTask(task).catch(err => console.error('Failed to save task:', err));
      }
    }
  };

  const handleUpdateTask = async (taskId: string, title: string, estimate: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = { ...task, title, estimate };
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

    if (isInitialized.current) {
      await saveTask(updatedTask).catch(err => console.error('Failed to save task:', err));
    }
  };
  const handleReorderTasks = async (reorderedTasks: Task[]) => {
    console.log('[App] Reordering request for', reorderedTasks.length, 'items');

    // 先同步前端 UI 状态
    setTasks(prev => {
      const newTasks = [...prev];
      reorderedTasks.forEach(item => {
        const index = newTasks.findIndex(t => t.id === item.id);
        if (index !== -1) {
          newTasks[index] = item;
        }
      });
      return newTasks;
    });

    // 只要数据库初始化了就尝试保存
    try {
      for (const task of reorderedTasks) {
        await saveTask(task);
      }
      console.log('[App] SQLite: New sort order persists successfully');
    } catch (err) {
      console.error('[App] SQLite: Save failed!', err);
    }
  };

  const handleCompletePomodoro = async () => {
    if (!currentTaskId) return;

    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;

    const updatedTask = { ...task, completedPomodoros: task.completedPomodoros + 1 };

    // Update Task
    setTasks(prev => prev.map(t =>
      t.id === currentTaskId ? updatedTask : t
    ));

    if (isInitialized.current) {
      await saveTask(updatedTask).catch(err => console.error('Failed to save task:', err));
    }

    await addLog('crystallization', task.id, task.title);

    // Switch to break mode and start break timer
    // Set timeLeft immediately to prevent completion effect from triggering
    const breakDurationSecs = settings.breakDuration * 60;
    setTimeLeft(breakDurationSecs);
    setTimerDuration(breakDurationSecs);
    setTimerStartedAt(Date.now());
    setMode('LIQUID');
  };

  const handleEntropy = async (reason: EntropyReason) => {
    if (!currentTaskId) return;

    const task = tasks.find(t => t.id === currentTaskId);
    if (!task) return;

    const updatedTask = { ...task, failedPomodoros: task.failedPomodoros + 1 };

    setTasks(prev => prev.map(t =>
      t.id === currentTaskId ? updatedTask : t
    ));

    if (isInitialized.current) {
      await saveTask(updatedTask).catch(err => console.error('Failed to save task:', err));
    }

    await addLog('entropy', task.id, task.title, reason);

    setMode('PLAN');
    setCurrentTaskId(null);
    // Stop timer
    setTimeLeft(0);
    setTimerStartedAt(null);
    setTimerDuration(0);
    // Exit mini mode and restore window
    if (isMiniMode) {
      setIsMiniMode(false);
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('toggle_mini_window', { isMini: false, isPinned: isPinned });
      });
    }
  };

  const handleFinishBreak = () => {
    setMode('PLAN');
    setCurrentTaskId(null);
    // Stop timer
    setTimeLeft(0);
    setTimerStartedAt(null);
    setTimerDuration(0);
    // Exit mini mode and restore window
    if (isMiniMode) {
      setIsMiniMode(false);
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke('toggle_mini_window', { isMini: false, isPinned: isPinned });
      });
    }
  };

  const handleSelectList = (id: string) => {
    setCurrentListId(id);
    setMode('PLAN'); // Always go to plan view when switching lists
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Window control handlers
  const appWindow = getCurrentWindow();

  // 初始化时检查当前置顶状态，并监听来自托盘的状态变化
  useEffect(() => {
    const checkPinned = async () => {
      const pinned = await appWindow.isAlwaysOnTop();
      setIsPinned(pinned);
    };
    checkPinned();

    // 监听来自托盘菜单的置顶状态变化事件
    let unlistenFn: (() => void) | undefined;
    const setupListener = async () => {
      const { listen } = await import('@tauri-apps/api/event');
      unlistenFn = await listen<boolean>('pin-state-changed', (event) => {
        setIsPinned(event.payload);
      });
    };
    setupListener();

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, []);

  const handlePin = async () => {
    const newPinned = !isPinned;
    await appWindow.setAlwaysOnTop(newPinned);
    setIsPinned(newPinned);
    // 同步更新托盘菜单的勾选状态
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('update_tray_pin_state', { isPinned: newPinned });
  };

  const handleClose = async () => {
    await appWindow.hide();
  };

  // Toggle mini window mode
  const handleToggleMiniMode = async () => {
    const newMiniMode = !isMiniMode;
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('toggle_mini_window', { isMini: newMiniMode, isPinned: isPinned });
    setIsMiniMode(newMiniMode);
  };

  // Return to main window from mini mode
  const handleReturnToMain = async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('toggle_mini_window', { isMini: false, isPinned: isPinned });
    setIsMiniMode(false);
  };

  // Filtering for View
  const visibleTasks = tasks.filter(t => {
    if (t.status === 'archived') return false;

    // Done View: Show completed tasks
    if (currentListId === 'done') {
      if (t.status !== 'completed') return false;

      // "Only transfer together": If this is a subtask, don't show it in Done list
      // if its parent is still active (it belongs to the active project).
      if (t.parentId) {
        const parent = tasks.find(p => p.id === t.parentId);
        if (parent && parent.status === 'active') return false;
      }
      return true;
    }

    // Active Views (Inbox, Work, Life)

    // 1. Is active and belongs to this list
    if (t.listId === currentListId && t.status === 'active') return true;

    // 2. "Subtasks don't disappear": Is completed subtask of an ACTIVE parent in this list
    if (t.status === 'completed' && t.parentId) {
      const parent = tasks.find(p => p.id === t.parentId);
      if (parent && parent.status === 'active' && parent.listId === currentListId) {
        return true;
      }
    }

    return false;
  });

  const currentTask = tasks.find(t => t.id === currentTaskId);

  // Show loading state while database is initializing
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-950' : 'bg-stone-50'}`}>
        <div className={`flex flex-col items-center gap-4 ${theme === 'dark' ? 'text-zinc-500' : 'text-stone-400'}`}>
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs font-mono">INITIALIZING...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${isMiniMode
        ? 'bg-transparent'
        : (theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-stone-50 text-stone-900')
        }`}
      onContextMenu={(e) => e.preventDefault()}
    >

      {/* Mini Window Mode */}
      {isMiniMode && (mode === 'SOLID' || mode === 'LIQUID') && (
        <div className="fixed inset-0 z-50" data-tauri-drag-region>
          <MiniView
            task={currentTask || null}
            isBreakMode={mode === 'LIQUID'}
            timeLeft={timeLeft}
            totalDuration={timerDuration}
            theme={theme}
            onComplete={mode === 'LIQUID' ? handleFinishBreak : handleCompletePomodoro}
            onReturnToMain={handleReturnToMain}
            t={t}
          />
        </div>
      )}

      {/* Modes that take over full screen (only when not in mini mode) */}
      {mode === 'SOLID' && currentTask && !isMiniMode && (
        <div className="fixed inset-0 z-50">
          <SolidView
            task={currentTask}
            onComplete={handleCompletePomodoro}
            onEntropy={handleEntropy}
            onMiniMode={handleToggleMiniMode}
            theme={theme}
            timeLeft={timeLeft}
            totalDuration={timerDuration}
            timerDisplayMode={settings.timerDisplayMode || 'countdown'}
            t={t}
          />
        </div>
      )}

      {mode === 'LIQUID' && !isMiniMode && (
        <div className="fixed inset-0 z-50">
          <LiquidView
            onFinishBreak={handleFinishBreak}
            onMiniMode={handleToggleMiniMode}
            theme={theme}
            timeLeft={timeLeft}
            totalDuration={timerDuration}
            timerDisplayMode={settings.timerDisplayMode || 'countdown'}
            t={t}
          />
        </div>
      )}

      {mode === 'MIRROR' && (
        <div className="fixed inset-0 z-50">
          <MirrorView
            logs={logs}
            tasks={tasks}
            onBack={() => setMode('PLAN')}
            theme={theme}
            t={t}
          />
        </div>
      )}

      {mode === 'SETTINGS' && (
        <div className="fixed inset-0 z-50">
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onBack={() => setMode('PLAN')}
            theme={theme}
            t={t}
          />
        </div>
      )}

      {/* Main Single Column Layout - Only show when NOT in mini mode */}
      {!isMiniMode && (
        <main className="max-w-2xl mx-auto h-screen flex flex-col relative shadow-2xl shadow-black/5">

          {/* Draggable Header with Controls */}
          <header
            data-tauri-drag-region
            className={`fixed top-0 left-0 right-0 h-10 flex items-center justify-between z-40 transition-colors ${theme === 'dark' ? 'bg-zinc-950/90' : 'bg-stone-50/90'} backdrop-blur-sm`}
          >
            {/* App title in drag region */}
            <div data-tauri-drag-region className="flex-1 h-full flex items-center px-4">
              <span className={`text-xs font-mono tracking-wider ${theme === 'dark' ? 'text-zinc-500' : 'text-stone-400'}`}>
                ENTROPY
              </span>
            </div>

            {/* Controls: History, Theme, Settings, Minimize, Close */}
            <div className="flex items-center h-full">
              <button
                onClick={() => setMode('MIRROR')}
                className={`w-10 h-full flex items-center justify-center transition-colors ${theme === 'dark'
                  ? 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                  : 'text-stone-400 hover:text-stone-900 hover:bg-stone-200'
                  }`}
                title={t.mirror.chronicle}
              >
                <History size={16} />
              </button>

              <button
                onClick={toggleTheme}
                className={`w-10 h-full flex items-center justify-center transition-colors ${theme === 'dark'
                  ? 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                  : 'text-stone-400 hover:text-stone-900 hover:bg-stone-200'
                  }`}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              <button
                onClick={() => setMode('SETTINGS')}
                className={`w-10 h-full flex items-center justify-center transition-colors ${theme === 'dark'
                  ? 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                  : 'text-stone-400 hover:text-stone-900 hover:bg-stone-200'
                  }`}
                title={t.settings.title}
              >
                <SettingsIcon size={16} />
              </button>

              {/* Window Controls */}
              <button
                onClick={handlePin}
                className={`w-10 h-full flex items-center justify-center transition-colors ${isPinned
                  ? (theme === 'dark' ? 'bg-amber-600/80 text-white' : 'bg-amber-500/80 text-white')
                  : (theme === 'dark'
                    ? 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                    : 'text-stone-400 hover:text-stone-900 hover:bg-stone-200')
                  }`}
                title={isPinned ? "取消置顶" : "置顶窗口"}
              >
                <Pin size={14} className={isPinned ? "rotate-45" : ""} />
              </button>

              {/* Mini Mode Toggle - Only show during timer modes */}
              {(mode === 'SOLID' || mode === 'LIQUID') && (
                <button
                  onClick={handleToggleMiniMode}
                  className={`w-10 h-full flex items-center justify-center transition-colors ${theme === 'dark'
                    ? 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                    : 'text-stone-400 hover:text-stone-900 hover:bg-stone-200'
                    }`}
                  title={isMiniMode ? "返回主窗口" : "迷你窗口"}
                >
                  {isMiniMode ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
              )}

              <button
                onClick={handleClose}
                className={`w-10 h-full flex items-center justify-center transition-colors ${theme === 'dark'
                  ? 'hover:bg-rose-600 text-zinc-500 hover:text-white'
                  : 'hover:bg-rose-600 text-stone-400 hover:text-white'
                  }`}
                title="Close to tray"
              >
                <X size={14} />
              </button>
            </div>
          </header>

          {mode === 'PLAN' && (
            <PlanView
              tasks={visibleTasks}
              lists={lists}
              currentListId={currentListId}
              onSelectList={handleSelectList}
              onAddTask={handleAddTask} // Assuming handleAddTask is defined elsewhere and will incorporate the sortOrder logic.
              onStartTask={handleStartTask}
              onDeleteTask={handleDeleteTask}
              onAddProject={handleAddProject}
              onToggleTaskCompletion={handleToggleTaskCompletion}
              onUpdateTask={handleUpdateTask}
              onReorderTasks={handleReorderTasks}
              theme={theme}
              showCategories={settings.showCategories}
              t={t}
            />
          )}
        </main>
      )}

      {/* Notification Toasts */}
      <NotificationContainer
        notifications={notifications}
        onClose={handleCloseNotification}
        theme={theme}
      />

    </div>
  );
};

export default App;