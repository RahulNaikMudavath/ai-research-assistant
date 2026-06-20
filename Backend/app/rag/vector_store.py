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
    seen = set()

    for idx in indices[0]:

        if (
            idx >= 0
            and idx < len(chunk_metadata)
            and idx not in seen
        ):

            results.append(
                chunk_metadata[idx]
            )

            seen.add(idx)

        else:

            print(
                f"WARNING: Invalid FAISS index {idx}. "
                f"Metadata size = {len(chunk_metadata)}"
            )

    return results