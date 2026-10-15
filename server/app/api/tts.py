from fastapi import APIRouter, HTTPException, Response

from app.schemas.tts import TTSRequest
from app.service.tts import synthesize


router = APIRouter()


@router.post("/tts", response_class=Response)
def text_to_speech(request: TTSRequest) -> Response:
    if not request.text.strip():
        raise HTTPException(status_code=422, detail="読み上げる文章を入力してください。")

    try:
        audio = synthesize(request.text.strip())
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except TimeoutError as error:
        raise HTTPException(status_code=504, detail="TTSの応答がタイムアウトしました。") from error
    except (OSError, ValueError, TypeError, OverflowError) as error:
        raise HTTPException(status_code=502, detail="TTSの接続または音声生成に失敗しました。TTSのログを確認してください。") from error
    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"Content-Disposition": 'inline; filename="speech.wav"'},
    )
