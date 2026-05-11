import os
from dotenv import load_dotenv
from agno.agent import Agent
from agno.models.groq import Groq
from agno.knowledge.knowledge import Knowledge
from agno.vectordb.mongodb import MongoDb
from agno.knowledge.embedder.fastembed import FastEmbedEmbedder
from agno.os import AgentOS

load_dotenv()

collection_name = "nuba-rag-index"

vector_db = MongoDb(
    collection_name=collection_name,
    db_url=os.environ["MONGODB_URI"],
    database="nuba_rag",
    embedder=FastEmbedEmbedder(),   # BAAI/bge-small-en-v1.5, 384 dims, no API key
    search_index_name="vector_index_1",
    distance_metric="cosine",
)

knowledge_base = Knowledge(vector_db=vector_db)

# Comment out after first run to avoid reloading the document
knowledge_base.add_content(
    url="https://phi-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"
)

agent = Agent(
    name="Nuba RAG Agent",
    model=Groq(
        id=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        api_key=os.environ["GROQ_API_KEY"],
    ),
    knowledge=knowledge_base,
)

agent_os = AgentOS(agents=[agent])
app = agent_os.get_app()

if __name__ == "__main__":
    agent_os.serve(app="rag_agent:app", reload=True)
