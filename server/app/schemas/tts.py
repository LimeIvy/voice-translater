from pydantic import BaseModel, Field


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000)
    speaker_id: str = Field(default="my_voice", min_length=1, max_length=128)
