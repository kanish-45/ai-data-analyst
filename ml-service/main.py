"""
DataMind ML Service
───────────────────
A focused Python microservice that handles statistical profiling of datasets
using pandas and numpy. The Node.js backend calls this service whenever
accurate column statistics are needed.

For now: one endpoint that profiles a dataset.
Future: anomaly detection, correlation analysis, time-series, quality scores.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
import numpy as np

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="DataMind ML Service",
    description="Statistical profiling and ML for DataMind AI",
    version="0.1.0",
)

# Allow the Node backend (and frontend during dev) to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / response shapes ────────────────────────────────────────────────
class ProfileRequest(BaseModel):
    """A dataset profile request — just rows; columns inferred."""
    rows: List[Dict[str, Any]]


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "DataMind ML Service",
        "status":  "ok",
        "version": "0.1.0",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


# ── The main event: profile a dataset ────────────────────────────────────────
@app.post("/profile")
def profile_dataset(req: ProfileRequest):
    """
    Compute rich statistical profile for every column in the dataset.

    For numeric columns: min, max, mean, median, stddev, quartiles, distribution
    For categorical columns: count, unique, top values with percentages
    """
    if not req.rows:
        raise HTTPException(status_code=400, detail="No rows provided")

    # Load into pandas — the workhorse for the rest of this function
    df = pd.DataFrame(req.rows)
    total_rows = len(df)
    stats: Dict[str, Dict[str, Any]] = {}

    for col in df.columns:
        series = df[col]
        non_null = series.dropna()
        null_count = total_rows - len(non_null)

        # Try to coerce to numeric — pandas does this elegantly
        numeric = pd.to_numeric(non_null, errors="coerce").dropna()
        is_numeric = len(non_null) > 0 and (len(numeric) / len(non_null)) >= 0.4

        if is_numeric and len(numeric) > 0:
            # Numeric profile
            distribution = []
            if numeric.min() != numeric.max():
                hist, edges = np.histogram(numeric, bins=10)
                for i in range(len(hist)):
                    distribution.append({
                        "range": f"{edges[i]:.2f}–{edges[i+1]:.2f}",
                        "count": int(hist[i]),
                    })

            stats[col] = {
                "type":        "numeric",
                "count":       int(len(numeric)),
                "nullCount":   int(null_count),
                "uniqueCount": int(numeric.nunique()),
                "min":         float(numeric.min()),
                "max":         float(numeric.max()),
                "mean":        round(float(numeric.mean()), 4),
                "median":      round(float(numeric.median()), 4),
                "stddev":      round(float(numeric.std(ddof=0)), 4),
                "q1":          float(numeric.quantile(0.25)),
                "q3":          float(numeric.quantile(0.75)),
                "distribution": distribution,
            }
        else:
            # Categorical profile
            value_counts = non_null.astype(str).str.strip().replace("", np.nan).dropna().value_counts()
            top_values = []
            for value, count in value_counts.head(10).items():
                top_values.append({
                    "value": value,
                    "count": int(count),
                    "pct":   round(float(count / max(len(non_null), 1) * 100), 2),
                })

            stats[col] = {
                "type":        "categorical",
                "count":       int(len(non_null)),
                "nullCount":   int(null_count),
                "uniqueCount": int(len(value_counts)),
                "topValues":   top_values,
            }

    return {
        "rowCount":    total_rows,
        "columnCount": len(df.columns),
        "columns":     list(df.columns),
        "stats":       stats,
    }


# ── Local dev entry point ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)