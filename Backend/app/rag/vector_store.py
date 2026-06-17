import faiss
import numpy as np

dimension = 384

index = faiss.IndexFlatL2(
    dimension
)

chunk_metadata = []


def add_embedding(
    embedding,
    metadata
):

    vector = np.array(
        [embedding],
        dtype="float32"
    )

    index.add(vector)

    chunk_metadata.append(
        metadata
    )


def search_vectors(
    embedding,
    k=5
):

    vector = np.array(
        [embedding],
        dtype="float32"
    )

    distances, indices = index.search(
        vector,
        k
    )

    results = []

    for idx in indices[0]:

        if idx < len(chunk_metadata):

            results.append(
                chunk_metadata[idx]
            )

    return results