from dotenv import load_dotenv
from fastapi import FastAPI
from app.api.router import api_router
from fastapi.middleware.cors import CORSMiddleware
import os

load_dotenv()

app = FastAPI()

allowed_origins = ["http://localhost:5173"]
public_url = os.getenv("PUBLIC_URL", "").strip().rstrip("/")
if public_url:
    allowed_origins.append(public_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    api_router,
    prefix="/api/v1",
)
