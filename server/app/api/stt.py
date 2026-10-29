
import asyncio
import json
import logging

import numpy as np

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.service.stt import SAMPLE_RATE, transcribe_pcm

router = APIRouter()
logger = logging.getLogger(__name__)

MAX_AUDIO_BYTES = SAMPLE_RATE * 4 * 30
MIN_AUDIO_BYTES = SAMPLE_RATE * 4 // 10

ALLOWED_LANGUAGES = {
    "ja", "ko", "en", "zh", "fr", "de", "es",
}


@router.websocket("/ws/stt")
async def websocket_stt(ws: WebSocket):
    await ws.accept()

    chunks: list[bytes] = []
    language: str | None = None
    total_bytes = 0

    try:
        while True:
            message = await ws.receive()

            if message["type"] == "websocket.disconnect":
                break

            text = message.get("text")
            binary = message.get("bytes")

            if text is not None:
                try:
                    command = json.loads(text)
                except (ValueError, TypeError):
                    await ws.send_json({
                        "type": "error",
                        "message": "Invalid JSON",
                    })
                    continue

                if not isinstance(command, dict):
                    await ws.send_json({
                        "type": "error",
                        "message": "Invalid command",
                    })
                    continue

                if command.get("type") == "start":
                    requested = command.get("language")

                    if requested not in ALLOWED_LANGUAGES:
                        await ws.send_json({
                            "type": "error",
                            "message": "Unsupported language",
                        })
                        continue

                    language = requested
                    chunks = []
                    total_bytes = 0

                    await ws.send_json({"type": "ready"})

                elif command.get("type") == "end":
                    if language is None or total_bytes < MIN_AUDIO_BYTES:
                        await ws.send_json({
                            "type": "error",
                            "message": "No valid audio received",
                        })
                        continue

                    audio = b"".join(chunks)
                    current_language = language

                    language = None
                    chunks = []
                    total_bytes = 0

                    try:
                        result = await asyncio.to_thread(
                            transcribe_pcm,
                            audio,
                            current_language,
                        )

                        await ws.send_json({
                            "type": "transcript",
                            "text": result,
                            "final": True,
                        })

                    except (ValueError, RuntimeError, OSError):
                        logger.exception("STT failed")
                        await ws.send_json({
                            "type": "error",
                            "message": "STT failed",
                        })

                else:
                    await ws.send_json({
                        "type": "error",
                        "message": "Unknown command",
                    })

            elif binary is not None:
                if language is None:
                    await ws.send_json({
                        "type": "error",
                        "message": "Send start first",
                    })
                    continue

                if total_bytes + len(binary) > MAX_AUDIO_BYTES:
                    chunks = []
                    language = None
                    total_bytes = 0

                    await ws.send_json({
                        "type": "error",
                        "message": "Audio exceeds 30 seconds",
                    })
                    continue

                chunks.append(binary)
                total_bytes += len(binary)

    except WebSocketDisconnect:
        pass
