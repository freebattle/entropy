import Database from '@tauri-apps/plugin-sql';
import { Task, LogEntry, Settings, List } from '../types';

// Database instance
let db: Database | null = null;

// Initialize database connection
export async function initDatabase(): Promise<Database> {
    if (db) {
        console.log('[SQLite] Using existing database connection');
        return db;
    }

    console.log('[SQLite] Initializing database...');
    db = await Database.load('sqlite:entropy.db');
    console.log('[SQLite] Database loaded');

    // Create tables if they don't exist
    await db.execute(`
    CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT
    )
  `);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      listId TEXT NOT NULL,
      title TEXT NOT NULL,
      estimate INTEGER NOT NULL,
      completedPomodoros INTEGER NOT NULL DEFAULT 0,
      failedPomodoros INTEGER NOT NULL DEFAULT 0,
      parentId TEXT,
      createdAt INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      isProject INTEGER DEFAULT 0,
      sortOrder INTEGER DEFAULT 0,
      FOREIGN KEY (listId) REFERENCES lists(id)
    )
  `);

    // Migration for existing databases
    try {
        await db.execute(`ALTER TABLE tasks ADD COLUMN sortOrder INTEGER DEFAULT 0`);
        console.log('[SQLite] Migration: Added sortOrder column to tasks table');
    } catch (e) {
        // Column might already exist
        console.log('[SQLite] Migration: sortOrder column already exists or migration failed (expected for new DB)');
    }

    await db.execute(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      taskTitle TEXT NOT NULL,
      type TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      entropyReason TEXT,
      duration INTEGER
    )
  `);

    await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

    // Insert default lists if empty
    const existingLists = await db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM lists');
    if (existingLists[0].count === 0) {
        console.log('[SQLite] Inserting default lists...');
        await db.execute(`INSERT INTO lists (id, name, type) VALUES ('inbox', 'Inbox', 'inbox')`);
        await db.execute(`INSERT INTO lists (id, name, type) VALUES ('work', 'Work', 'user')`);
        await db.execute(`INSERT INTO lists (id, name, type) VALUES ('life', 'Life', 'user')`);
        await db.execute(`INSERT INTO lists (id, name, type) VALUES ('done', 'Done', 'done')`);
    }

    console.log('[SQLite] Database initialization complete');
    return db;
}

// Lists
export async function getLists(): Promise<List[]> {
    const database = await initDatabase();
    return await database.select<List[]>('SELECT * FROM lists');
}

// Tasks
export async function getTasks(): Promise<Task[]> {
    const database = await initDatabase();
    const rows = await database.select<any[]>('SELECT * FROM tasks ORDER BY sortOrder ASC, createdAt ASC');
    return rows.map(row => ({
        ...row,
        isProject: Boolean(row.isProject)
    }));
}

export async function saveTask(task: Task): Promise<void> {
    console.log('[SQLite] Saving task:', task.id, task.title);
    const database = await initDatabase();
    await database.execute(
        `INSERT OR REPLACE INTO tasks (id, listId, title, estimate, completedPomodoros, failedPomodoros, parentId, createdAt, status, isProject, sortOrder)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [task.id, task.listId, task.title, task.estimate, task.completedPomodoros, task.failedPomodoros, task.parentId || null, task.createdAt, task.status, task.isProject ? 1 : 0, task.sortOrder || 0]
    );
    console.log('[SQLite] Task saved successfully:', task.id);
}

export async function updateTask(task: Task): Promise<void> {
    await saveTask(task);
}

// Logs
export async function getLogs(): Promise<LogEntry[]> {
    const database = await initDatabase();
    return await database.select<LogEntry[]>('SELECT * FROM logs ORDER BY timestamp ASC');
}

export async function addLog(log: LogEntry): Promise<void> {
    const database = await initDatabase();
    await database.execute(
        `INSERT INTO logs (id, taskId, taskTitle, type, timestamp, entropyReason, duration)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [log.id, log.taskId, log.taskTitle, log.type, log.timestamp, log.entropyReason || null, log.duration || null]
    );
}

// Settings
export async function getSettings(): Promise<Settings> {
    const database = await initDatabase();
    const rows = await database.select<{ key: string; value: string }[]>('SELECT * FROM settings');

    const settingsMap: Record<string, string> = {};
    rows.forEach(row => {
        settingsMap[row.key] = row.value;
    });

    return {
        pomodoroDuration: parseInt(settingsMap.pomodoroDuration) || 25,
        breakDuration: parseInt(settingsMap.breakDuration) || 5,
        showCategories: settingsMap.showCategories !== 'false',
        language: (settingsMap.language as 'en' | 'zh') || 'en',
        autoStart: settingsMap.autoStart === 'true',
        timerDisplayMode: (settingsMap.timerDisplayMode as 'countdown' | 'ring') || 'countdown'
    };
}

export async function saveSettings(settings: Settings): Promise<void> {
    const database = await initDatabase();
    const entries = Object.entries(settings);

    for (const [key, value] of entries) {
        await database.execute(
            `INSERT OR REPLACE INTO settings (key, value) VALUES ($1, $2)`,
            [key, String(value)]
        );
    }
}
