import os
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(env_path)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is not set. Please add it to Backend/.env or your environment."
    )

genai.configure(
    api_key=api_key
)

def create_embedding(text):
    result = genai.embed_content(
        model="models/gemini-embedding-2",
        content=text
    )
    return result["embedding"]