import os
import ssl
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# Create SSL context that works in restricted environments
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

app = FastAPI(title="Fastino API Test Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PIONEER_API_KEY = os.getenv("PIONEER_API_KEY", "")
FASTINO_BASE_URL = "https://api.fastino.ai"

# Request Models
class RegisterUserRequest(BaseModel):
    email: str
    name: Optional[str] = None
    timezone: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Dict] = []
    user_id: str

class ChunksRequest(BaseModel):
    user_id: str
    history: List[Dict] = []
    k: int = 5
    similarity_threshold: float = 0.25

class IngestRequest(BaseModel):
    user_id: str
    message_history: List[Dict]

class QueryRequest(BaseModel):
    user_id: str
    query: str

def get_headers():
    return {
        "x-api-key": PIONEER_API_KEY,
        "Content-Type": "application/json"
    }

@app.get("/")
async def root():
    return {
        "service": "Fastino API Test Server",
        "endpoints": [
            "POST /register - Register a new user",
            "GET /summary?user_id=email - Get user summary",
            "POST /chat - Send a chat message",
            "POST /chunks - Get relevant context chunks",
            "POST /ingest - Ingest conversation data",
            "POST /query - Query user knowledge",
            "GET /health - Health check"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "api_key_configured": bool(PIONEER_API_KEY)}

@app.post("/register")
async def register_user(request: RegisterUserRequest):
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{FASTINO_BASE_URL}/register",
                headers=get_headers(),
                json={
                    "email": request.email,
                    "name": request.name or request.email.split("@")[0],
                    "timezone": request.timezone or "UTC",
                    "purpose": "Testing Fastino API features"
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/summary")
async def get_summary(user_id: str, max_chars: int = 500):
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(
                f"{FASTINO_BASE_URL}/summary",
                headers=get_headers(),
                params={"user_id": user_id, "max_chars": max_chars},
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    async with httpx.AsyncClient(verify=False) as client:
        try:
            # Get relevant chunks
            chunks_response = await client.post(
                f"{FASTINO_BASE_URL}/chunks",
                headers=get_headers(),
                json={
                    "user_id": request.user_id,
                    "history": request.conversation_history + [{"role": "user", "content": request.message}],
                    "k": 5,
                    "similarity_threshold": 0.25
                },
                timeout=30.0
            )
            chunks_data = chunks_response.json() if chunks_response.status_code == 200 else {}

            # Get user summary
            summary_response = await client.get(
                f"{FASTINO_BASE_URL}/summary",
                headers=get_headers(),
                params={"user_id": request.user_id, "max_chars": 500},
                timeout=30.0
            )
            summary_data = summary_response.json() if summary_response.status_code == 200 else {}

            return {
                "user_id": request.user_id,
                "message": request.message,
                "relevant_chunks": chunks_data,
                "user_summary": summary_data,
                "note": "This endpoint returns context data. For full chat with LLM, integrate with OpenAI."
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/chunks")
async def get_chunks(request: ChunksRequest):
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{FASTINO_BASE_URL}/chunks",
                headers=get_headers(),
                json={
                    "user_id": request.user_id,
                    "history": request.history,
                    "k": request.k,
                    "similarity_threshold": request.similarity_threshold
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/ingest")
async def ingest_data(request: IngestRequest):
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{FASTINO_BASE_URL}/ingest",
                headers=get_headers(),
                json={
                    "user_id": request.user_id,
                    "message_history": request.message_history
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_knowledge(request: QueryRequest):
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.post(
                f"{FASTINO_BASE_URL}/query",
                headers=get_headers(),
                json={
                    "user_id": request.user_id,
                    "query": request.query
                },
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
