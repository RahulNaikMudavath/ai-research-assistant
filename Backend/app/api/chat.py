from fastapi import APIRouter
from fastapi import Depends

from app.schemas.chat import ChatRequest
from app.models.user import User
from app.auth.dependencies import get_current_user

from app.services.retrieval_service import (
    retrieve_relevant_chunks
)

from app.services.llm_service import (
    generate_answer
)

router = APIRouter()


@router.post("/ask")
def ask_question(
    request: ChatRequest,
    current_user: User = Depends(get_current_user)
):

    chunks = retrieve_relevant_chunks(
        request.question,
        request.document_id,
        str(current_user.id)
    )

    context = "\n\n".join(
    [
        f"Source: {chunk['filename']}\n{chunk['chunk_text']}"
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
    "filename": item["filename"],
    "chunk_index": item["chunk_index"],
    "preview": item["chunk_text"][:200]
}

            for item in chunks
        ]
    }