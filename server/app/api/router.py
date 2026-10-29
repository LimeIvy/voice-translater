from fastapi import APIRouter
from app.api import health, translation, tts, stt

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(translation.router)
api_router.include_router(tts.router)
api_router.include_router(stt.router)