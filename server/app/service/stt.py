
import os
import threading

import numpy as np
from faster_whisper import WhisperModel

SAMPLE_RATE = 16000

_model: WhisperModel | None = None
_model_lock = threading.Lock()
_inference_lock = threading.Lock()


def get_model() -> WhisperModel:
    global _model

    if _model is None:
        with _model_lock:
            if _model is None:
                _model = WhisperModel(
                    os.getenv("WHISPER_MODEL", "medium"),
                    device=os.getenv("WHISPER_DEVICE", "cuda"),
                    compute_type=os.getenv(
                        "WHISPER_COMPUTE_TYPE",
                        "int8_float16",
                    ),
                )

    return _model


def transcribe_pcm(
    audio_bytes: bytes,
    language: str = "ja",
) -> str:
    """
    入力:
      16kHz / mono / float32 little-endian PCM
    """

    if len(audio_bytes) % 4 != 0:
        raise ValueError("Invalid PCM byte length")

    audio = np.frombuffer(
        audio_bytes,
        dtype="<f4",
    ).copy()

    if not np.isfinite(audio).all():
        raise ValueError("Invalid PCM samples")

    audio = np.clip(audio, -1.0, 1.0)

    with _inference_lock:
        segments, _ = get_model().transcribe(
            audio,
            language=language,
            beam_size=5,
            vad_filter=True,
            condition_on_previous_text=False,
        )

        return "".join(
            segment.text for segment in segments
        ).strip()
