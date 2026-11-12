import json
import multiprocessing
import os
import socket
import struct
import sys
import threading
import time
import base64
import tempfile

import numpy as np


# ============================================================
# Paths
# ============================================================

ROOT = os.path.dirname(
    os.path.abspath(__file__)
)

sys.path.insert(0, ROOT)

sys.path.insert(
    0,
    os.path.join(
        ROOT,
        "third_party",
        "Matcha-TTS",
    ),
)

from cosyvoice.cli.cosyvoice import AutoModel


MODEL_PATH = os.path.join(
    ROOT,
    "pretrained_models",
    "Fun-CosyVoice3-0.5B",
)

REFERENCE_AUDIO = os.path.join(
    ROOT,
    "reference-short.wav",
)


# ============================================================
# Settings
# ============================================================

HOST = "0.0.0.0"
PORT = 8765

SPEAKER_ID = "my_voice"

TTS_PREFIX = (
    "You are a helpful assistant."
    "<|endofprompt|>"
)


# ============================================================
# Protocol
# ============================================================
#
# Client -> Server
#
#   uint32 little endian:
#       JSON byte length
#
#   UTF-8 JSON:
#       {"text": "..."}
#
#
# Server -> Client
#
# First:
#
#   uint32:
#       metadata JSON length
#
#   metadata JSON:
#       {
#           "sample_rate": 24000,
#           "channels": 1,
#           "format": "float32le"
#       }
#
# Then repeatedly:
#
#   uint32:
#       audio payload byte length
#
#   float32 little endian PCM
#
# End:
#
#   uint32 = 0
#
# ============================================================

UINT32 = struct.Struct("<I")


# ============================================================
# Runtime
# ============================================================

cosyvoice = None

tts_lock = threading.Lock()


# ============================================================
# Socket helpers
# ============================================================

def recv_exact(
    sock: socket.socket,
    size: int,
) -> bytes:

    data = bytearray()

    while len(data) < size:

        chunk = sock.recv(
            size - len(data)
        )

        if not chunk:

            raise ConnectionError(
                "Connection closed unexpectedly."
            )

        data.extend(chunk)

    return bytes(data)


def recv_packet(
    sock: socket.socket,
) -> bytes:

    header = recv_exact(
        sock,
        UINT32.size,
    )

    size = UINT32.unpack(
        header
    )[0]

    if size == 0:
        return b""

    return recv_exact(
        sock,
        size,
    )


def send_packet(
    sock: socket.socket,
    payload: bytes,
):

    header = UINT32.pack(
        len(payload)
    )

    sock.sendall(header)

    if payload:
        sock.sendall(payload)


# ============================================================
# TTS
# ============================================================

def run_tts(
    conn: socket.socket,
    text: str,
    speaker_id: str,
):

    print()
    print("=" * 60)
    print("TCP TTS REQUEST")
    print("=" * 60)
    print("Text:", text)

    # Metadata is sent immediately.
    metadata = {
        "sample_rate":
            cosyvoice.sample_rate,

        "channels": 1,

        "format":
            "float32le",
    }

    metadata_bytes = (
        json.dumps(
            metadata,
            ensure_ascii=False,
        )
        .encode("utf-8")
    )

    send_packet(
        conn,
        metadata_bytes,
    )

    with tts_lock:

        # Independent utterance:
        # reset streaming state.
        cosyvoice.model.token_hop_len = 25

        generation_start = (
            time.perf_counter()
        )

        first_chunk_time = None

        chunk_count = 0
        total_samples = 0

        results = (
            cosyvoice.inference_cross_lingual(
                TTS_PREFIX + text,
                "",
                zero_shot_spk_id=speaker_id,
                stream=True,
            )
        )

        for result in results:

            speech = result.get(
                "tts_speech"
            )

            if speech is None:
                continue

            audio = (
                speech
                .detach()
                .cpu()
                .numpy()
                .reshape(-1)
                .astype(
                    "<f4",
                    copy=False,
                )
            )

            if audio.size == 0:
                continue

            now = (
                time.perf_counter()
            )

            if first_chunk_time is None:

                first_chunk_time = now

                ttfa_ms = (
                    first_chunk_time
                    - generation_start
                ) * 1000.0

                print(
                    "First chunk: "
                    f"{ttfa_ms:.0f} ms"
                )

            chunk_count += 1

            total_samples += (
                audio.size
            )

            elapsed_ms = (
                now
                - generation_start
            ) * 1000.0

            duration = (
                audio.size
                / cosyvoice.sample_rate
            )

            print(
                f"Chunk #{chunk_count}: "
                f"{duration:.3f} s audio "
                f"@ {elapsed_ms:.0f} ms"
            )

            payload = (
                audio.tobytes()
            )

            # Send immediately.
            send_packet(
                conn,
                payload,
            )

    end = time.perf_counter()

    total_ms = (
        end
        - generation_start
    ) * 1000.0

    audio_duration = (
        total_samples
        / cosyvoice.sample_rate
    )

    print(
        f"Streaming complete: "
        f"{chunk_count} chunks"
    )

    print(
        f"Audio duration: "
        f"{audio_duration:.3f} s"
    )

    print(
        f"Generation total: "
        f"{total_ms:.0f} ms"
    )

    # End marker
    conn.sendall(
        UINT32.pack(0)
    )


