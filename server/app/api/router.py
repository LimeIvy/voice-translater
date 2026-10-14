from fastapi import APIRouter
from app.api import health, translation

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(translation.router)
