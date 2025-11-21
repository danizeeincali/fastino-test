# Fastino API Test Page

A simple test interface for exploring the Fastino Pioneer Personalization API.

## Features

- **Register User** - Create new user profiles with email, name, and timezone
- **Get Summary** - Retrieve personalized user summaries
- **Chat/Context** - Send messages and get relevant context chunks
- **Get Chunks** - Retrieve contextually relevant information
- **Ingest Data** - Submit conversation data for learning
- **Query Knowledge** - Ask questions about user preferences

## Setup

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your Pioneer API key
```

### 3. Run Backend

```bash
python backend/main.py
```

The backend will start at `http://localhost:8000`

### 4. Open Frontend

Open `frontend/index.html` in your browser, or serve it with:

```bash
python -m http.server 3000 --directory frontend
```

Then visit `http://localhost:3000`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/register` | POST | Register a new user |
| `/summary` | GET | Get user profile summary |
| `/chat` | POST | Send chat message and get context |
| `/chunks` | POST | Get relevant context chunks |
| `/ingest` | POST | Ingest conversation data |
| `/query` | POST | Query user knowledge |

## Getting an API Key

Get your Pioneer API key at [fastino.ai](https://fastino.ai)