# ============================================================
# Client handler
# ============================================================

def handle_client(
    conn: socket.socket,
    address,
):

    try:

        # Disable Nagle.
        conn.setsockopt(
            socket.IPPROTO_TCP,
            socket.TCP_NODELAY,
            1,
        )

        request_bytes = recv_packet(
            conn
        )

        if not request_bytes:

            return

        request_data = json.loads(
            request_bytes.decode(
                "utf-8"
            )
        )

        request_type = request_data.get("type", "tts")
        if request_type == "list_speakers":
            send_packet(conn, json.dumps({"speakers": cosyvoice.list_available_spks()}).encode("utf-8"))
            return

        if request_type == "register_speaker":
            speaker_id = str(request_data.get("speaker_id", "")).strip()
            audio_base64 = request_data.get("audio_base64", "")
            if not speaker_id or not isinstance(audio_base64, str):
                raise ValueError("speaker_id and audio_base64 are required")
            if speaker_id in cosyvoice.list_available_spks():
                send_packet(conn, json.dumps({"speaker_id": speaker_id, "cached": True}).encode("utf-8"))
                return
            audio = base64.b64decode(audio_base64, validate=True)
            if not audio or len(audio) > 10 * 1024 * 1024:
                raise ValueError("invalid audio payload")
            with tts_lock, tempfile.NamedTemporaryFile(suffix=".wav") as reference:
                reference.write(audio)
                reference.flush()
                cosyvoice.add_zero_shot_spk("", reference.name, speaker_id)
            send_packet(conn, json.dumps({"speaker_id": speaker_id, "cached": False}).encode("utf-8"))
            return

        if request_type == "delete_speaker":
            speaker_id = str(request_data.get("speaker_id", "")).strip()
            if speaker_id == SPEAKER_ID:
                raise ValueError("the default speaker cannot be deleted")
            with tts_lock:
                deleted = cosyvoice.frontend.spk2info.pop(speaker_id, None) is not None
            send_packet(conn, json.dumps({"speaker_id": speaker_id, "deleted": deleted}).encode("utf-8"))
            return

        text = str(
            request_data.get(
                "text",
                "",
            )
        ).strip()
        speaker_id = str(request_data.get("speaker_id", SPEAKER_ID)).strip() or SPEAKER_ID
        if speaker_id not in cosyvoice.list_available_spks():
            raise ValueError("speaker_id not found")

        if not text:

            error = {
                "error":
                    "text is required",
            }

            send_packet(
                conn,
                json.dumps(
                    error
                ).encode("utf-8"),
            )

            conn.sendall(
                UINT32.pack(0)
            )

            return

        run_tts(
            conn,
            text,
            speaker_id,
        )

    except Exception as e:

        print(
            "Client error:",
            repr(e),
        )

    finally:

        try:
            conn.shutdown(
                socket.SHUT_RDWR
            )
        except OSError:
            pass

        conn.close()


# ============================================================
# Model initialization
# ============================================================

