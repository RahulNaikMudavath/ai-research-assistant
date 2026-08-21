import numpy as np
import json
import os

dimension = 3072

VECTORS_FILE = "vectors.json"
METADATA_FILE = "metadata.json"

class NumpyVectorIndex:
    def __init__(self, dimension):
        self.dimension = dimension
        self.vectors = []
        
    @property
    def ntotal(self):
        return len(self.vectors)
        
    def add(self, vector):
        if isinstance(vector, np.ndarray):
            for v in vector:
                self.vectors.append(v.tolist())
        else:
            self.vectors.extend(vector)

# Create index instance
index = NumpyVectorIndex(dimension)
chunk_metadata = []


def add_embedding(embedding, metadata):
    global index
    index.add([embedding])
    chunk_metadata.append(metadata)


def search_vectors(embedding, k=5):
    if not index.vectors:
        return []

    # Convert vectors and query to numpy arrays
    query_vec = np.array(embedding, dtype="float32")
    stored_vecs = np.array(index.vectors, dtype="float32")

    # Compute cosine similarity
    dot_products = np.dot(stored_vecs, query_vec)
    query_norm = np.linalg.norm(query_vec)
    stored_norms = np.linalg.norm(stored_vecs, axis=1)

    norms = query_norm * stored_norms
    norms[norms == 0] = 1e-10

    cosine_similarities = dot_products / norms

    # Sort indices by similarity in descending order
    sorted_indices = np.argsort(cosine_similarities)[::-1]

    results = []
    seen = set()

    for idx in sorted_indices:
        if idx < 0 or idx >= len(chunk_metadata):
            continue
        if idx not in seen:
            metadata = chunk_metadata[idx].copy()
            score = float(max(0.0, min(1.0, cosine_similarities[idx])))
            # Map similarity back to a distance value (2 - 2 * similarity)
            distance = float(2.0 - 2.0 * score)
            metadata["score"] = score
            metadata["distance"] = distance
            results.append(metadata)
            seen.add(idx)

            if len(results) >= k:
                break

    return results


def save_index():
    with open(VECTORS_FILE, "w", encoding="utf-8") as f:
        json.dump(index.vectors, f)

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(chunk_metadata, f, indent=4)

    print("[SUCCESS] Numpy index saved.")


def load_index():
    global chunk_metadata

    if os.path.exists(VECTORS_FILE):
        with open(VECTORS_FILE, "r", encoding="utf-8") as f:
            index.vectors = json.load(f)
        print(f"[SUCCESS] Numpy index loaded with {index.ntotal} vectors.")
    else:
        index.vectors = []
        print("[INFO] No Numpy index found. Starting fresh.")

    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            chunk_metadata = json.load(f)
        print(f"[SUCCESS] Loaded {len(chunk_metadata)} metadata records.")
    else:
        chunk_metadata = []
        print("[INFO] No metadata found.")