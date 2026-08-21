import faiss
import numpy as np
import json
import os

dimension = 384

INDEX_FILE = "faiss_index.bin"
METADATA_FILE = "metadata.json"

# Create empty index
index = faiss.IndexFlatL2(dimension)
chunk_metadata = []


def add_embedding(embedding, metadata):
    global index

    vector = np.array([embedding], dtype="float32")
    index.add(vector)
    chunk_metadata.append(metadata)


def search_vectors(embedding, k=5):
    vector = np.array([embedding], dtype="float32")

    distances, indices = index.search(vector, k)

    results = []
    seen = set()

    for idx, dist in zip(indices[0], distances[0]):

        if idx == -1:
            continue

        if idx < len(chunk_metadata) and idx not in seen:
            metadata = chunk_metadata[idx].copy()
            # Convert squared L2 distance to cosine similarity for normalized vectors
            score = max(0.0, min(1.0, 1.0 - (float(dist) / 2.0)))
            metadata["score"] = score
            metadata["distance"] = float(dist)
            results.append(metadata)
            seen.add(idx)

    return results


def save_index():
    faiss.write_index(index, INDEX_FILE)

    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(chunk_metadata, f, indent=4)

    print("[SUCCESS] FAISS index saved.")


def load_index():
    global index
    global chunk_metadata

    if os.path.exists(INDEX_FILE):
        index = faiss.read_index(INDEX_FILE)
        print("[SUCCESS] FAISS index loaded.")
    else:
        print("[INFO] No FAISS index found. Starting fresh.")

    if os.path.exists(METADATA_FILE):
        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            chunk_metadata = json.load(f)

        print(f"[SUCCESS] Loaded {len(chunk_metadata)} metadata records.")
    else:
        chunk_metadata = []
        print("[INFO] No metadata found.")