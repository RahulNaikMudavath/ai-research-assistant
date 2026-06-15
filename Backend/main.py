from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.document import router as document_router

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

@app.get("/")
def home():
    return {
        "message":
        "AI Research Assistant API Running"
    }