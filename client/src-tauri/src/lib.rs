
mod model_manager;
mod recorder;

use std::sync::Mutex;

use tauri::{Manager, State};
use tauri_plugin_shell::{
    process::CommandChild,
    ShellExt,
};

struct ServerState {
    child: Mutex<Option<CommandChild>>,
}

#[tauri::command]
fn start_server(
    app: tauri::AppHandle,
    state: State<'_, ServerState>,
    model_id: String,
) -> Result<(), String> {
    let mut server = state
        .child
        .lock()
        .map_err(|e| e.to_string())?;

    if server.is_some() {
        return Err(
            "サーバーは起動済みです。切り替える場合は先に停止してください"
                .into(),
        );
    }

    let (gguf, template) =
        model_manager::model_files(&app, &model_id)?;

    if !gguf.is_file() || !template.is_file() {
        return Err(
            "モデルが未ダウンロードです".into()
        );
    }

    let gguf_path = gguf.to_string_lossy().into_owned();
    let template_path = template.to_string_lossy().into_owned();

    let dll_dir = app
    .path()
    .resolve(
        "binaries",
        tauri::path::BaseDirectory::Resource,
    )
    .map_err(|e| e.to_string())?;

    let current_path = std::env::var_os("PATH").unwrap_or_default();

    let mut paths = vec![dll_dir];

    paths.extend(std::env::split_paths(&current_path));

    let new_path = std::env::join_paths(paths)
        .map_err(|e| e.to_string())?;

    let command = app
        .shell()
        .sidecar("llama-server")
        .map_err(|e| e.to_string())?
        .env("PATH", new_path.to_string_lossy().as_ref())
        .args([
            "serve",
            "-m",
            &gguf_path,
            "--chat-template-file",
            &template_path,
            "--no-prefill-assistant",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--alias",
            "plamo-3-translate",
            "-c",
            "2048",
        ]);

    let (mut rx, child) = command
        .spawn()
        .map_err(|e| format!("起動失敗: {e}"))?;

    *server = Some(child);

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            log::info!("llama-server: {:?}", event);
        }
    });

    model_manager::save_last_model(&app, &model_id)?;

    log::info!("翻訳モデル {} の起動を開始", model_id);

    Ok(())
}

#[tauri::command]
fn stop_server(
    state: State<'_, ServerState>,
) -> Result<(), String> {
    let mut server = state
        .child
        .lock()
        .map_err(|e| e.to_string())?;

    if let Some(child) = server.take() {
        child.kill().map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
fn get_last_model(
    app: tauri::AppHandle,
) -> Result<Option<String>, String> {
    model_manager::load_last_model(&app)
}

#[tauri::command]
async fn check_server_health() -> bool {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build();

    let Ok(client) = client else {
        return false;
    };

    let response = client
        .get("http://127.0.0.1:8080/health")
        .send()
        .await;

    match response {
        Ok(response) if response.status().is_success() => {
            let body = response.json::<serde_json::Value>().await;

            matches!(
                body,
                Ok(ref value)
                    if value["status"] == "ok"
            )
        }
        _ => false,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(ServerState {
            child: Mutex::new(None),
        })
        .manage(recorder::RecorderState::default())
        .invoke_handler(tauri::generate_handler![
            model_manager::list_models,
            model_manager::download_model,
            model_manager::delete_model,
            get_last_model,
            start_server,
            stop_server,
            check_server_health,
            recorder::list_input_devices,
            recorder::start_recording,
            recorder::stop_recording,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                let state = app.state::<ServerState>();

                if let Ok(mut server) = state.child.lock() {
                    if let Some(child) = server.take() {
                        let _ = child.kill();
                    }
                };
            }
        });
}
