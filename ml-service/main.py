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
    # ── Data quality score ───────────────────────────────────────────────────────
@app.post("/quality")
def compute_quality(req: ProfileRequest):
    """
    Compute a 0–100 data quality score and breakdown.

    Four sub-scores (each 0–100), then a weighted average:
      • completeness (35%) — % of cells that are non-null
      • uniqueness   (15%) — penalty for columns that are >95% one value (excluding likely IDs)
      • consistency  (25%) — for numeric columns, what % of values actually parse as numbers
      • outliers     (25%) — penalty for high outlier density across numeric columns

    Each sub-score gets a short human-readable explanation so the UI and AI
    can show why the dataset got the score it did.
    """
    if not req.rows:
        raise HTTPException(status_code=400, detail="No rows provided")

    df    = pd.DataFrame(req.rows)
    total = len(df)
    if total == 0:
        return {"score": 0, "breakdown": {}, "note": "Empty dataset"}

    # ── 1. Completeness ────────────────────────────────────────────────
    cell_count    = total * len(df.columns)
    null_count    = int(df.isna().sum().sum())
    empty_strings = int(df.apply(lambda s: (s == "").sum() if s.dtype == "object" else 0).sum())
    missing       = null_count + empty_strings
    completeness  = round(max(0, 100 * (1 - missing / max(cell_count, 1))), 1)

    # ── 2. Uniqueness ──────────────────────────────────────────────────
    # Flag columns where one value dominates >95% of rows (excluding likely IDs)
    dominated_cols = []
    for col in df.columns:
        nn = df[col].dropna()
        if len(nn) < 10: continue
        top_freq = nn.value_counts(normalize=True).iloc[0] if len(nn) > 0 else 0
        # Skip likely ID columns (everything unique → ratio = 1/n)
        if nn.nunique() == len(nn): continue
        if top_freq > 0.95:
            dominated_cols.append({
                "column":   col,
                "topValue": str(nn.value_counts().index[0])[:50],
                "share":    round(float(top_freq) * 100, 1),
            })
    uniqueness = round(max(0, 100 - len(dominated_cols) * 15), 1)

    # ── 3. Consistency (numeric columns) ───────────────────────────────
    numeric_columns_checked = 0
    inconsistent_columns    = []
    for col in df.columns:
        nn = df[col].dropna()
        if len(nn) < 10: continue
        numeric = pd.to_numeric(nn, errors="coerce").dropna()
        ratio   = len(numeric) / len(nn)
        # If a column is "mostly numeric" (40-100%), check the % that actually parsed
        if 0.4 <= ratio < 1.0:
            numeric_columns_checked += 1
            if ratio < 0.95:
                inconsistent_columns.append({
                    "column":      col,
                    "validRatio":  round(float(ratio) * 100, 1),
                })
    consistency = (
        round(max(0, 100 - len(inconsistent_columns) * 20), 1)
        if numeric_columns_checked > 0
        else 100.0
    )

    # ── 4. Outlier density (numeric columns, IQR method) ───────────────
    outlier_columns   = []
    total_outlier_pct = 0.0
    numeric_evaluated = 0
    for col in df.columns:
        numeric = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(numeric) < 10: continue
        q1, q3 = numeric.quantile(0.25), numeric.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0: continue
        lo, hi   = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        outliers = numeric[(numeric < lo) | (numeric > hi)]
        pct      = len(outliers) / len(numeric) * 100
        numeric_evaluated += 1
        total_outlier_pct += pct
        if pct > 10:
            outlier_columns.append({
                "column":     col,
                "outlierPct": round(float(pct), 1),
            })
    avg_outlier_pct = total_outlier_pct / max(numeric_evaluated, 1)
    # Score: 100 if 0% outliers, 0 if 50%+ outliers (linear in between)
    outlier_score = round(max(0, 100 - avg_outlier_pct * 2), 1)

    # ── Weighted final score ───────────────────────────────────────────
    score = round(
        completeness * 0.35
        + uniqueness  * 0.15
        + consistency * 0.25
        + outlier_score * 0.25,
        1,
    )

    # Grade label
    if   score >= 90: grade = "A — excellent"
    elif score >= 75: grade = "B — good"
    elif score >= 60: grade = "C — fair"
    elif score >= 40: grade = "D — needs cleanup"
    else:             grade = "F — poor"

    return {
        "score":     score,
        "grade":     grade,
        "breakdown": {
            "completeness": {
                "score":   completeness,
                "weight":  35,
                "missing": missing,
                "totalCells": cell_count,
            },
            "uniqueness": {
                "score":         uniqueness,
                "weight":        15,
                "dominatedCols": dominated_cols,
            },
            "consistency": {
                "score":              consistency,
                "weight":             25,
                "inconsistentCols":   inconsistent_columns,
            },
            "outliers": {
                "score":            outlier_score,
                "weight":           25,
                "avgOutlierPct":    round(avg_outlier_pct, 1),
                "highOutlierCols":  outlier_columns,
            },
        },
    }
    # ── Smart insights generator ─────────────────────────────────────────────────
