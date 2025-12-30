mod tray;

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn show_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
    notification_type: String,
) -> Result<String, String> {
    // Get primary monitor
    let monitor = app
        .primary_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("No monitor found")?;

    let scale_factor = monitor.scale_factor();
    let screen_size = monitor.size();
    let screen_width = screen_size.width as f64 / scale_factor;
    let screen_height = screen_size.height as f64 / scale_factor;

    let window_width = 320.0;
    let window_height = 100.0;
    let margin = 20.0;

    let x = screen_width - window_width - margin;
    let y = screen_height - window_height - margin - 50.0; // Extra margin for taskbar

    // Create URL with parameters
    let url = format!(
        "/src/notification.html?title={}&body={}&type={}",
        urlencoding::encode(&title),
        urlencoding::encode(&body),
        urlencoding::encode(&notification_type)
    );

    let label = format!("notification-{}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis());

    let _webview = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App(url.into()))
        .title("Entropy Notification")
        .inner_size(window_width, window_height)
        .position(x, y)
        .resizable(false)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .focused(false)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(label)
}

#[tauri::command]
async fn close_notification(app: tauri::AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn force_show_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        // Show the window
        window.show().map_err(|e| e.to_string())?;
        window.unminimize().map_err(|e| e.to_string())?;
        
        // Show the window and focus it
        window.set_focus().map_err(|e| e.to_string())?;
        
        // Small delay then disable always on top (unless user has it pinned)
        let _win = window.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(100));
            // We don't disable always_on_top here because user might have it pinned
            // The notification will show on top anyway
        });
    }
    Ok(())
}

#[tauri::command]
async fn update_tray_pin_state(app: tauri::AppHandle, is_pinned: bool) -> Result<(), String> {
    tray::update_pin_menu_state(&app, is_pinned).map_err(|e| e.to_string())
}

use std::sync::Mutex;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// Store window positions separately for mini and main modes
#[derive(Clone, Copy, Serialize, Deserialize, Debug)]
struct WindowPosition {
    x: i32,
    y: i32,
    initialized: bool,
}

impl Default for WindowPosition {
    fn default() -> Self {
        Self {
            x: 0,
            y: 0,
            initialized: false,
        }
    }
}

#[derive(Clone, Copy, Serialize, Deserialize, Debug, Default)]
struct WindowState {
    main_pos: WindowPosition,
    mini_pos: WindowPosition,
    is_mini: bool,
}

static WINDOW_STATE: Lazy<Mutex<WindowState>> = Lazy::new(|| Mutex::new(WindowState::default()));

fn get_state_path(app: &tauri::AppHandle) -> PathBuf {
    app.path().app_config_dir().unwrap_or_default().join("window-state-custom.json")
}

fn save_window_state_to_disk(app: &tauri::AppHandle, state: &WindowState) {
    let path = get_state_path(app);
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(json) = serde_json::to_string(state) {
        let _ = fs::write(path, json);
    }
}

fn load_window_state_from_disk(app: &tauri::AppHandle) -> WindowState {
    let path = get_state_path(app);
    if let Ok(json) = fs::read_to_string(path) {
        if let Ok(state) = serde_json::from_str(&json) {
            return state;
        }
    }
    WindowState::default()
}

#[tauri::command]
async fn toggle_mini_window(app: tauri::AppHandle, is_mini: bool, is_pinned: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        // Get current position before resizing
        let current_pos = window.outer_position().map_err(|e| e.to_string())?;
        
        let mut state = WINDOW_STATE.lock().map_err(|e| e.to_string())?;
        
        if is_mini {
            // Save current position as MAIN position before switching to mini
            state.main_pos.x = current_pos.x;
            state.main_pos.y = current_pos.y;
            state.main_pos.initialized = true;
            state.is_mini = true;
            
            // Switch to mini mode: 180x44 window
            window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 180.0, height: 44.0 }))
                .map_err(|e| e.to_string())?;
            window.set_resizable(false).map_err(|e| e.to_string())?;
            window.set_always_on_top(true).map_err(|e| e.to_string())?;
            
            // Restore mini window position if previously saved
            if state.mini_pos.initialized {
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: state.mini_pos.x, y: state.mini_pos.y }))
                    .map_err(|e| e.to_string())?;
            }
        } else {
            // Save current position as MINI position before switching back to main
            state.mini_pos.x = current_pos.x;
            state.mini_pos.y = current_pos.y;
            state.mini_pos.initialized = true;
            state.is_mini = false;
            
            // Switch back to main mode: 385x640 window
            window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 385.0, height: 640.0 }))
                .map_err(|e| e.to_string())?;
            window.set_resizable(false).map_err(|e| e.to_string())?;
            
            // Restore always on top state from user's pin setting
            window.set_always_on_top(is_pinned).map_err(|e| e.to_string())?;
            
            // Restore main window position if previously saved
            if state.main_pos.initialized {
                window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: state.main_pos.x, y: state.main_pos.y }))
                    .map_err(|e| e.to_string())?;
            }
        }
        
        // Save to disk immediately on toggle
        save_window_state_to_disk(&app, &state);
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // 当用户尝试启动第二个实例时，聚焦到已有窗口
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))

        .setup(|app| {
            // Load window state
            let mut saved_state = load_window_state_from_disk(app.handle());
            
            // Fix: Front-end always starts in PLAN mode (normal),
            // so we MUST ensure the window starts in normal size/position
            // even if it was closed in mini mode.
            saved_state.is_mini = false; 

            if let Ok(mut state) = WINDOW_STATE.lock() {
                *state = saved_state;
            }

            if let Some(window) = app.get_webview_window("main") {
                // Force normal size on startup to match App.tsx default state
                let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 385.0, height: 640.0 }));
                let _ = window.set_resizable(false);
                let _ = window.set_always_on_top(false);

                // Restore main window position if previously saved
                if saved_state.main_pos.initialized {
                    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { 
                        x: saved_state.main_pos.x, 
                        y: saved_state.main_pos.y 
                    }));
                } else {
                    let _ = window.center();
                }

                // Add movement listener for real-time position saving
                let app_handle = app.handle().clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Moved(pos) = event {
                        if let Ok(mut state) = WINDOW_STATE.lock() {
                            if state.is_mini {
                                state.mini_pos.x = pos.x;
                                state.mini_pos.y = pos.y;
                                state.mini_pos.initialized = true;
                            } else {
                                state.main_pos.x = pos.x;
                                state.main_pos.y = pos.y;
                                state.main_pos.initialized = true;
                            }
                            save_window_state_to_disk(&app_handle, &state);
                        }
                    }
                });
            }

            // Create system tray
            tray::create_tray(app)?;

            // Setup global shortcut (Ctrl+Shift+P to toggle window)
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
                
                let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyP);
                
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |app, _shortcut, event| {
                            if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                                if let Some(window) = app.get_webview_window("main") {
                                    if window.is_visible().unwrap_or(false) {
                                        let _ = window.hide();
                                    } else {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                            }
                        })
                        .build(),
                )?;
                
                // Try to unregister first in case it's still registered from a previous run
                let _ = app.global_shortcut().unregister(shortcut);
                // Then register, ignoring errors if it fails
                let _ = app.global_shortcut().register(shortcut);
            }

            // Setup logging in debug mode
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, show_notification, close_notification, force_show_window, update_tray_pin_state, toggle_mini_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
