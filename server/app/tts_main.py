"""TTS-only entry point for the local Compose deployment."""

import os
import socket

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, speakers, tts

load_dotenv()

app = FastAPI(title="Voice Translator TTS")
origins = [
    "http://localhost:5173",
    "tauri://localhost",
    "http://tauri.localhost",
    "https://tauri.localhost",
]
origins.extend(
    value.strip().rstrip("/")
    for value in os.getenv("TTS_CORS_ORIGINS", "").split(",")
    if value.strip()
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(health.router, prefix="/api/v1")
app.include_router(tts.router, prefix="/api/v1")
app.include_router(speakers.router, prefix="/api/v1")


@app.get("/api/v1/ready")
def ready():
    # The worker starts listening only after loading and warmup have completed.
    # This checks reachability, not inference quality or available queue capacity.
    try:
        host = os.getenv("TTS_HOST", "").strip()
        port = int(os.getenv("TTS_PORT", ""))
        if not host or not 1 <= port <= 65535:
            raise ValueError("Invalid TTS address")
        with socket.create_connection((host, port), timeout=2) as sock:
            # A zero-length frame closes the session without requesting synthesis.
            sock.sendall(bytes(4))
    except (OSError, ValueError):
        raise HTTPException(status_code=503, detail="TTS is not ready") from None
    return {"status": "ready"}