@app.post("/insights")
def generate_insights(req: ProfileRequest):
    """
    Generate 3–5 natural-language observations about the dataset.

    Unlike the other endpoints which compute *one* specific ML output,
    this one analyzes the dataset holistically and surfaces what's
    *interesting* — high outlier concentration, strong correlations,
    dominant categorical values, missing data, skew, etc.

    Each insight has a type (for icon/color in UI), title, description,
    and severity (info / notable / warning).
    """
    if not req.rows:
        raise HTTPException(status_code=400, detail="No rows provided")

    df    = pd.DataFrame(req.rows)
    total = len(df)
    if total == 0:
        return {"insights": []}

    insights = []

    # ── Classify columns once ──────────────────────────────────────────
    numeric_cols, categorical_cols = [], []
    for col in df.columns:
        nn = df[col].dropna()
        if len(nn) < 5: continue
        numeric_vals = pd.to_numeric(nn, errors="coerce").dropna()
        if len(numeric_vals) / max(len(nn), 1) >= 0.4:
            numeric_cols.append(col)
        else:
            categorical_cols.append(col)

    # ── 1. Summary insight (always shown) ──────────────────────────────
    insights.append({
        "type":        "summary",
        "title":       "Dataset overview",
        "description": (
            f"{total:,} rows across {len(df.columns)} columns — "
            f"{len(numeric_cols)} numeric, {len(categorical_cols)} categorical."
        ),
        "severity":    "info",
    })

    # ── 2. Missing data (if any) ───────────────────────────────────────
    nulls   = int(df.isna().sum().sum())
    empties = int(df.apply(lambda s: (s == "").sum() if s.dtype == "object" else 0).sum())
    missing = nulls + empties
    cells   = total * len(df.columns)
    if missing > 0:
        pct = round(missing / cells * 100, 1)
        insights.append({
            "type":        "missing",
            "title":       f"{pct}% of cells are missing",
            "description": (
                f"{missing:,} of {cells:,} cells are blank or null. "
                "Consider whether these represent intentional omissions or data-collection gaps."
            ),
            "severity":    "warning" if pct > 10 else "notable",
        })
    else:
        insights.append({
            "type":        "completeness",
            "title":       "No missing data",
            "description": f"All {cells:,} cells are filled — clean, complete data.",
            "severity":    "info",
        })

    # ── 3. Outlier concentration (numeric IQR) ─────────────────────────
    for col in numeric_cols:
        numeric = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(numeric) < 10: continue
        q1, q3 = numeric.quantile(0.25), numeric.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0: continue
        lo, hi   = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        outliers = numeric[(numeric < lo) | (numeric > hi)]
        pct      = round(len(outliers) / len(numeric) * 100, 1)
        if pct >= 5:
            insights.append({
                "type":  "outlier",
                "title": f"{pct}% of '{col}' values are outliers",
                "description": (
                    f"{len(outliers):,} rows in '{col}' fall outside the normal range "
                    f"[{round(float(lo), 2)}, {round(float(hi), 2)}]. "
                    f"Maximum value is {round(float(numeric.max()), 2)}, "
                    f"compared to a median of {round(float(numeric.median()), 2)}."
                ),
                "severity": "warning" if pct >= 15 else "notable",
            })
            break  # only show the worst outlier insight

    # ── 4. Strongest correlation ───────────────────────────────────────
    if len(numeric_cols) >= 2:
        corr = df[numeric_cols].apply(pd.to_numeric, errors="coerce").corr()
        best_r, best_pair = 0, None
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                r = corr.iat[i, j]
                if pd.isna(r): continue
                if abs(r) > abs(best_r):
                    best_r    = r
                    best_pair = (numeric_cols[i], numeric_cols[j])
        if best_pair and abs(best_r) >= 0.3:
            direction = "positively" if best_r > 0 else "negatively"
            if   abs(best_r) >= 0.7: strength = "strongly"
            elif abs(best_r) >= 0.5: strength = "moderately"
            else:                    strength = "modestly"
            insights.append({
                "type":  "correlation",
                "title": f"'{best_pair[0]}' and '{best_pair[1]}' are {strength} {direction} correlated",
                "description": (
                    f"Pearson correlation coefficient is {round(float(best_r), 3)}. "
                    f"As one column changes, the other tends to "
                    f"{'increase' if best_r > 0 else 'decrease'} accordingly."
                ),
                "severity": "notable",
            })

    # ── 5. Dominant categorical value ──────────────────────────────────
    for col in categorical_cols:
        nn = df[col].dropna()
        nn = nn[nn != ""]
        if len(nn) < 10: continue
        top_count = nn.value_counts().iloc[0] if len(nn) > 0 else 0
        top_value = str(nn.value_counts().index[0])[:50]
        pct       = round(top_count / len(nn) * 100, 1)
        if pct >= 50 and nn.nunique() > 1:
            insights.append({
                "type":  "dominant",
                "title": f"'{col}' is dominated by one value",
                "description": (
                    f"{pct}% of rows in '{col}' have the value \"{top_value}\". "
                    f"This column has {nn.nunique():,} unique values total, "
                    f"but the data is heavily concentrated."
                ),
                "severity": "notable",
            })
            break  # only one dominant-value insight

    # ── 6. Skewed numeric distribution ─────────────────────────────────
    for col in numeric_cols:
        numeric = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(numeric) < 10: continue
        mean   = float(numeric.mean())
        median = float(numeric.median())
        if median == 0: continue
        ratio = mean / median
        if ratio >= 3 or ratio <= 0.33:
            skew_dir = "right-skewed" if ratio > 1 else "left-skewed"
            insights.append({
                "type":  "skew",
                "title": f"'{col}' is heavily {skew_dir}",
                "description": (
                    f"Mean is {round(mean, 2)} but median is {round(median, 2)} — "
                    f"a {round(abs(ratio - 1) * 100)}% difference. "
                    f"A small number of {'large' if ratio > 1 else 'small'} values "
                    f"are pulling the average."
                ),
                "severity": "notable",
            })
            break

    # ── Return top 5, summary always first ─────────────────────────────
    return {
        "totalGenerated": len(insights),
        "insights":       insights[:5],
    }
    # ── Time-series trend detection ──────────────────────────────────────────────
