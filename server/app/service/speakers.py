import base64
import json
import os
import socket
import struct


HEADER = struct.Struct("<I")


def _address() -> tuple[str, int]:
    host = os.getenv("TTS_HOST", "").strip()
    port = int(os.getenv("TTS_PORT", ""))
    if not host or not 1 <= port <= 65535:
        raise RuntimeError("TTS service is not configured")
    return host, port


def _call(payload: dict) -> dict:
    encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    with socket.create_connection(_address(), timeout=10) as sock:
        sock.sendall(HEADER.pack(len(encoded)) + encoded)
        header = _recv_exact(sock, HEADER.size)
        size = HEADER.unpack(header)[0]
        if size > 1024 * 1024:
            raise ValueError("TTS service response is too large")
        body = bytearray()
        while len(body) < size:
            chunk = sock.recv(size - len(body))
            if not chunk:
                raise ConnectionError("TTS service closed the connection")
            body.extend(chunk)
    response = json.loads(body.decode("utf-8"))
    if not isinstance(response, dict):
        raise ValueError("Invalid TTS service response")
    if response.get("error"):
        raise ValueError(str(response["error"]))
    return response


def _recv_exact(sock: socket.socket, size: int) -> bytes:
    data = bytearray()
    while len(data) < size:
        chunk = sock.recv(size - len(data))
        if not chunk:
            raise ConnectionError("TTS service closed the connection")
        data.extend(chunk)
    return bytes(data)


def list_speakers() -> list[str]:
    return _call({"type": "list_speakers"}).get("speakers", [])


def register_speaker(speaker_id: str, audio: bytes) -> dict:
    return _call({
        "type": "register_speaker",
        "speaker_id": speaker_id,
        "audio_base64": base64.b64encode(audio).decode("ascii"),
    })


def delete_speaker(speaker_id: str) -> dict:
    return _call({"type": "delete_speaker", "speaker_id": speaker_id})
