import hashlib

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.service import speakers


router = APIRouter(prefix="/speakers", tags=["speakers"])
MAX_AUDIO_BYTES = 10 * 1024 * 1024


@router.get("")
def get_speakers():
    try:
        return {"data": speakers.list_speakers()}
    except (OSError, RuntimeError, ValueError, ConnectionError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_speaker(file: UploadFile = File(...)):
    if file.content_type not in {"audio/wav", "audio/x-wav", "audio/wave"}:
        raise HTTPException(status_code=415, detail="Only WAV audio is supported")
    audio = await file.read(MAX_AUDIO_BYTES + 1)
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file is too large")
    speaker_id = f"spk_{hashlib.sha256(audio).hexdigest()[:16]}"
    try:
        result = speakers.register_speaker(speaker_id, audio)
    except (OSError, RuntimeError, ValueError, ConnectionError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {"data": {"speaker_id": speaker_id, **result}}


@router.delete("/{speaker_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_speaker(speaker_id: str):
    if speaker_id == "my_voice":
        raise HTTPException(status_code=409, detail="The default speaker cannot be deleted")
    try:
        result = speakers.delete_speaker(speaker_id)
    except (OSError, RuntimeError, ValueError, ConnectionError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    if not result.get("deleted"):
        raise HTTPException(status_code=404, detail="Speaker not found")
