
use futures_util::StreamExt;
use serde::Serialize;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, Manager};

const REPO: &str = "pfnet/plamo-3-translate-0.8b-GGUF";
const GGUF: &str = "plamo-3-translate-0.8b-Q4_K_M.gguf";
const TEMPLATE: &str = "chat_template.jinja";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub downloaded: bool,
    pub size_bytes: Option<u64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadProgress {
    model_id: String,
    downloaded_bytes: u64,
    total_bytes: Option<u64>,
}

pub fn model_dir(
    app: &AppHandle,
    model_id: &str,
) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?;

    Ok(base.join("models").join(model_id))
}

pub fn model_files(
    app: &AppHandle,
    model_id: &str,
) -> Result<(PathBuf, PathBuf), String> {
    if model_id != "plamo-0.8b" {
        return Err("未対応のモデルです".into());
    }

    let dir = model_dir(app, model_id)?;
    Ok((dir.join(GGUF), dir.join(TEMPLATE)))
}

#[tauri::command]
pub fn list_models(
    app: AppHandle,
) -> Result<Vec<ModelInfo>, String> {
    let (gguf, template) = model_files(&app, "plamo-0.8b")?;

    let downloaded = gguf.is_file() && template.is_file();

    let size_bytes = if gguf.is_file() {
        Some(
            std::fs::metadata(&gguf)
                .map_err(|e| e.to_string())?
                .len(),
        )
    } else {
        None
    };

    Ok(vec![ModelInfo {
        id: "plamo-0.8b".into(),
        name: "PLaMo 3 Translate 0.8B (Q4_K_M)".into(),
        downloaded,
        size_bytes,
    }])
}

async fn download_file(
    app: &AppHandle,
    client: &reqwest::Client,
    model_id: &str,
    url: &str,
    destination: &Path,
    report_progress: bool,
) -> Result<(), String> {
    use tokio::io::AsyncWriteExt;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;

    let total = response.content_length();
    let temp = destination.with_extension("part");

    let mut file = tokio::fs::File::create(&temp)
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = response.bytes_stream();
    let mut downloaded = 0u64;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;

        file.write_all(&chunk)
            .await
            .map_err(|e| e.to_string())?;

        downloaded += chunk.len() as u64;

        if report_progress {
            let _ = app.emit(
                "model-download-progress",
                DownloadProgress {
                    model_id: model_id.into(),
                    downloaded_bytes: downloaded,
                    total_bytes: total,
                },
            );
        }
    }

    file.flush().await.map_err(|e| e.to_string())?;
    drop(file);

    if downloaded == 0 || total.is_some_and(|n| n != downloaded) {
        return Err("ダウンロードが不完全です".into());
    }

    tokio::fs::rename(&temp, destination)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn download_model(
    app: AppHandle,
    model_id: String,
) -> Result<(), String> {
    let (gguf, template) = model_files(&app, &model_id)?;

    let dir = model_dir(&app, &model_id)?;

    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|e| e.to_string())?;

    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| e.to_string())?;

    if !gguf.is_file() {
        let url = format!(
            "https://huggingface.co/{REPO}/resolve/main/{GGUF}"
        );

        download_file(
            &app, &client, &model_id, &url, &gguf, true,
        ).await?;
    }

    if !template.is_file() {
        let url = format!(
            "https://huggingface.co/{REPO}/resolve/main/{TEMPLATE}"
        );

        download_file(
            &app, &client, &model_id, &url, &template, false,
        ).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn delete_model(
    app: AppHandle,
    model_id: String,
) -> Result<(), String> {
    let dir = model_dir(&app, &model_id)?;

    // 未対応IDの削除を防止
    model_files(&app, &model_id)?;

    if dir.exists() {
        tokio::fs::remove_dir_all(dir)
            .await
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

const LAST_MODEL_FILE: &str = "last_model.txt";

fn last_model_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| e.to_string())?;

    Ok(dir.join(LAST_MODEL_FILE))
}

pub fn save_last_model(
    app: &AppHandle,
    model_id: &str,
) -> Result<(), String> {
    // 対応しているモデルIDか確認
    model_files(app, model_id)?;

    let path = last_model_path(app)?;

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| e.to_string())?;
    }

    std::fs::write(path, model_id)
        .map_err(|e| e.to_string())
}

pub fn load_last_model(
    app: &AppHandle,
) -> Result<Option<String>, String> {
    let path = last_model_path(app)?;

    if !path.exists() {
        return Ok(None);
    }

    let model_id = std::fs::read_to_string(path)
        .map_err(|e| e.to_string())?;

    let model_id = model_id.trim().to_string();

    if model_files(app, &model_id).is_err() {
        return Ok(None);
    }

    Ok(Some(model_id))
}