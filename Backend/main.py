from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.document import router as document_router
from app.api.chat import router as chat_router

app = FastAPI(
    title="AI Research Assistant"
)

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

app.include_router(
    document_router,
    prefix="/documents",
    tags=["Documents"]
)

app.include_router(
    chat_router,
    prefix="/chat",
    tags=["Chat"]
)

@app.get("/")
def home():
    return {
        "message":
        "AI Research Assistant API Running"
    }