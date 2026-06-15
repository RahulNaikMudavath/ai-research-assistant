from fastapi import FastAPI

from app.api.auth import router as auth_router

app = FastAPI(
    title="AI Research Assistant"
)

app.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

@app.get("/")
def home():
    return {
        "message":
        "AI Research Assistant API Running"
    }