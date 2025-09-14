use std::process::Child;
use std::sync::Mutex;
use tauri::State;
use tauri::Manager;

pub struct SidecarState {
    pub process: Mutex<Option<Child>>,
}

impl SidecarState {
    pub fn new() -> Self {
        println!("Initializing SidecarState...");
        Self {
            process: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub async fn spawn_yallma3api(
    state: State<'_, SidecarState>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let mut process_guard = state.process.lock().unwrap();

    if process_guard.is_some() {
        return Ok("yaLLMa3API is already running".to_string());
    }

    // Get the path to the yaLLMa3API executable
    let executable_path = if cfg!(debug_assertions) {
        // In development, use node with the script
        std::env::current_dir()
            .map_err(|e| format!("Failed to get current directory: {}", e))?
            .parent()
            .unwrap_or(&std::env::current_dir().unwrap())
            .join("yaLLMa3API")
            .join("index.js")
    } else {
        // In production, find the bundled executable in resources
        let resource_dir = app_handle
            .path()
            .resource_dir()
            .map_err(|e| format!("Failed to get resource directory: {}", e))?;

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
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Spawn the process
    let child = if cfg!(debug_assertions) {
        // In development, spawn node with the script
        std::process::Command::new("node")
            .arg(&executable_path)
            .env("YA_API_LOG_DIR", app_data_dir.to_string_lossy().to_string())
            .spawn()
            .map_err(|e| format!("Failed to spawn yaLLMa3API: {}", e))?
    } else {
        // In production, spawn the bundled executable directly
        std::process::Command::new(&executable_path)
            .env("YA_API_LOG_DIR", app_data_dir.to_string_lossy().to_string())
            .spawn()
            .map_err(|e| format!("Failed to spawn yaLLMa3API: {}", e))?
    };

    *process_guard = Some(child);

    Ok("yaLLMa3API spawned successfully".to_string())
}

#[tauri::command]
pub async fn kill_yallma3api(state: State<'_, SidecarState>) -> Result<String, String> {
    let mut process_guard = state.process.lock().unwrap();

    if let Some(mut child) = process_guard.take() {
        child.kill().map_err(|e| format!("Failed to kill yaLLMa3API: {}", e))?;
        Ok("yaLLMa3API killed successfully".to_string())
    } else {
        Ok("yaLLMa3API is not running".to_string())
    }
}

#[tauri::command]
pub async fn get_yallma3api_status(state: State<'_, SidecarState>) -> Result<String, String> {
    let mut process_guard = state.process.lock().unwrap();

    if let Some(child) = &mut *process_guard {
        match child.try_wait() {
            Ok(Some(status)) => Ok(format!("yaLLMa3API exited with status: {}", status)),
            Ok(None) => Ok("yaLLMa3API is running".to_string()),
            Err(e) => Err(format!("Failed to check yaLLMa3API status: {}", e)),
        }
    } else {
        Ok("yaLLMa3API is not running".to_string())
    }
}