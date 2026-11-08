use cpal::{
    traits::{DeviceTrait, HostTrait, StreamTrait},
    SampleFormat,
};
use serde::Serialize;
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use whisper_rs::{
    FullParams,
    SamplingStrategy,
    WhisperContext,
    WhisperContextParameters,
};

#[derive(Default)]
pub struct RecorderState {
    recording: Mutex<Option<Recording>>,
}

struct Recording {
    _stream: cpal::Stream,
    samples: Arc<Mutex<Vec<f32>>>,
    sample_rate: u32,
    channels: u16,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordingResult {
    sample_count: usize,
    sample_rate: u32,
    channels: u16,
    duration_seconds: f32,
    transcript: String,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioInputDevice {
    id: String,
    name: String,
    is_default: bool,
}

#[tauri::command]
pub fn start_recording(
      state: tauri::State<'_, RecorderState>,
      device_id: Option<String>,
  ) -> Result<(), String> {
    let mut recording = state
        .recording
        .lock()
        .map_err(|error| error.to_string())?;

    if recording.is_some() {
        return Err("すでに録音中です".into());
    }

    let host = cpal::default_host();

    let device = match device_id {
      Some(selected_id) => {
          let parsed_id = selected_id
              .parse::<cpal::DeviceId>()
              .map_err(|error| {
                  format!("マイクIDが不正です: {error}")
              })?;

          host.device_by_id(&parsed_id)
              .filter(|device|
              device.supports_input())
              .ok_or_else(|| {
                  format!(
                      "選択されたマイクが見つかりません: {selected_id}"
                  )
              })?
      }

      None => host
          .default_input_device()
          .ok_or("使用できるマイクが見つかりません")?,
  };


    let supported_config = device
        .default_input_config()
        .map_err(|error| error.to_string())?;

    let sample_format =
    supported_config.sample_format();
    let config = supported_config.config();

    let sample_rate = config.sample_rate;
    let channels = config.channels;
    let samples = Arc::new(Mutex::new(Vec::new()));

    let stream = match sample_format {
        SampleFormat::F32 => {
            build_f32_stream(&device, &config,
            samples.clone())?
        }
        SampleFormat::I16 => {
            build_i16_stream(&device, &config,
            samples.clone())?
        }
        SampleFormat::U16 => {
            build_u16_stream(&device, &config,
            samples.clone())?
        }
        format => {
            return Err(format!(
                "未対応の音声形式です: {format}"
            ));
        }
    };

    stream.play().map_err(|error|
    error.to_string())?;

    *recording = Some(Recording {
        _stream: stream,
        samples,
        sample_rate,
        channels,
    });

    Ok(())
}

#[tauri::command]
pub fn stop_recording(
    state: tauri::State<'_, RecorderState>,
    language: String,
) -> Result<RecordingResult, String> {
    let recording = state
        .recording
        .lock()
        .map_err(|error| error.to_string())?
        .take()
        .ok_or("録音されていません")?;

    // Streamを停止してから音声データを取得する
    let Recording {
        _stream,
        samples,
        sample_rate,
        channels,
    } = recording;

    drop(_stream);

    let samples = Arc::try_unwrap(samples)
        .map_err(|_| "音声データを取得できませんでした")?
        .into_inner()
        .map_err(|error| error.to_string())?;

    let sample_count = samples.len();

    let duration_seconds =
        sample_count as f32
            / sample_rate as f32
            / channels as f32;

    if duration_seconds < 0.5 {
        return Err(
            "録音時間が短すぎます。1秒以上話してください"
            .into(),
        );
    }

    let mono = convert_to_mono(&samples,
    channels)?;
    let audio = resample_to_16khz(&mono,
    sample_rate);

    let transcript = transcribe(&audio, &language)?;

    Ok(RecordingResult {
        sample_count,
        sample_rate,
        channels,
        duration_seconds,
        transcript,
    })
}

#[tauri::command]
pub fn list_input_devices()
-> Result<Vec<AudioInputDevice>, String> {
    let host = cpal::default_host();

    let default_id = host
        .default_input_device()
        .and_then(|device| device.id().ok());

    let devices = host
        .input_devices()
        .map_err(|error| error.to_string())?
          .filter_map(|device| {
          let id = device.id().ok()?;
          let description = device.description().ok()?;

          let display_name = format_device_name(
              description.name(),
              description.manufacturer(),
              description.driver(),
          );

          Some(AudioInputDevice {
              id: id.to_string(),
              name: display_name,
              is_default: default_id.as_ref() ==
              Some(&id),
          })
        })
        .collect();

    Ok(devices)
}

fn format_device_name(
    device_name: &str,
    manufacturer: Option<&str>,
    driver: Option<&str>,
) -> String {
    let Some(provider) = manufacturer.or(driver) else {
        return device_name.to_string();
    };

    let provider = provider
        .replace("(R)", "")
        .replace('®', "");

    format!("{} ({device_name})", provider.trim())
}

fn build_f32_stream(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    samples: Arc<Mutex<Vec<f32>>>,
) -> Result<cpal::Stream, String> {
    device
        .build_input_stream(
            config,
            move |input: &[f32], _| {
                if let Ok(mut samples) =
                samples.lock() {

                    samples.extend_from_slice(input
                    );
                }
            },
            log_stream_error,
            None,
        )
        .map_err(|error| error.to_string())
}

fn build_i16_stream(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    samples: Arc<Mutex<Vec<f32>>>,
) -> Result<cpal::Stream, String> {
    device
        .build_input_stream(
            config,
            move |input: &[i16], _| {
                if let Ok(mut samples) =
                samples.lock() {
                    samples.extend(
                        input
                            .iter()
                            .map(|sample| {
                                *sample as f32 /
                                i16::MAX as f32
                            }),
                    );
                }
            },
            log_stream_error,
            None,
        )
        .map_err(|error| error.to_string())
}

fn build_u16_stream(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    samples: Arc<Mutex<Vec<f32>>>,
) -> Result<cpal::Stream, String> {
    device
        .build_input_stream(
            config,
            move |input: &[u16], _| {
                if let Ok(mut samples) =
                samples.lock() {
                    samples.extend(
                        input
                            .iter()
                            .map(|sample| {
                                (*sample as f32
                                    / u16::MAX as
                                    f32)
                                    * 2.0
                                    - 1.0
                            }),
                    );
                }
            },
            log_stream_error,
            None,
        )
        .map_err(|error| error.to_string())
}

fn log_stream_error(error: cpal::StreamError) {
    log::error!("マイク入力エラー: {error}");
}

const WHISPER_SAMPLE_RATE: u32 = 16_000;

fn convert_to_mono(
    samples: &[f32],
    channels: u16,
) -> Result<Vec<f32>, String> {
    if channels == 0 {
        return Err("チャンネル数が不正です".into());
    }

    if channels == 1 {
        return Ok(samples.to_vec());
    }

    let channel_count = channels as usize;

    let mono = samples
        .chunks_exact(channel_count)
        .map(|frame| {
            frame.iter().sum::<f32>() /
            channel_count as f32
        })
        .collect();

    Ok(mono)
}

fn resample_to_16khz(
    samples: &[f32],
    source_sample_rate: u32,
) -> Vec<f32> {
    if source_sample_rate == WHISPER_SAMPLE_RATE {
        return samples.to_vec();
    }

    if samples.is_empty() || source_sample_rate ==
    0 {
        return Vec::new();
    }

    let output_length = samples.len()
        * WHISPER_SAMPLE_RATE as usize
        / source_sample_rate as usize;

    let rate =
        source_sample_rate as f64
            / WHISPER_SAMPLE_RATE as f64;

    (0..output_length)
        .map(|index| {
            let source_position = index as f64 *
            rate;
            let left_index =
            source_position.floor() as usize;
            let right_index =
                (left_index + 1).min(samples.len()
                - 1);

            let fraction =
                (source_position - left_index as
                f64) as f32;

            let left = samples[left_index];
            let right = samples[right_index];

            left + (right - left) * fraction
        })
        .collect()
}

fn normalize_language_code(locale: &str) -> Result<String, String> {
    let language = locale
        .split(['-', '_'])
        .next()
        .unwrap_or_default()
        .to_ascii_lowercase();

    match language.as_str() {
        "zh" | "en" | "ja" | "ko" | "de" | "es" | "fr" | "it"
        | "ru" => Ok(language),
        _ => Err(format!("未対応の音声認識言語です: {locale}")),
    }
}

fn transcribe(audio: &[f32], locale: &str) -> Result<String,
String> {
    if audio.is_empty() {
        return Err("音声データが空です".into());
    }

    let model_path = PathBuf::from(
        env!("CARGO_MANIFEST_DIR"),
    )
    .join("models")
    .join("ggml-base.bin");

    if !model_path.is_file() {
        return Err(format!(
            "Whisperモデルが見つかりません: {}",
            model_path.display(),
        ));
    }

    let mut context_parameters =
        WhisperContextParameters::default();

    // 最初はCPUのみで動かす
    context_parameters.use_gpu(false);

    let context = WhisperContext::new_with_params(
        &model_path,
        context_parameters,
    )
    .map_err(|error| {
        format!("Whisperモデルの読み込みに失敗しました: {error}")
    })?;

    let mut state = context
        .create_state()
        .map_err(|error| {
            format!("Whisperの初期化に失敗しました: {error}")
        })?;

    let mut parameters = FullParams::new(
        SamplingStrategy::Greedy { best_of: 1 },
    );

    let language = normalize_language_code(locale)?;

    // 翻訳せず、話した言語のまま文字にする
    parameters.set_translate(false);

    // 日本語・英語などを自動判定する
    parameters.set_language(None);
    parameters.set_language(Some(&language));
    parameters.set_detect_language(false);

    parameters.set_n_threads(4);
    parameters.set_print_special(false);
    parameters.set_print_progress(false);
    parameters.set_print_realtime(false);
    parameters.set_print_timestamps(false);

    state
        .full(parameters, audio)
        .map_err(|error| {
            format!("文字起こしに失敗しました:{error}")
        })?;

    let segments = state
        .as_iter()
        .map(|segment| {
            segment
                .to_str_lossy()
                .map(|text| text.into_owned())
                .map_err(|error| error.to_string())
        })
        .collect::<Result<Vec<_>, _>>()?;

    Ok(segments.join("").trim().to_string())
}

#[cfg(test)]
mod tests {
    use super::{format_device_name, normalize_language_code};

    #[test]
    fn uses_driver_when_manufacturer_is_missing() {
        assert_eq!(
            format_device_name(
                "マイク配列",
                None,
                Some("Realtek(R) Audio"),
            ),
            "Realtek Audio (マイク配列)",
        );
    }

    #[test]
    fn falls_back_to_device_name_without_provider() {
        assert_eq!(
            format_device_name("マイク配列", None, None),
            "マイク配列",
        );
    }

    #[test]
    fn converts_locale_to_whisper_language() {
        assert_eq!(normalize_language_code("ja-JP").unwrap(), "ja");
        assert_eq!(normalize_language_code("en-US").unwrap(), "en");
        assert_eq!(normalize_language_code("zh-CN").unwrap(), "zh");
    }
}
