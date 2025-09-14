mod sidecar;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    println!("Starting Yallma3 Desktop Application...");
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(sidecar::SidecarState::new())
        .invoke_handler(tauri::generate_handler![
            sidecar::spawn_yallma3api,
            sidecar::kill_yallma3api,
            sidecar::get_yallma3api_status
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Debug)
                        .build(),
                )?;
            }

            // Spawn yaLLMa3API on startup
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let state = app_handle.state::<sidecar::SidecarState>();
                let mut process_guard = state.process.lock().unwrap();

                if process_guard.is_some() {
                    println!("yaLLMa3API is already running");
                    return;
                }

                // Get the path to the yaLLMa3API executable
                let executable_path = if cfg!(debug_assertions) {
                    // In development, use node with the script
                    match std::env::current_dir() {
                        Ok(dir) => {
                            let project_root = dir.parent().unwrap_or(&dir);
                            project_root.join("yaLLMa3API").join("index.js")
                        },
                        Err(e) => {
                            eprintln!("Failed to get current directory: {}", e);
                            return;
                        }
                    }
                } else {
                    // In production, find the bundled executable in resources
                    let resource_dir = match app_handle.path().resource_dir() {
                        Ok(dir) => dir,
                        Err(e) => {
                            eprintln!("Failed to get resource directory: {}", e);
                            return;
                        }
                    };

                    #[cfg(target_os = "linux")]
                    {
                        resource_dir.join("bin").join("index-x86_64-unknown-linux-gnu")
                    }
                    #[cfg(target_os = "windows")]
                    {
                        resource_dir.join("bin").join("index-x86_64-pc-windows-msvc.exe")
                    }
                    #[cfg(target_os = "macos")]
                    {
                        resource_dir.join("bin").join("index-x86_64-apple-darwin")
                    }
                };

                println!("Using executable: {:?}", executable_path);

                // Get app data directory for logs
                let app_data_dir = match app_handle.path().app_data_dir() {
                    Ok(dir) => dir,
                    Err(e) => {
                        eprintln!("Failed to get app data directory: {}", e);
                        return;
                    }
                };

                // Spawn the process
                let _spawn_result = if cfg!(debug_assertions) {
                    // In development, spawn node with the script
                    std::process::Command::new("node")
                        .arg(&executable_path)
                        .env("YA_API_LOG_DIR", app_data_dir.to_string_lossy().to_string())
                        .spawn()
                } else {
                    // In production, spawn the bundled executable directly
                    std::process::Command::new(&executable_path)
                        .env("YA_API_LOG_DIR", app_data_dir.to_string_lossy().to_string())
                        .spawn()
                };

                println!("Using executable: {:?}", executable_path);

                // Get app data directory for logs
                let app_data_dir = match app_handle.path().app_data_dir() {
                    Ok(dir) => dir,
                    Err(e) => {
                        eprintln!("Failed to get app data directory: {}", e);
                        return;
                    }
                };

                // Spawn the process
                let _spawn_result = if cfg!(debug_assertions) {
                    // In development, spawn node with the script
                    std::process::Command::new("node")
                        .arg(&executable_path)
                        .env("YA_API_LOG_DIR", app_data_dir.to_string_lossy().to_string())
                        .spawn()
                } else {
                    // In production, spawn the bundled executable directly
                    std::process::Command::new(&executable_path)
                        .env("YA_API_LOG_DIR", app_data_dir.to_string_lossy().to_string())
                        .spawn()
                };

                match _spawn_result {
                    Ok(child) => {
                        *process_guard = Some(child);
                        println!("yaLLMa3API spawned successfully");
                    }
                    Err(e) => {
                        eprintln!("Failed to spawn yaLLMa3API: {}", e);
                    }
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { .. } => {
                let app_handle = window.app_handle();
                let state = app_handle.state::<sidecar::SidecarState>();
                let mut process_guard = state.process.lock().unwrap();
                if let Some(mut child) = process_guard.take() {
                    let _ = child.kill();
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
