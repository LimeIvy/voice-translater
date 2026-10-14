from pydantic import BaseModel, Field


class TranslationRequest(BaseModel):
    text: str = Field(min_length=1)
    source_language: str = "ja-JP"
    target_language: str = "en-US"


class TranslationResponse(BaseModel):
    translations: list[list[str]]