@app.post("/trends")
def detect_trends(req: ProfileRequest):
    """
    Detect time-series trends in the dataset.

    1. Auto-detects a date column by trying to parse each column as a date.
    2. For each numeric column, fits a linear trend over the sorted dates.
    3. Returns slope, percent change, R-squared, and a plain-English summary.

    If no date column is found, returns an empty result so the pipeline
    can skip this analysis gracefully.
    """
    if not req.rows:
        raise HTTPException(status_code=400, detail="No rows provided")

    df = pd.DataFrame(req.rows)
    if len(df) < 5:
        return {"hasDateColumn": False, "trends": []}

    # ── 1. Auto-detect the date column ─────────────────────────────────
    date_col, parsed_dates = None, None
    for col in df.columns:
        try:
            dates = pd.to_datetime(df[col], errors="coerce")
            valid_ratio = dates.notna().sum() / len(df)
            if valid_ratio >= 0.8:    # 80%+ of values parse as dates
                date_col      = col
                parsed_dates  = dates
                break
        except Exception:
            continue

    if date_col is None:
        return {
            "hasDateColumn": False,
            "trends":        [],
            "note":          "No date column detected — trends require a column with parseable dates.",
        }

    # ── 2. Identify numeric columns (excluding the date) ───────────────
    numeric_cols = []
    for col in df.columns:
        if col == date_col: continue
        numeric = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(numeric) >= 5 and (len(numeric) / len(df)) >= 0.5:
            numeric_cols.append(col)

    if not numeric_cols:
        return {
            "hasDateColumn": True,
            "dateColumn":    date_col,
            "trends":        [],
            "note":          "No numeric columns to analyze.",
        }

    # ── 3. Sort by date and compute trends for each numeric column ─────
    df_sorted   = df.copy()
    df_sorted["__date"] = parsed_dates
    df_sorted   = df_sorted.dropna(subset=["__date"]).sort_values("__date")
    date_range  = (df_sorted["__date"].max() - df_sorted["__date"].min()).days
    n_periods   = len(df_sorted)

    trends = []
    for col in numeric_cols:
        values = pd.to_numeric(df_sorted[col], errors="coerce")
        mask   = values.notna()
        if mask.sum() < 5: continue

        # x = sequential position (0, 1, 2, ...), y = numeric values
        x = np.arange(mask.sum(), dtype=float)
        y = values[mask].values.astype(float)

        # Linear regression using numpy.polyfit
        try:
            slope, intercept = np.polyfit(x, y, 1)
        except Exception:
            continue

        # R-squared
        y_pred   = slope * x + intercept
        ss_res   = float(np.sum((y - y_pred) ** 2))
        ss_tot   = float(np.sum((y - y.mean()) ** 2))
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

        # Percent change from first to last value
        start_val = float(y[0])
        end_val   = float(y[-1])
        pct_change = (
            ((end_val - start_val) / abs(start_val)) * 100
            if start_val != 0 else 0
        )

        # Classify trend strength + direction
        if   abs(slope) < 1e-9:        direction = "flat"
        elif slope > 0:                direction = "rising"
        else:                          direction = "falling"

        if   r_squared >= 0.7:         strength = "strong"
        elif r_squared >= 0.4:         strength = "moderate"
        elif r_squared >= 0.15:        strength = "weak"
        else:                          strength = "no clear"

        # Human-readable summary
        if direction == "flat" or strength == "no clear":
            summary = f"'{col}' shows no clear trend over the period"
        else:
            summary = (
                f"'{col}' has a {strength} {direction} trend — "
                f"{'+' if pct_change > 0 else ''}{round(pct_change, 1)}% "
                f"change from start to end"
            )

        trends.append({
            "column":     col,
            "direction":  direction,
            "strength":   strength,
            "slope":      round(float(slope), 4),
            "rSquared":   round(float(r_squared), 3),
            "pctChange":  round(float(pct_change), 1),
            "startValue": round(start_val, 2),
            "endValue":   round(end_val, 2),
            "summary":    summary,
        })

    # ── 4. Rank by strength (strongest trends first) ───────────────────
    strength_order = {"strong": 3, "moderate": 2, "weak": 1, "no clear": 0}
    trends.sort(key=lambda t: (strength_order[t["strength"]], abs(t["pctChange"])), reverse=True)

    return {
        "hasDateColumn": True,
        "dateColumn":    date_col,
        "periodDays":    date_range,
        "dataPoints":    n_periods,
        "trends":        trends[:10],
    }
    # ── K-Means clustering ───────────────────────────────────────────────────────
