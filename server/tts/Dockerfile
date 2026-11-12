FROM nvidia/cuda:12.8.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/app:/app/third_party/Matcha-TTS

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    ca-certificates libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN python3 -m pip install --upgrade pip wheel \
    && python3 -m pip install setuptools==80.9.0

COPY requirements-tts.lock /tmp/requirements-tts.lock

RUN python3 -m pip install \
    torch==2.8.0 torchaudio==2.8.0 \
    --index-url https://download.pytorch.org/whl/cu128

RUN python3 -m pip install -v \
    -r /tmp/requirements-tts.lock

COPY cosyvoice/ /app/cosyvoice/
COPY third_party/Matcha-TTS/ /app/third_party/Matcha-TTS/
COPY tts_server.py /app/tts_server.py

EXPOSE 8765

CMD ["python3", "-u", "/app/tts_server.py"]
