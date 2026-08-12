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

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)


def generate_answer(
    question,
    context
):

    prompt = f"""
You are an AI Research Assistant.

Answer ONLY using the provided context.

Format the answer clearly using:
- Headings
- Bullet points
- Numbered lists

If the answer contains multiple items,
group them logically.

Context:
{context}

Question:
{question}
"""

    response = model.generate_content(
        prompt
    )

    return response.text