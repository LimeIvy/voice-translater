from fastapi import APIRouter
from app.api import health, translation, tts

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(translation.router)
api_router.include_router(tts.router)
