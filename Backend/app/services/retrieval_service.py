from app.services.embedding_service import (
    create_embedding
)

from app.rag.vector_store import (
    search_vectors
)


def retrieve_relevant_chunks(
    question,
    document_id=None,
    k=5
):

    question_embedding = create_embedding(
        question
    )

    results = search_vectors(
        question_embedding,
        k=20
    )

    if document_id:

        results = [
            item
            for item in results
            if item["document_id"] == document_id
        ]

    return results[:k]