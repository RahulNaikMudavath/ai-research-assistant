from app.services.embedding_service import (
    create_embedding
)

from app.rag.vector_store import (
    search_vectors
)
from app.rag import vector_store


def retrieve_relevant_chunks(
    question,
    document_id=None,
    user_id=None,
    k=5
):
    if vector_store.index.ntotal == 0:
        return []

    question_embedding = create_embedding(
        question
    )

    # If filtering by a specific document, search all vectors to guarantee we find its chunks.
    # Otherwise, search a default candidate pool (e.g., min of 20 or index.ntotal).
    search_k = vector_store.index.ntotal if document_id else min(20, vector_store.index.ntotal)

    results = search_vectors(
        question_embedding,
        k=search_k
    )

    if user_id:

        results = [
            item
            for item in results
            if item.get("user_id") == user_id
        ]

    if document_id:

        results = [
            item
            for item in results
            if item["document_id"] == document_id
        ]

    return results[:k]