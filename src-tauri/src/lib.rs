use std::process::{Command, Child, Stdio};
use std::sync::{Arc, Mutex};
use std::io::{BufRead, BufReader, Write};
use std::fs::{OpenOptions, create_dir_all};
use std::thread;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Load .env file
            if let Err(e) = dotenvy::dotenv() {
                println!("⚠️ Could not load .env file: {}", e);
            }

            // Check environment variable to conditionally spawn server
            let should_spawn_server = std::env::var("VITE_SPAWN_CORE")
                .unwrap_or_else(|_| "true".to_string())
                .parse::<bool>()
                .unwrap_or(true);

            println!("VITE_SPAWN_CORE = {}", should_spawn_server);

            if should_spawn_server {
                println!("VITE_SPAWN_CORE=true, spawning server...");
                let server_process = spawn_server(app)?;
                app.manage(server_process);
            } else {
                println!("VITE_SPAWN_CORE=false, skipping server spawn");
                // Manage an empty server process for consistency
                app.manage(Arc::new(Mutex::new(None::<Child>)));
            }

            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Gracefully shut down server
                if let Ok(mut server) = window.state::<Arc<Mutex<Option<Child>>>>().lock() {
                    if let Some(mut child) = server.take() {
                        let _ = child.kill();
                        println!("🛑 Server process terminated");
                    }
                }
            }
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("❌ Error while running Tauri application");
}

fn spawn_server(app: &tauri::App) -> Result<Arc<Mutex<Option<Child>>>, Box<dyn std::error::Error>> {
    let server_process = Arc::new(Mutex::new(None));

    // Resolve server binary inside the packaged bundle
    let server_path = app.path().resolve("bin/server", tauri::path::BaseDirectory::Resource)?;
    println!("🚀 Launching Bun server at {:?}", server_path);

    // Create log file for packaged app (macOS hides stdout)
    let log_dir = app.path().app_log_dir().unwrap_or_else(|_| app.path().app_data_dir().unwrap());
    create_dir_all(&log_dir)?;
    let log_file_path = log_dir.join("server.log");

    let mut log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)?;

    match Command::new(&server_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn() 
    {
        Ok(mut child) => {
            println!("✅ Server started with PID: {} at path: {:?}", child.id(), server_path);
            writeln!(log_file, "Server started with PID: {} at {:?}", child.id(), server_path)?;

            // Pipe stdout
            if let Some(stdout) = child.stdout.take() {
                let mut log_file_clone = log_file.try_clone()?;
                thread::spawn(move || {
                    let reader = BufReader::new(stdout);
                    for line in reader.lines() {
                        if let Ok(line) = line {
                            println!("[SERVER STDOUT] {}", line);
                            let _ = writeln!(log_file_clone, "[SERVER STDOUT] {}", line);
                        }
                    }
                });
            }

            // Pipe stderr
            if let Some(stderr) = child.stderr.take() {
                let mut log_file_clone = log_file.try_clone()?;
                thread::spawn(move || {
                    let reader = BufReader::new(stderr);
                    for line in reader.lines() {
                        if let Ok(line) = line {
                            eprintln!("[SERVER STDERR] {}", line);
                            let _ = writeln!(log_file_clone, "[SERVER STDERR] {}", line);
                        }
                    }
                });
            }

            *server_process.lock().unwrap() = Some(child);
        }
        Err(e) => {
            eprintln!("❌ Failed to start server at {:?}: {}", server_path, e);
            writeln!(log_file, "❌ Failed to start server: {}", e)?;
            return Err(Box::new(e));
        }
    }

    println!("📜 Server logs at {:?}", log_file_path);
    Ok(server_process)
}