def initialize_cosyvoice():

    global cosyvoice

    print()
    print("=" * 60)
    print("Loading CosyVoice3 + vLLM")
    print("=" * 60)

    print()
    print("Model:")
    print(MODEL_PATH)

    print()
    print("Reference:")
    print(REFERENCE_AUDIO)

    if not os.path.isdir(
        MODEL_PATH
    ):

        raise FileNotFoundError(
            "Model directory not found:\n"
            + MODEL_PATH
        )

    if not os.path.isfile(
        REFERENCE_AUDIO
    ):

        raise FileNotFoundError(
            "Reference audio not found:\n"
            + REFERENCE_AUDIO
        )

    start = time.perf_counter()

    cosyvoice = AutoModel(
        model_dir=MODEL_PATH,
        load_vllm=True,
        load_trt=False,
        fp16=False,
    )

    elapsed = (
        time.perf_counter()
        - start
    )

    print()
    print(
        "CosyVoice loaded in "
        f"{elapsed:.2f} s"
    )

    print(
        "Sample rate:",
        cosyvoice.sample_rate,
    )


# ============================================================
# Speaker cache
# ============================================================

def cache_speaker():

    print()
    print("=" * 60)
    print("Caching reference speaker")
    print("=" * 60)

    start = time.perf_counter()

    cosyvoice.add_zero_shot_spk(
        "",
        REFERENCE_AUDIO,
        SPEAKER_ID,
    )

    elapsed = (
        time.perf_counter()
        - start
    )

    print(
        "Speaker cached in "
        f"{elapsed:.2f} s"
    )


# ============================================================
# Warmup
# ============================================================

def warmup():

    print()
    print("=" * 60)
    print("TTS warmup")
    print("=" * 60)

    cosyvoice.model.token_hop_len = 25

    start = time.perf_counter()

    first_chunk_time = None
    chunks = 0
    samples = 0

    results = (
        cosyvoice.inference_cross_lingual(
            TTS_PREFIX + "안녕하세요",
            "",
            zero_shot_spk_id=SPEAKER_ID,
            stream=True,
        )
    )

    for result in results:

        speech = result.get(
            "tts_speech"
        )

        if speech is None:
            continue

        if first_chunk_time is None:

            first_chunk_time = (
                time.perf_counter()
            )

        chunks += 1

        samples += int(
            speech.shape[-1]
        )

    end = time.perf_counter()

    total_ms = (
        end - start
    ) * 1000.0

    audio_duration = (
        samples
        / cosyvoice.sample_rate
    )

    print(
        f"Warmup chunks: "
        f"{chunks}"
    )

    print(
        f"Warmup audio: "
        f"{audio_duration:.3f} s"
    )

    if first_chunk_time is not None:

        ttfa_ms = (
            first_chunk_time
            - start
        ) * 1000.0

        print(
            "Warmup TTFA: "
            f"{ttfa_ms:.0f} ms"
        )

    print(
        "Warmup total: "
        f"{total_ms:.0f} ms"
    )


# ============================================================
# TCP Server
# ============================================================

def serve():

    server = socket.socket(
        socket.AF_INET,
        socket.SOCK_STREAM,
    )

    server.setsockopt(
        socket.SOL_SOCKET,
        socket.SO_REUSEADDR,
        1,
    )

    server.bind(
        (
            HOST,
            PORT,
        )
    )

    server.listen(8)

    print()
    print("=" * 60)
    print("CosyVoice TCP Server READY")
    print("=" * 60)

    print()
    print(
        f"Listening on "
        f"{HOST}:{PORT}"
    )

    print()
    print(
        "Waiting for requests..."
    )

    try:

        while True:

            conn, address = (
                server.accept()
            )

            thread = threading.Thread(
                target=handle_client,
                args=(
                    conn,
                    address,
                ),
                daemon=True,
            )

            thread.start()

    finally:

        server.close()


# ============================================================
# Main
# ============================================================

def main():

    initialize_cosyvoice()

    cache_speaker()

    warmup()

    serve()


# ============================================================
# Entry Point
# ============================================================

if __name__ == "__main__":

    multiprocessing.freeze_support()

    main()
