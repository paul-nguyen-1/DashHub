from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"

router = APIRouter(prefix="/process", tags=["process"])


def detect_column_type(series: pd.Series) -> str:
    # Drop nulls for type detection
    sample = series.dropna()
    if sample.empty:
        return "text"

    # Boolean
    unique = set(sample.astype(str).str.lower().unique())
    if unique <= {"true", "false", "yes", "no", "1", "0"}:
        return "boolean"

    # Number (before date — avoids integers being parsed as dates)
    try:
        pd.to_numeric(sample)
        return "number"
    except Exception:
        pass

    # Date
    try:
        pd.to_datetime(sample)
        return "date"
    except Exception:
        pass

    return "text"


@router.get("/{file_id}")
def process_file(file_id: str):
    # Find the uploaded file
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
        sample_values = (
            df[col].dropna().astype(str).unique()[:5].tolist()
        )
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
    }
