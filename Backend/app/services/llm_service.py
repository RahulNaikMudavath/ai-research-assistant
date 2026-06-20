import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
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