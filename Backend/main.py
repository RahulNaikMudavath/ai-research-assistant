from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.document import router as document_router
from app.api.chat import router as chat_router
from app.rag.vector_store import load_index

app = FastAPI(
    title="AI Research Assistant"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.on_event("startup")
def startup_event():
    load_index()

@app.get("/")
def home():
    return {
        "message":
        "AI Research Assistant API Running"
    }