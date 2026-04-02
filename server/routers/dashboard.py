from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException

from routers.process import detect_column_type

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _month_label(period: str) -> str:
    try:
        return pd.to_datetime(period).strftime("%b")
    except Exception:
        return period


def _classify_columns(df: pd.DataFrame) -> dict:
    date_col = None
    numeric_cols = []
    dimension_cols = []

    for col in df.columns:
        col_type = detect_column_type(df[col])

        if col_type == "date" and date_col is None:
            date_col = col

        elif col_type == "number":
            total = pd.to_numeric(df[col], errors="coerce").sum()
            numeric_cols.append((col, float(total)))

        elif col_type in ("text", "boolean"):
            n_unique = df[col].nunique()
            if n_unique <= 50:
                dimension_cols.append((col, n_unique))

    numeric_cols.sort(key=lambda x: x[1], reverse=True)
    dimension_cols.sort(key=lambda x: x[1])

    return {
        "date_col": date_col,
        "numeric_cols": [c for c, _ in numeric_cols],
        "dimension_cols": [c for c, _ in dimension_cols],
    }


@router.get("/{file_id}")
def get_dashboard(file_id: str):
    matches = list(UPLOADS_DIR.glob(f"{file_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="File not found")

    path = matches[0]
    sep = "\t" if path.suffix == ".tsv" else ","
    df = pd.read_csv(path, sep=sep)

    cols = _classify_columns(df)
    date_col = cols["date_col"]
    numeric_cols = cols["numeric_cols"]
    dimension_cols = cols["dimension_cols"]

    if not numeric_cols:
        raise HTTPException(status_code=422, detail="No numeric columns found in file")

    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    kpis = {
        col: {
            "sum": round(float(df[col].sum()), 2),
            "mean": round(float(df[col].mean()), 2),
            "label": col,
        }
        for col in numeric_cols
    }

    time_series = []
    if date_col:
        df["_period"] = (
            pd.to_datetime(df[date_col], errors="coerce")
            .dt.to_period("M")
            .astype(str)
        )
        grp = (
            df.groupby("_period")[numeric_cols]
            .sum()
            .reset_index()
            .sort_values("_period")
        )
        for _, row in grp.iterrows():
            entry: dict = {"month": _month_label(row["_period"])}
            for col in numeric_cols:
                entry[col] = round(float(row[col]), 2)
            time_series.append(entry)

    breakdowns = {}
    for dim in dimension_cols:
        grp = (
            df.groupby(dim)[numeric_cols]
            .sum()
            .reset_index()
            .sort_values(numeric_cols[0], ascending=False)
            .head(8)
        )
        breakdowns[dim] = [
            {dim: str(row[dim]), **{col: round(float(row[col]), 2) for col in numeric_cols}}
            for _, row in grp.iterrows()
        ]

    return {
        "columns": {
            "date": date_col,
            "numeric": numeric_cols,
            "dimensions": dimension_cols,
        },
        "kpis": kpis,
        "time_series": time_series,
        "breakdowns": breakdowns,
    }
