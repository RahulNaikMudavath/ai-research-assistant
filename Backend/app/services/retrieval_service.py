from app.services.embedding_service import (
    create_embedding
)

from app.rag.vector_store import (
    search_vectors
)


def retrieve_relevant_chunks(
    question,
    k=5
):

    question_embedding = create_embedding(
        question
    )

    results = search_vectors(
        question_embedding,
        k
    )

    return results