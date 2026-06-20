from fastapi import APIRouter

from app.schemas.chat import ChatRequest

from app.services.retrieval_service import (
    retrieve_relevant_chunks
)

from app.services.llm_service import (
    generate_answer
)

router = APIRouter()


@router.post("/ask")
def ask_question(
    request: ChatRequest
):

    chunks = retrieve_relevant_chunks(
        request.question
    )

    context = "\n\n".join(
        [
            chunk["chunk_text"]
            for chunk in chunks
        ]
    )

    answer = generate_answer(
        request.question,
        context
    )

    return {
        "question": request.question,
        "answer": answer,
        "sources": [
            {
                "chunk_index": item["chunk_index"],
                "preview": item["chunk_text"][:200]
            }
            for item in chunks
        ]
    }