@app.post("/clusters")
def compute_clusters(req: ProfileRequest):
    """
    Run K-Means clustering on the numeric columns of the dataset.

    Auto-selects the best K using the elbow method (testing K=2..6 and picking
    the one with the biggest "elbow" in within-cluster sum of squares).

    Returns: cluster assignments per row, cluster centers, sizes, and a
    plain-English description of each cluster (which columns are above/below
    the dataset mean for each cluster).
    """
    from sklearn.cluster     import KMeans
    from sklearn.preprocessing import StandardScaler

    if not req.rows:
        raise HTTPException(status_code=400, detail="No rows provided")

    df = pd.DataFrame(req.rows)
    if len(df) < 6:
        return {"hasClusters": False, "note": "Need at least 6 rows to cluster."}

    # ── 1. Pick numeric columns with enough variance ───────────────────
    numeric_cols = []
    for col in df.columns:
        numeric = pd.to_numeric(df[col], errors="coerce").dropna()
        if len(numeric) < 5: continue
        if numeric.nunique() < 2: continue           # constant column — useless
        if (len(numeric) / len(df)) >= 0.7:
            numeric_cols.append(col)

    if len(numeric_cols) < 2:
        return {
            "hasClusters": False,
            "note":        f"Need at least 2 numeric columns to cluster — found {len(numeric_cols)}.",
        }

    # ── 2. Build the feature matrix (impute means, then standardize) ───
    X_raw = df[numeric_cols].apply(pd.to_numeric, errors="coerce")
    X_raw = X_raw.fillna(X_raw.mean())               # fill NaNs with column means
    if X_raw.isna().any().any():                      # still NaN → drop column
        bad = X_raw.columns[X_raw.isna().any()].tolist()
        X_raw = X_raw.drop(columns=bad)
        numeric_cols = [c for c in numeric_cols if c not in bad]
        if len(numeric_cols) < 2:
            return {"hasClusters": False, "note": "Not enough usable numeric data."}

    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(X_raw.values)

    # ── 3. Find best K via the elbow method (K=2..min(6, n/3)) ─────────
    max_k    = min(6, max(2, len(df) // 3))
    inertias = []
    models   = {}
    for k in range(2, max_k + 1):
        km = KMeans(n_clusters=k, n_init=10, random_state=42)
        km.fit(X_scaled)
        inertias.append((k, float(km.inertia_)))
        models[k] = km

    # Elbow detection: biggest drop ratio gives best K
    best_k = 2
    if len(inertias) >= 3:
        diffs = []
        for i in range(1, len(inertias) - 1):
            k_prev, inertia_prev = inertias[i - 1]
            k_curr, inertia_curr = inertias[i]
            k_next, inertia_next = inertias[i + 1]
            drop1 = inertia_prev - inertia_curr
            drop2 = inertia_curr - inertia_next
            ratio = drop1 / max(drop2, 0.001)
            diffs.append((k_curr, ratio))
        if diffs:
            best_k = max(diffs, key=lambda d: d[1])[0]

    best_model = models[best_k]
    labels     = best_model.labels_

    # ── 4. Compute cluster centers in original (un-scaled) units ───────
    centers_raw = scaler.inverse_transform(best_model.cluster_centers_)

    # ── 5. Build the per-cluster summary ───────────────────────────────
    overall_means = {col: float(X_raw[col].mean()) for col in numeric_cols}
    cluster_summaries = []

    for cluster_id in range(best_k):
        mask        = labels == cluster_id
        cluster_size = int(mask.sum())
        pct          = round(cluster_size / len(df) * 100, 1)

        # Per-column averages within this cluster
        cluster_means = {}
        for j, col in enumerate(numeric_cols):
            cluster_means[col] = round(float(centers_raw[cluster_id][j]), 2)

        # Describe what makes this cluster distinct
        differences = []
        for col in numeric_cols:
            cluster_val = cluster_means[col]
            overall     = overall_means[col]
            if overall == 0: continue
            diff_pct = (cluster_val - overall) / abs(overall) * 100
            if abs(diff_pct) >= 15:    # only mention noticeably different columns
                differences.append({
                    "column":     col,
                    "direction":  "above" if diff_pct > 0 else "below",
                    "pctOffMean": round(float(diff_pct), 1),
                    "value":      cluster_val,
                })

        # Sort differences by magnitude — biggest distinctions first
        differences.sort(key=lambda d: abs(d["pctOffMean"]), reverse=True)

        # Plain-English label
        if not differences:
            label = f"Cluster {cluster_id + 1} (typical / near-average)"
        else:
            top_diff = differences[0]
            label = (
                f"Cluster {cluster_id + 1} — "
                f"{'high' if top_diff['direction'] == 'above' else 'low'} {top_diff['column']}"
            )

        cluster_summaries.append({
            "clusterId":    cluster_id,
            "label":        label,
            "size":         cluster_size,
            "percentage":   pct,
            "centerValues": cluster_means,
            "differences":  differences[:5],
        })

    # Sort clusters by size, largest first
    cluster_summaries.sort(key=lambda c: c["size"], reverse=True)

    # ── 6. Pick 2 best columns for the 2D scatter plot visualization ───
    # Use the two columns with the largest "between-cluster" variance
    col_variances = []
    for j, col in enumerate(numeric_cols):
        cluster_centers_col = centers_raw[:, j]
        variance = float(np.var(cluster_centers_col))
        col_variances.append((col, j, variance))
    col_variances.sort(key=lambda x: x[2], reverse=True)
    scatter_x, scatter_y = col_variances[0][0], col_variances[1][0] if len(col_variances) > 1 else col_variances[0][0]

    # Build scatter points (sample up to 500 rows for performance)
    sample_size = min(500, len(df))
    sample_idx  = np.random.RandomState(42).choice(len(df), sample_size, replace=False) if len(df) > sample_size else np.arange(len(df))
    scatter_points = []
    for idx in sample_idx:
        scatter_points.append({
            "x":         float(X_raw[scatter_x].iloc[int(idx)]),
            "y":         float(X_raw[scatter_y].iloc[int(idx)]),
            "cluster":   int(labels[idx]),
        })

    return {
        "hasClusters":      True,
        "k":                best_k,
        "numericColumns":   numeric_cols,
        "totalRows":        len(df),
        "clusters":         cluster_summaries,
        "scatter": {
            "xColumn":      scatter_x,
            "yColumn":      scatter_y,
            "points":       scatter_points,
        },
    }
# ── Local dev entry point ────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)