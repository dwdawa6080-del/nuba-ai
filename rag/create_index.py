"""
Create the MongoDB Atlas Vector Search index on the rag_documents collection.
Run once after the cluster is active:

    cd nuba-ai
    pip install -r rag/requirements.txt
    python rag/create_index.py
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.operations import SearchIndexModel

load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

MONGODB_URI = os.environ["MONGODB_URI"]
DB_NAME     = "nuba-ai"
COLLECTION  = "rag_documents"
INDEX_NAME  = "vector_index"

client     = MongoClient(MONGODB_URI)
collection = client[DB_NAME][COLLECTION]

# Check whether the index already exists
existing = list(collection.list_search_indexes())
if any(idx.get("name") == INDEX_NAME for idx in existing):
    print(f"Index '{INDEX_NAME}' already exists — nothing to do.")
    client.close()
    raise SystemExit(0)

model = SearchIndexModel(
    definition={
        "fields": [
            {
                "type":          "vector",
                "path":          "embedding",
                "numDimensions": 384,
                "similarity":    "cosine",
            }
        ]
    },
    name=INDEX_NAME,
    type="vectorSearch",
)

result = collection.create_search_index(model=model)
print(f"Vector Search index creation initiated: {result}")
print("Atlas typically takes 1–2 minutes to build the index.")
print("Check status: Atlas UI → Browse Collections → rag_documents → Search Indexes")

client.close()
