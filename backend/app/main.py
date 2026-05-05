import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.routers import auth, users, patients, diagnoses, images, ai as ai_router, dashboard, reports, appointments
from app.ai.predictor import get_predictor
from app.routers.ai import set_predictor


@asynccontextmanager
async def lifespan(app: FastAPI):
    predictor = get_predictor()
    set_predictor(predictor)
    yield
    set_predictor(None)


app = FastAPI(
    title="Dermatologik Tashxis Axborot Tizimi",
    description="API for dermatological diagnosis management with AI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

for router_module in [auth, users, patients, diagnoses, images, ai_router, dashboard, reports, appointments]:
    app.include_router(router_module.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Dermatologik Tashxis API ishlamoqda", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
