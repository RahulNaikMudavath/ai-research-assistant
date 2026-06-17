from fastapi import APIRouter

from app.services.retrieval_service import (
    retrieve_relevant_chunks
)

router = APIRouter()


@router.get("/test-search")
def test_search(
    question: str
):

    results = retrieve_relevant_chunks(
        question
    )

    return {
        "results": results
    }