from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel

from routers.dashboard import get_dashboard

router = APIRouter(prefix="/ai", tags=["ai"])

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"

client = OpenAI()
MODEL = "gpt-4o-mini"


def build_context(file_id: str) -> str:
    matches = list(UPLOADS_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="File not found")

    path = matches[0]
    sep = "\t" if path.suffix == ".tsv" else ","
    df = pd.read_csv(path, sep=sep)

    dashboard = get_dashboard(file_id)

    lines = [
        f"File: {path.name}",
        f"Total rows: {len(df)} | Columns: {', '.join(df.columns.tolist())}",
        "",
        "=== KPIs ===",
    ]

    for col, stat in dashboard["kpis"].items():
        lines.append(f"  {col}: total={stat['sum']:,.2f}, avg={stat['mean']:,.2f}")

    if dashboard["time_series"]:
        lines.append("\n=== Monthly trend ===")
        for entry in dashboard["time_series"]:
            row = ", ".join(f"{k}={v}" for k, v in entry.items())
            lines.append(f"  {row}")

    if dashboard["breakdowns"]:
        lines.append("\n=== Breakdowns ===")
        for dim, rows in dashboard["breakdowns"].items():
            lines.append(f"  By {dim}:")
            for row in rows[:6]:
                row_str = ", ".join(f"{k}={v}" for k, v in row.items())
                lines.append(f"    {row_str}")

    lines.append("\n=== Sample rows (first 5) ===")
    lines.append(df.head(5).to_string(index=False))

    return "\n".join(lines)


@router.post("/insights/{file_id}")
def generate_insights(file_id: str):
    context = build_context(file_id)

    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a data analyst. Analyze the dataset statistics and return a JSON object with exactly two keys:\n"
                    "- \"insights\": array of 3-4 objects, each with:\n"
                    "    - \"id\": unique kebab-case slug\n"
                    "    - \"type\": one of \"anomaly\", \"insight\", or \"suggestion\"\n"
                    "    - \"title\": 5-8 word title\n"
                    "    - \"body\": 1-2 sentences with specific numbers from the data\n"
                    "    - \"action\": short button label (\"Investigate\", \"Explore\", \"Add chart\") or null\n"
                    "- \"quick_questions\": array of exactly 4 short questions a user would naturally ask about this data\n\n"
                    "Rules: at least one insight must be type \"anomaly\" if any drop or outlier exists. "
                    "Reference actual column names and values. Never invent numbers not present in the data."
                ),
            },
            {"role": "user", "content": f"Dataset statistics:\n\n{context}"},
        ],
    )

    import json
    return json.loads(response.choices[0].message.content)


SECTION_SCHEMA = (
    "Return a JSON object with a single key \"sections\", an array of section objects. "
    "Each section has:\n"
    "  - \"title\": section heading (string)\n"
    "  - \"type\": either \"paragraph\" or \"bullets\"\n"
    "  - \"content\": (if type is \"paragraph\") a 2-4 sentence prose block\n"
    "  - \"items\": (if type is \"bullets\") array of concise bullet strings — "
    "each bullet must include a specific number or metric from the data\n\n"
    "Do not use markdown formatting inside strings. No asterisks, no hashes. Plain text only."
)


@router.post("/investigate/{file_id}")
def investigate_anomalies(file_id: str):
    context = build_context(file_id)

    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior data analyst specializing in anomaly detection and root cause analysis. "
                    "Analyze the dataset statistics and produce an investigation report with exactly these sections:\n"
                    "1. Anomalies Detected — bullets, each naming the metric, time period, and magnitude of the drop or spike\n"
                    "2. Affected Segments — bullets identifying which dimensions (region, product, rep, etc.) are most impacted with numbers\n"
                    "3. Root Cause Hypotheses — bullets with 2-4 ranked plausible explanations\n"
                    "4. What to Investigate Next — bullets with specific data questions or slices to confirm or rule out each hypothesis\n\n"
                    + SECTION_SCHEMA
                ),
            },
            {"role": "user", "content": f"Dataset statistics:\n\n{context}"},
        ],
    )

    import json
    return json.loads(response.choices[0].message.content)


@router.post("/report/{file_id}")
def generate_report(file_id: str):
    context = build_context(file_id)

    response = client.chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior data analyst. Analyze the dataset statistics and produce a report "
                    "with exactly these sections:\n"
                    "1. Executive Summary — paragraph, 2-3 sentences on overall performance\n"
                    "2. Key Findings — bullets, 3-5 specific findings with exact numbers\n"
                    "3. Trends & Anomalies — bullets highlighting notable patterns, spikes, or drops with exact figures\n"
                    "4. Breakdown Analysis — bullets with insights from dimensional breakdowns (by region, product, etc.)\n"
                    "5. Recommendations — bullets, 3-5 actionable next steps grounded in the data\n\n"
                    + SECTION_SCHEMA
                ),
            },
            {"role": "user", "content": f"Dataset statistics:\n\n{context}"},
        ],
    )

    import json
    return json.loads(response.choices[0].message.content)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    file_id: str
    messages: list[ChatMessage]


@router.post("/chat")
def chat(req: ChatRequest):
    context = build_context(req.file_id)

    system_prompt = (
        "You are a data analyst assistant. The user has uploaded a CSV dataset. "
        "You have access to the computed statistics below. "
        "Answer questions clearly and concisely, referencing specific numbers where relevant.\n\n"
        f"Dataset statistics:\n{context}"
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            *[{"role": m.role, "content": m.content} for m in req.messages],
        ],
    )

    return {"reply": response.choices[0].message.content}
