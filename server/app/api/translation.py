from fastapi import APIRouter, HTTPException

from app.schemas.translation import TranslationRequest, TranslationResponse
from app.service.translation import TranslationService

router = APIRouter()
translation_service = TranslationService()


@router.post("/translation", response_model=TranslationResponse)
async def translate(request: TranslationRequest) -> TranslationResponse:
    if not request.text.strip():
        raise HTTPException(status_code=422, detail="翻訳する文章を入力")

    try:
        translated_text = await translation_service.translate(
            request.text,
            request.source_language,
            request.target_language,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return TranslationResponse(
        translations=[[request.text.strip(), translated_text]],
    )
