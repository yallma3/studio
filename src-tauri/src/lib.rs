use std::fs::{create_dir_all, OpenOptions};
use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::Manager;
use uuid::Uuid;

struct SidecarState {
    yallma3_binding: String,
    bind_file_path: Option<PathBuf>,
}

#[allow(dead_code)]
#[tauri::command]
fn get_yallma3_binding(app: tauri::AppHandle) -> Result<String, String> {
    let state = app.state::<Arc<Mutex<SidecarState>>>();
    let state = state.lock().map_err(|e| e.to_string())?;

    println!("🔗 Yallma3 bind info: {}", state.yallma3_binding);
    Ok(state.yallma3_binding.clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_yallma3_binding])
        .setup(|app| {
            // Load .env file
            if let Err(e) = dotenvy::dotenv() {
                println!("⚠️ Could not load .env file: {}", e);
            }

            // Check environment variable to conditionally spawn yallma3
            let should_spawn_yallma3 = std::env::var("VITE_SPAWN_CORE")
                .unwrap_or_else(|_| "true".to_string())
                .parse::<bool>()
                .unwrap_or(true);

            println!("VITE_SPAWN_CORE = {}", should_spawn_yallma3);

            if should_spawn_yallma3 {
                println!("VITE_SPAWN_CORE=true, spawning yallma3...");
                let instance_id = Uuid::new_v4().to_string();
                let (yallma3_process, bind_path, yallma3_binding) =
                    yallma3_server(app, &instance_id)?;
                app.manage(Arc::new(Mutex::new(SidecarState {
                    yallma3_binding,
                    bind_file_path: Some(bind_path),
                })));
                app.manage(yallma3_process);
            } else {
                println!("VITE_SPAWN_CORE=false, skipping yallma3 spawn");
                // Manage an empty yallma3 process for consistency
                app.manage(Arc::new(Mutex::new(SidecarState {
                    yallma3_binding: String::new(),
                    bind_file_path: None,
                })));
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
                // Gracefully shut down yallma3
                if let Ok(mut yallma3) = window.state::<Arc<Mutex<Option<Child>>>>().lock() {
                    if let Some(mut child) = yallma3.take() {
                        let _ = child.kill();
                        println!("🛑 yallma3 process terminated");
                    }
                }
                // Clean up bind file
                if let Ok(state) = window.state::<Arc<Mutex<SidecarState>>>().try_lock() {
                    if let Some(bind_path) = &state.bind_file_path {
                        if bind_path.exists() {
                            if let Err(e) = std::fs::remove_file(bind_path) {
                                println!("⚠️ Failed to remove bind file: {}", e);
                            } else {
                                println!("🗑️ Bind file cleaned up: {:?}", bind_path);
                            }
                        }
                    }
                }
            }
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("❌ Error while running Tauri application");
}

fn yallma3_server(
    app: &tauri::App,
    instance_id: &str,
) -> Result<(Arc<Mutex<Option<Child>>>, PathBuf, String), Box<dyn std::error::Error>> {
    let yallma3_process = Arc::new(Mutex::new(None));

    // Determine yallma3 binary name based on OS
    let yallma3_binary = if cfg!(target_os = "windows") {
        "yallma3.exe"
    } else {
        "yallma3"
    };

    // Resolve yallma3 binary inside the packaged bundle
    let yallma3_path = app.path().resolve(
        format!("bin/{}", yallma3_binary),
        tauri::path::BaseDirectory::Resource,
    )?;
    println!("🚀 Launching Bun yallma3 at {:?}", yallma3_path);

    // Create log file for packaged app (macOS hides stdout)
    let log_dir = app
        .path()
        .app_log_dir()
        .unwrap_or_else(|_| app.path().app_data_dir().unwrap());
    create_dir_all(&log_dir)?;
    let log_file_path = log_dir.join("yallma3.log");

    // Bind file path in current working directory
    let cwd = std::env::current_dir()?;
    let bind_file_path = cwd.join(format!("yallma3-bind.{}", instance_id));

    let mut log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)?;

    println!("📜 Yallma3 logs at {:?}", log_file_path);
    println!("📄 Bind file will be at {:?}", bind_file_path);

    match Command::new(&yallma3_path)
        .arg(format!("--instance-id={}", instance_id))
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(mut child) => {
            println!(
                "✅ Yallma3 started with PID: {} at path: {:?}",
                child.id(),
                yallma3_path
            );
            writeln!(
                log_file,
                "Yallma3 started with PID: {} at {:?}",
                child.id(),
                yallma3_path
            )?;

            // Pipe stdout
            if let Some(stdout) = child.stdout.take() {
                let mut log_file_clone = log_file.try_clone()?;
                thread::spawn(move || {
                    let reader = BufReader::new(stdout);
                    for line in reader.lines() {
                        if let Ok(line) = line {
                            println!("[Yallma3 STDOUT] {}", line);
                            let _ = writeln!(log_file_clone, "[Yallma3 STDOUT] {}", line);
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
                            eprintln!("[Yallma3 STDERR] {}", line);
                            let _ = writeln!(log_file_clone, "[Yallma3 STDERR] {}", line);
                        }
                    }
                });
            }

            *yallma3_process.lock().unwrap() = Some(child);
        }
        Err(e) => {
            eprintln!("❌ Failed to start yallma3 at {:?}: {}", yallma3_path, e);
            writeln!(log_file, "❌ Failed to start yallma3: {}", e)?;
            return Err(Box::new(e));
        }
    }

    // Wait for bind file to be created and parse it
    println!("⏳ Waiting for bind file to be created...");
    let mut retries = 0;
    let max_retries = 50;
    let yallma3_binding = loop {
        if bind_file_path.exists() {
            println!("✅ Bind file found!");
            let content = std::fs::read_to_string(&bind_file_path)?;
            println!("📄 Bind file content:\n{}", content);
            let mut bind_info: serde_json::Value = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse bind file: {}", e))?;
            bind_info["instance-id"] = serde_json::Value::String(instance_id.to_string());
            break bind_info.to_string();
        }
        if retries >= max_retries {
            return Err("Timed out waiting for bind file to be created".into());
        }
        std::thread::sleep(std::time::Duration::from_millis(100));
        retries += 1;
    };

    println!("📜 Yallma3 logs at {:?}", log_file_path);
    Ok((yallma3_process, bind_file_path, yallma3_binding))
}
