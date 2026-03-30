from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["ai"])

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"

# Reads OPENAI_API_KEY from environment automatically
# Swap this client for Anthropic when ready
client = OpenAI()
MODEL = "gpt-4o-mini"


def load_csv_summary(file_id: str) -> str:
    matches = list(UPLOADS_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="File not found")

    path = matches[0]
    sep = "\t" if path.suffix == ".tsv" else ","
    df = pd.read_csv(path, sep=sep, nrows=200)

    lines = [
        f"Rows: {len(df)}, Columns: {len(df.columns)}",
        f"Column names: {', '.join(df.columns.tolist())}",
        "",
        df.describe(include="all").to_string(),
    ]
    return "\n".join(lines)

@router.post("/report/{file_id}")
def generate_report(file_id: str):
    summary = load_csv_summary(file_id)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a data analyst. Given a CSV summary, write a concise "
                    "executive report with: key findings, anomalies, trends, and "
                    "actionable recommendations. Use plain English."
                ),
            },
            {"role": "user", "content": f"Dataset summary:\n\n{summary}"},
        ],
    )

    return {"report": response.choices[0].message.content}


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    file_id: str
    messages: list[ChatMessage]


@router.post("/chat")
def chat(req: ChatRequest):
    summary = load_csv_summary(req.file_id)

    system_prompt = (
        "You are a data analyst assistant. The user has uploaded a CSV dataset. "
        "Answer questions about the data clearly and concisely.\n\n"
        f"Dataset summary:\n{summary}"
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            *[{"role": m.role, "content": m.content} for m in req.messages],
        ],
    )

    return {"reply": response.choices[0].message.content}
