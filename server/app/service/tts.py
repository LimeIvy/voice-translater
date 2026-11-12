import io
import json
import math
import os
import socket
import struct
import threading
import wave
from array import array
import sys


HEADER = struct.Struct("<I")
generation_lock = threading.Lock()


def recv_exact(sock: socket.socket, size: int) -> bytes:
    data = bytearray()
    while len(data) < size:
        chunk = sock.recv(size - len(data))
        if not chunk:
            raise ValueError("TTSとの接続が音声の受信途中で切れました。")
        data.extend(chunk)
    return bytes(data)


def recv_packet(sock: socket.socket) -> bytes | None:
    size = HEADER.unpack(recv_exact(sock, HEADER.size))[0]
    if size == 0:
        return None
    if size > 8 * 1024 * 1024:
        raise ValueError("TTSのパケットが大きすぎます。")
    return recv_exact(sock, size)


def synthesize(text: str, speaker_id: str = "my_voice") -> bytes:
    host = os.getenv("TTS_HOST", "").strip()
    port_text = os.getenv("TTS_PORT", "").strip()
    if not host or not port_text:
        raise RuntimeError("TTS_HOSTとTTS_PORTを設定してください。")
    try:
        port = int(port_text)
    except ValueError as error:
        raise RuntimeError("TTS_PORTは1〜65535の整数で設定してください。") from error
    if not 1 <= port <= 65535:
        raise RuntimeError("TTS_PORTは1〜65535の整数で設定してください。")

    if not generation_lock.acquire(timeout=120):
        raise TimeoutError("TTSが使用中です。時間を置いて再試行してください。")
    try:
        with socket.create_connection((host, port), timeout=10) as sock:
            sock.settimeout(120)
            sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            request = json.dumps(
                {"text": text, "speaker_id": speaker_id},
                ensure_ascii=False,
            ).encode("utf-8")
            sock.sendall(HEADER.pack(len(request)) + request)

            packet = recv_packet(sock)
            if packet is None:
                raise ValueError("TTSからメタデータが返りませんでした。")
            metadata = json.loads(packet)
            if not isinstance(metadata, dict):
                raise ValueError("TTSのメタデータが不正です。")
            sample_rate = metadata.get("sample_rate")
            channels = metadata.get("channels")
            if (
                type(sample_rate) is not int or not 8000 <= sample_rate <= 192000
                or channels != 1 or metadata.get("format") != "float32le"
            ):
                raise ValueError("TTSの音声形式が不正です。float32le・モノラルが必要です。")

            pcm = array("h")
            received = 0
            while (packet := recv_packet(sock)) is not None:
                received += len(packet)
                if len(packet) % 4 or received > 64 * 1024 * 1024:
                    raise ValueError("TTSの音声データのサイズが不正です。")
                for (value,) in struct.iter_unpack("<f", packet):
                    if not math.isfinite(value):
                        raise ValueError("TTSの音声データに不正な値があります。")
                    pcm.append(round(max(-1.0, min(1.0, value)) * 32767))

        if not pcm:
            raise ValueError("TTSから音声が返りませんでした。")
        if sys.byteorder != "little":
            pcm.byteswap()
        output = io.BytesIO()
        with wave.open(output, "wb") as wav:
            wav.setnchannels(channels)
            wav.setsampwidth(2)
            wav.setframerate(sample_rate)
            wav.writeframes(pcm.tobytes())
        return output.getvalue()
    finally:
        generation_lock.release()
