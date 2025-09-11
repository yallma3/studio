use std::process::{Child, Command};
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
    let sidecar_path = if cfg!(debug_assertions) {
        // In development, yaLLMa3API is in the project root (parent of src-tauri)
        std::env::current_dir()
            .map_err(|e| format!("Failed to get current directory: {}", e))?
            .parent()
            .unwrap_or(&std::env::current_dir().unwrap())
            .join("yaLLMa3API")
            .join("index.js")
    } else {
        // In production, try multiple possible locations
        let mut sidecar_path = None;

        // First, try the resource directory
        if let Ok(resource_path) = app_handle.path().resource_dir() {
            let resource_sidecar = resource_path.join("yaLLMa3API").join("index.js");
            println!("Checking resource path: {:?}", resource_sidecar);
            if resource_sidecar.exists() {
                println!("Found yaLLMa3API in resource directory");
                sidecar_path = Some(resource_sidecar);
            } else {
                println!("yaLLMa3API not found in resource directory");
            }
        }

        // If resource directory doesn't work, try AppImage path
        if sidecar_path.is_none() {
            let appimage_path = std::path::PathBuf::from("/usr/lib/yaLLMa3 Studio/_up_/yaLLMa3API/index.js");
            println!("Checking AppImage path: {:?}", appimage_path);
            if appimage_path.exists() {
                println!("Found yaLLMa3API in AppImage directory");
                sidecar_path = Some(appimage_path);
            } else {
                println!("yaLLMa3API not found in AppImage directory");
            }
        }

        // If still not found, try to get resource directory as fallback
        if sidecar_path.is_none() {
            if let Ok(resource_path) = app_handle.path().resource_dir() {
                sidecar_path = Some(resource_path.join("yaLLMa3API").join("index.js"));
            }
        }

        sidecar_path.ok_or_else(|| "Could not find yaLLMa3API/index.js in any expected location".to_string())?
    };
    println!("Starting yaLLMa3API from path: {:?}", sidecar_path);

    // Check if Node.js is available
    if let Err(_) = Command::new("node").arg("--version").output() {
        return Err("Node.js is not available in PATH".to_string());
    }

    // Get app data directory for logs
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    // Spawn the Node.js process with environment variables
    let child = Command::new("node")
        .arg(sidecar_path)
        .env("YA_API_LOG_DIR", app_data_dir.to_string_lossy().to_string())
        .spawn()
        .map_err(|e| format!("Failed to spawn yaLLMa3API: {}", e))?;

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