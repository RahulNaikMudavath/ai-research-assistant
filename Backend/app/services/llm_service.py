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

    usage = {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
        "estimated_cost": 0.0
    }

    if hasattr(response, "usage_metadata") and response.usage_metadata:
        p_tok = getattr(response.usage_metadata, "prompt_token_count", 0)
        c_tok = getattr(response.usage_metadata, "candidates_token_count", 0)
        t_tok = getattr(response.usage_metadata, "total_token_count", 0)
        
        # Cost Calculation for Gemini 2.5 Flash:
        # Input/Prompt: $0.30 per 1M tokens ($0.00000030 per token)
        # Output/Completion: $2.50 per 1M tokens ($0.00000250 per token)
        estimated_cost = (p_tok * 0.00000030) + (c_tok * 0.00000250)
        
        usage["prompt_tokens"] = p_tok
        usage["completion_tokens"] = c_tok
        usage["total_tokens"] = t_tok
        usage["estimated_cost"] = round(estimated_cost, 6)

    return {
        "text": response.text,
        "usage": usage
    }