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
# ── Anomaly detection ────────────────────────────────────────────────────────
@app.post("/anomalies")
def detect_anomalies(req: ProfileRequest):
    """
    Detect outliers in every numeric column using the IQR (interquartile
    range) method:
      • compute Q1 and Q3
      • IQR = Q3 - Q1
      • outliers fall outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]

    Returns per-column outlier count, percentage, bounds, and the
    most extreme outlier rows (capped to 10 per column for response size).
    """
    if not req.rows:
        raise HTTPException(status_code=400, detail="No rows provided")

    df = pd.DataFrame(req.rows)
    anomalies: Dict[str, Any] = {}
    total_outlier_rows = set()  # row indices flagged in any column

    for col in df.columns:
        series   = df[col]
        non_null = series.dropna()
        numeric  = pd.to_numeric(non_null, errors="coerce").dropna()

        # Skip columns that aren't really numeric or are too small to evaluate
        if len(numeric) < 10 or (len(numeric) / max(len(non_null), 1)) < 0.4:
            continue

        q1, q3 = numeric.quantile(0.25), numeric.quantile(0.75)
        iqr    = q3 - q1
        if iqr == 0:
            continue  # constant column → no anomalies

        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr

        # Mask of outlier rows (preserves original index)
        outlier_mask = (numeric < lower) | (numeric > upper)
        outlier_idx  = numeric[outlier_mask].index.tolist()
        outlier_vals = numeric[outlier_mask]

        if len(outlier_idx) == 0:
            continue

        # Track all flagged row indices across columns
        for i in outlier_idx:
            total_outlier_rows.add(int(i))

        # Top 10 most extreme outliers by distance from the median
        median   = numeric.median()
        extreme  = outlier_vals.reindex(
            (outlier_vals - median).abs().sort_values(ascending=False).index
        ).head(10)

        anomalies[col] = {
            "outlierCount": int(len(outlier_idx)),
            "percentage":   round(float(len(outlier_idx) / len(numeric) * 100), 2),
            "lowerBound":   round(float(lower), 4),
            "upperBound":   round(float(upper), 4),
            "median":       round(float(median), 4),
            "topOutliers":  [
                {"rowIndex": int(idx), "value": round(float(val), 4)}
                for idx, val in extreme.items()
            ],
        }

    return {
        "method":              "IQR (1.5x)",
        "anomalies":           anomalies,
        "totalOutlierRows":    len(total_outlier_rows),
        "totalRows":           len(df),
        "rowsAffectedPct":     round(
            float(len(total_outlier_rows) / max(len(df), 1) * 100), 2
        ),
    }
# ── Correlation analysis ─────────────────────────────────────────────────────
@app.post("/correlations")
def compute_correlations(req: ProfileRequest):
    """
    Compute pairwise Pearson correlation between every numeric column.

    Returns:
      • columns: list of numeric column names included
      • matrix:  full NxN correlation matrix (for heatmap display)
      • topPairs: ranked list of strongest correlations (for AI to mention)

    Strength buckets (standard data-science thresholds):
      |r| < 0.1  → negligible (filtered out)
      0.1–0.3    → weak
      0.3–0.5    → moderate
      0.5–0.7    → strong
      ≥ 0.7      → very strong
    """
    if not req.rows:
        raise HTTPException(status_code=400, detail="No rows provided")

    df = pd.DataFrame(req.rows)

    # Convert all columns to numeric where possible; non-numeric → NaN → dropped
    numeric_df = df.apply(pd.to_numeric, errors="coerce")

    # Keep only columns where at least 40% of values are numeric AND there's variance
    valid_cols = []
    for col in numeric_df.columns:
        non_null = numeric_df[col].dropna()
        ratio    = len(non_null) / max(len(df), 1)
        if ratio >= 0.4 and len(non_null) >= 10 and non_null.std() > 0:
            valid_cols.append(col)

    if len(valid_cols) < 2:
        return {
            "method":   "Pearson",
            "columns":  valid_cols,
            "matrix":   [],
            "topPairs": [],
            "note":     "Need at least 2 numeric columns with variance to compute correlations",
        }

    # Compute the correlation matrix (pandas handles NaN gracefully)
    corr = numeric_df[valid_cols].corr(method="pearson")

    # Convert to a plain 2D list (rounded)
    matrix = [[round(float(corr.iat[i, j]), 4) for j in range(len(valid_cols))]
              for i in range(len(valid_cols))]

    # Build a flat list of pairs (upper triangle only — corr is symmetric)
    pairs = []
    for i in range(len(valid_cols)):
        for j in range(i + 1, len(valid_cols)):
            r = float(corr.iat[i, j])
            if pd.isna(r):
                continue
            abs_r = abs(r)
            if abs_r < 0.1:
                continue  # negligible — skip

            if abs_r >= 0.7:
                strength = "very strong"
            elif abs_r >= 0.5:
                strength = "strong"
            elif abs_r >= 0.3:
                strength = "moderate"
            else:
                strength = "weak"

            pairs.append({
                "col1":        valid_cols[i],
                "col2":        valid_cols[j],
                "correlation": round(r, 4),
                "absCorr":     round(abs_r, 4),
                "direction":   "positive" if r > 0 else "negative",
                "strength":    strength,
            })

    # Rank strongest first
    pairs.sort(key=lambda p: p["absCorr"], reverse=True)

    return {
        "method":   "Pearson",
        "columns":  valid_cols,
        "matrix":   matrix,
        "topPairs": pairs[:20],   # cap so response stays small
    }
# ── Local dev entry point ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)