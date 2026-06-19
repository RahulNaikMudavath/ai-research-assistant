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
    Use ONLY the provided context to answer.

    Context:
    {context}

    Question:
    {question}

    Give a clear and structured answer.
    """

    response = model.generate_content(
        prompt
    )

    return response.text