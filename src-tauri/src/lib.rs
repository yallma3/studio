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
                let sidecar_path = if cfg!(debug_assertions) {
                    // In development, yaLLMa3API is in the project root (parent of src-tauri)
                    match std::env::current_dir() {
                        Ok(dir) => {
                            // src-tauri is a subdirectory, so go up one level
                            let project_root = dir.parent().unwrap_or(&dir);
                            project_root.join("yaLLMa3API").join("index.js")
                        },
                        Err(e) => {
                            eprintln!("Failed to get current directory: {}", e);
                            return;
                        }
                    }
                } else {
                    // In production, try multiple possible locations
                    let mut sidecar_path_opt = None;

                    // First, try the resource directory
                    if let Ok(resource_path) = app_handle.path().resource_dir() {
                        let resource_sidecar = resource_path.join("yaLLMa3API").join("index.js");
                        println!("Checking resource path: {:?}", resource_sidecar);
                        if resource_sidecar.exists() {
                            println!("Found yaLLMa3API in resource directory");
                            sidecar_path_opt = Some(resource_sidecar);
                        } else {
                            println!("yaLLMa3API not found in resource directory");
                        }
                    }

                    // If resource directory doesn't work, try AppImage path
                    if sidecar_path_opt.is_none() {
                        let appimage_path = std::path::PathBuf::from("/usr/lib/yaLLMa3 Studio/_up_/yaLLMa3API/index.js");
                        println!("Checking AppImage path: {:?}", appimage_path);
                        if appimage_path.exists() {
                            println!("Found yaLLMa3API in AppImage directory");
                            sidecar_path_opt = Some(appimage_path);
                        } else {
                            println!("yaLLMa3API not found in AppImage directory");
                        }
                    }

                    // If still not found, try to get resource directory as fallback
                    if sidecar_path_opt.is_none() {
                        if let Ok(resource_path) = app_handle.path().resource_dir() {
                            sidecar_path_opt = Some(resource_path.join("yaLLMa3API").join("index.js"));
                        }
                    }

                    match sidecar_path_opt {
                        Some(path) => path,
                        None => {
                            eprintln!("Could not find yaLLMa3API/index.js in any expected location");
                            return;
                        }
                    }
                };
                println!("Starting yaLLMa3API from path: {:?}", sidecar_path);

                // Check if Node.js is available
                if let Err(_) = std::process::Command::new("node").arg("--version").output() {
                    eprintln!("Node.js is not available in PATH");
                    return;
                }

                // Get app data directory for logs
                let app_data_dir = match app_handle.path().app_data_dir() {
                    Ok(dir) => dir,
                    Err(e) => {
                        eprintln!("Failed to get app data directory: {}", e);
                        return;
                    }
                };

                let logs_dir = app_data_dir.join("logs");

                // Spawn the Node.js process with environment variables
                match std::process::Command::new("node")
                    .arg(sidecar_path)
                    .env("YA_API_LOG_DIR", app_data_dir.to_string_lossy().to_string())
                    .spawn()
                {
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
