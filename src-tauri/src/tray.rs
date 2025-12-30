use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, Runtime,
};

pub fn create_tray<R: Runtime>(app: &tauri::App<R>) -> tauri::Result<()> {
    // 创建菜单项
    let toggle_pin_item = CheckMenuItem::with_id(app, "toggle_pin", "置顶窗口", true, false, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    
    // 创建菜单
    let menu = Menu::with_items(app, &[&toggle_pin_item, &quit_item])?;
    
    let _ = TrayIconBuilder::with_id("main-tray")
        .tooltip("Entropy")
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            if event.id == "quit" {
                app.exit(0);
            } else if event.id == "toggle_pin" {
                // 切换窗口置顶状态
                // CheckMenuItem 会自动切换其勾选状态
                if let Some(window) = app.get_webview_window("main") {
                    let is_on_top = window.is_always_on_top().unwrap_or(false);
                    let new_state = !is_on_top;
                    let _ = window.set_always_on_top(new_state);
                    // 发送事件通知前端更新状态
                    let _ = app.emit("pin-state-changed", new_state);
                }
            }
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    // Toggle visibility: if visible, hide; if hidden, show
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            _ => {}
        })
        .build(app)?;
    Ok(())
}

/// 更新托盘菜单中置顶选项的勾选状态
pub fn update_pin_menu_state<R: Runtime>(app: &tauri::AppHandle<R>, is_pinned: bool) -> tauri::Result<()> {
    // 通过 ID 获取托盘图标，然后重新创建菜单以更新勾选状态
    if let Some(tray) = app.tray_by_id("main-tray") {
        // 创建新的菜单项（带有正确的勾选状态）
        let toggle_pin_item = CheckMenuItem::with_id(app, "toggle_pin", "置顶窗口", true, is_pinned, None::<&str>)?;
        let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
        let menu = Menu::with_items(app, &[&toggle_pin_item, &quit_item])?;
        tray.set_menu(Some(menu))?;
    }
    Ok(())
}
