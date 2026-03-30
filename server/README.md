# DashHub API

FastAPI backend for DashHub

## Setup

```bash
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Configuration

Copy `.env` and fill in your values:

```
PORT=8000
ALLOWED_ORIGINS=["http://localhost:3000"]
MAX_UPLOAD_SIZE_MB=50
OPENAI_API_KEY=your-key-here
```

## Running

```bash
uvicorn main:app --reload --port 8000
```

Interactive docs available at `http://localhost:8000/docs`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/upload` | Upload a CSV or TSV file |
| `GET` | `/process/{file_id}` | Detect column types and sample values |
| `POST` | `/ai/report/{file_id}` | Generate an executive report |
| `POST` | `/ai/chat` | Q&A about the dataset |

### POST /upload

Accepts `.csv` or `.tsv` files up to `MAX_UPLOAD_SIZE_MB`. Returns a `file_id` used in subsequent requests.

```json
{
  "file_id": "abc123",
  "filename": "sales.csv",
  "saved_as": "abc123.csv",
  "size_bytes": 204800
}
```

### GET /process/{file_id}

Returns column names, inferred types (`text`, `number`, `date`, `boolean`), sample values, and null counts.

### POST /ai/report/{file_id}

Returns an AI-generated executive report based on the dataset.

### POST /ai/chat

```json
{
  "file_id": "abc123",
  "messages": [
    { "role": "user", "content": "Which region has the highest revenue?" }
  ]
}
```
