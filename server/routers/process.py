from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"

router = APIRouter(prefix="/process", tags=["process"])

DASHBOARD_TYPES = [
    {
        "id": "sales",
        "label": "Sales Performance",
        "description": "Revenue over time, by region and rep. Includes anomaly detection.",
        "keywords": ["revenue", "sales", "deal", "rep", "quota", "pipeline", "won", "lost"],
    },
    {
        "id": "hr",
        "label": "HR & Headcount",
        "description": "Headcount trends, attrition, department breakdown, and tenure.",
        "keywords": ["employee", "headcount", "department", "hire", "termination", "tenure", "salary", "attrition"],
    },
    {
        "id": "finance",
        "label": "Finance Overview",
        "description": "Budget vs actuals, expense categories, and period-over-period variance.",
        "keywords": ["budget", "expense", "cost", "balance", "account", "ledger", "invoice", "payment"],
    },
    {
        "id": "inventory",
        "label": "Inventory & Supply",
        "description": "Stock levels, turnover rates, and supplier performance.",
        "keywords": ["inventory", "stock", "sku", "warehouse", "quantity", "supplier", "reorder", "shipment"],
    },
    {
        "id": "marketing",
        "label": "Marketing Analytics",
        "description": "Lead volume, conversion rates, channel performance, and CAC.",
        "keywords": ["lead", "conversion", "campaign", "channel", "impression", "click", "cac", "cpl"],
    },
    {
        "id": "support",
        "label": "Support & Operations",
        "description": "Ticket volume, resolution time, CSAT, and priority breakdown.",
        "keywords": ["ticket", "issue", "priority", "resolution", "csat", "agent", "sla", "status"],
    },
]


def detect_column_type(series: pd.Series) -> str:
    sample = series.dropna()
    if sample.empty:
        return "text"

    unique = set(sample.astype(str).str.lower().unique())
    if unique <= {"true", "false", "yes", "no", "1", "0"}:
        return "boolean"

    try:
        pd.to_numeric(sample)
        return "number"
    except Exception:
        pass

    try:
        pd.to_datetime(sample)
        return "date"
    except Exception:
        pass

    return "text"


def suggest_dashboard(col_names: list[str]) -> dict:
    joined = " ".join(col_names).lower()
    scores = []
    for dt in DASHBOARD_TYPES:
        score = sum(1 for kw in dt["keywords"] if kw in joined)
        scores.append((score, dt))

    scores.sort(key=lambda x: x[0], reverse=True)
    best_score, best = scores[0]

    if best_score == 0:
        return {
            "id": "general",
            "label": "General Dashboard",
            "description": "Overview of your data with charts for each numeric column.",
        }
    return {k: best[k] for k in ("id", "label", "description")}


@router.get("/{file_id}")
def process_file(file_id: str):
    matches = list(UPLOADS_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="File not found")

    path = matches[0]
    sep = "\t" if path.suffix == ".tsv" else ","

    try:
        df = pd.read_csv(path, sep=sep, nrows=500)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse file: {e}")

    columns = []
    for col in df.columns:
        col_type = detect_column_type(df[col])
        sample_values = df[col].dropna().astype(str).unique()[:5].tolist()
        columns.append(
            {
                "name": col,
                "type": col_type,
                "sample_values": sample_values,
                "null_count": int(df[col].isna().sum()),
            }
        )

    return {
        "file_id": file_id,
        "filename": path.name,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": columns,
        "suggested_dashboard": suggest_dashboard([c["name"] for c in columns]),
    }
