"""
Nuba AI — RAG Agent

Embeddings : sentence-transformers (all-MiniLM-L6-v2, 384 dims)
Vector store: MongoDB Atlas Vector Search  (collection: rag_documents)
LLM         : Groq  llama-3.3-70b-versatile

Quick start
-----------
1. Create the Atlas Vector Search index (see vector_index.json) on the
   'rag_documents' collection in your cluster.
2. pip install -r requirements.txt
3. python rag_agent.py
"""

import os
import textwrap
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

# Load MONGODB_URI + GROQ_API_KEY from backend/.env
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

from groq import Groq                           # noqa: E402
from pymongo import MongoClient                 # noqa: E402
from sentence_transformers import SentenceTransformer  # noqa: E402

# ── Config ────────────────────────────────────────────────────────────────────

MONGODB_URI   = os.environ["MONGODB_URI"]
GROQ_API_KEY  = os.environ["GROQ_API_KEY"]
LLM_MODEL     = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

EMBED_MODEL   = "all-MiniLM-L6-v2"   # 384-dim, ~22 MB download on first run
DB_NAME       = "nuba-ai"
COLLECTION    = "rag_documents"
VECTOR_INDEX  = "vector_index"
EMBED_DIMS    = 384
TOP_K         = 5
CHUNK_SIZE    = 500
CHUNK_OVERLAP = 50

_SYSTEM_PROMPT = (
    "You are Nuba, a helpful AI assistant. "
    "Answer using only the provided context. "
    "If the context does not contain the answer, say so clearly."
)


# ── RAG Agent ─────────────────────────────────────────────────────────────────

class RAGAgent:
    """
    Three-stage pipeline:
      ingest()  — chunk → embed → store in MongoDB
      _retrieve() — embed query → $vectorSearch → top-K chunks
      chat()    — retrieved context + question → Groq LLM → answer
    """

    def __init__(self) -> None:
        self._embedder = SentenceTransformer(EMBED_MODEL)
        self._groq     = Groq(api_key=GROQ_API_KEY)
        self._col      = MongoClient(MONGODB_URI)[DB_NAME][COLLECTION]

    # ── Ingestion ─────────────────────────────────────────────────────────────

    def _chunk(self, text: str) -> List[str]:
        chunks, start = [], 0
        while start < len(text):
            chunk = text[start : start + CHUNK_SIZE].strip()
            if chunk:
                chunks.append(chunk)
            start += CHUNK_SIZE - CHUNK_OVERLAP
        return chunks

    def ingest(self, text: str, metadata: Optional[dict] = None) -> int:
        """Chunk text, embed each chunk, and upsert into MongoDB.
        Returns the number of chunks stored."""
        docs = [
            {
                "text":      chunk,
                "embedding": self._embedder.encode(chunk).tolist(),
                "metadata":  metadata or {},
            }
            for chunk in self._chunk(text)
        ]
        if not docs:
            return 0
        return len(self._col.insert_many(docs).inserted_ids)

    # ── Retrieval ─────────────────────────────────────────────────────────────

    def _retrieve(self, query: str, top_k: int = TOP_K) -> List[str]:
        """Run MongoDB Atlas $vectorSearch and return the top-k passage strings."""
        q_vec = self._embedder.encode(query).tolist()
        pipeline = [
            {
                "$vectorSearch": {
                    "index":         VECTOR_INDEX,
                    "path":          "embedding",
                    "queryVector":   q_vec,
                    "numCandidates": top_k * 10,
                    "limit":         top_k,
                }
            },
            {
                "$project": {
                    "_id":   0,
                    "text":  1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        return [doc["text"] for doc in self._col.aggregate(pipeline)]

    # ── Generation ────────────────────────────────────────────────────────────

    def chat(self, question: str, system_prompt: str = _SYSTEM_PROMPT) -> str:
        """Retrieve relevant context then generate an answer with Groq."""
        chunks  = self._retrieve(question)
        context = "\n\n---\n\n".join(chunks) if chunks else "No relevant context found."

        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role":    "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}",
            },
        ]

        resp = self._groq.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.1,
            max_tokens=1024,
        )
        return resp.choices[0].message.content

    # ── Index helper ──────────────────────────────────────────────────────────

    @staticmethod
    def index_definition() -> dict:
        """Atlas Vector Search index definition — see also vector_index.json."""
        return {
            "name": VECTOR_INDEX,
            "type": "vectorSearch",
            "definition": {
                "fields": [
                    {
                        "type":          "vector",
                        "path":          "embedding",
                        "numDimensions": EMBED_DIMS,
                        "similarity":    "cosine",
                    }
                ]
            },
        }


# ── CLI demo ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    agent = RAGAgent()

    sample = textwrap.dedent("""
        Nuba AI is a bilingual (Arabic-primary) web application providing
        accessibility services: text and audio translation across 8 languages,
        image description for the visually impaired using AI vision models,
        and a conversational AI chat assistant with an Arabic-first persona.
        The backend is Node.js/Express with MongoDB; the frontend is React/TypeScript.
        Authentication supports both email/password and Google OAuth. A multi-tenant
        system allows organisations to group users and manage access by role.
    """).strip()

    print("Ingesting sample document...")
    n = agent.ingest(sample, metadata={"source": "readme", "lang": "en"})
    print(f"Inserted {n} chunk(s).\n")

    question = "What accessibility services does Nuba AI provide?"
    print(f"Q: {question}")
    print(f"A: {agent.chat(question)}")
