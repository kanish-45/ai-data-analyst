import { createContext, useContext, useState, useCallback } from 'react'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [datasets,      setDatasets]      = useState([])
  const [activeDataset, setActiveDataset] = useState(null)

  const addDataset = useCallback((dataset) => {
    setDatasets((prev) => {
      const exists = prev.find((d) => d.id === dataset.id)
      if (exists) return prev
      return [dataset, ...prev]
    })
  }, [])

  const removeDataset = useCallback((id) => {
    setDatasets((prev) => prev.filter((d) => d.id !== id))
    setActiveDataset((prev) => (prev?.id === id ? null : prev))
  }, [])

  const loadIntoChat = useCallback((dataset) => {
    setActiveDataset(dataset)
  }, [])

  const clearActiveDataset = useCallback(() => {
    setActiveDataset(null)
  }, [])

  return (
    <DataContext.Provider value={{
      datasets,
      activeDataset,
      addDataset,
      removeDataset,
      loadIntoChat,
      clearActiveDataset,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}

// Yields to the browser between chunks so the UI stays responsive
const yieldToBrowser = () => new Promise((r) => setTimeout(r, 0))

// ── CSV Parser — chunked, async, with real progress ──────────────────────────
export async function parseCSV(text, onProgress) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return { columns: [], rows: [], rowCount: 0 }

  const delimiters = [',', ';', '\t']
  const delimiter  = delimiters.reduce((best, d) =>
    lines[0].split(d).length > lines[0].split(best).length ? d : best, ',')

  const parseRow = (line) => {
    const cols = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"')              { inQ = !inQ }
      else if (ch === delimiter && !inQ) { cols.push(cur.trim()); cur = '' }
      else                         { cur += ch }
    }
    cols.push(cur.trim())
    return cols
  }

  const headers   = parseRow(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim())
  const dataLines = lines.slice(1)
  const totalRows = dataLines.length
  const chunkSize = 1000
  const allRows   = []

  for (let i = 0; i < totalRows; i += chunkSize) {
    const slice = dataLines.slice(i, i + chunkSize)
    for (const line of slice) {
      const vals = parseRow(line)
      allRows.push(
        Object.fromEntries(headers.map((h, idx) => [h, vals[idx]?.replace(/^"|"$/g, '').trim() ?? '']))
      )
    }
    onProgress?.(Math.min(i + chunkSize, totalRows), totalRows)
    await yieldToBrowser()
  }

  return {
    columns:  headers,
    rows:     allRows.slice(0, 10),
    allRows,
    rowCount: allRows.length,
  }
}

// ── JSON Parser — async chunked ──────────────────────────────────────────────
export async function parseJSON(text, onProgress) {
  const data = JSON.parse(text)
  const arr  = Array.isArray(data)
    ? data
    : Array.isArray(data?.data) ? data.data : [data]

  if (arr.length === 0) return { columns: [], rows: [], rowCount: 0 }

  const chunkSize = 1000
  const flat = []

  for (let i = 0; i < arr.length; i += chunkSize) {
    const slice = arr.slice(i, i + chunkSize)
    for (const item of slice) {
      const out = {}
      for (const [k, v] of Object.entries(item)) {
        if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          for (const [k2, v2] of Object.entries(v)) out[`${k}.${k2}`] = v2
        } else {
          out[k] = v
        }
      }
      flat.push(out)
    }
    onProgress?.(Math.min(i + chunkSize, arr.length), arr.length)
    await yieldToBrowser()
  }

  const columns = Object.keys(flat[0])
  return {
    columns,
    rows:     flat.slice(0, 10),
    allRows:  flat,
    rowCount: arr.length,
  }
}

// ── Excel Parser ─────────────────────────────────────────────────────────────
export async function parseExcel(arrayBuffer, onProgress) {
  try {
    onProgress?.(0, 1)
    const XLSX = await import('xlsx')
    const wb   = XLSX.read(arrayBuffer, { type: 'array' })

    const ws       = wb.Sheets[wb.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' })

    if (jsonData.length === 0) return { columns: [], rows: [], rowCount: 0 }

    onProgress?.(jsonData.length, jsonData.length)
    const columns = Object.keys(jsonData[0])
    return {
      columns,
      rows:     jsonData.slice(0, 10),
      allRows:  jsonData,
      rowCount: jsonData.length,
    }
  } catch {
    return {
      columns:  ['Run: npm install xlsx — to enable Excel parsing'],
      rows:     [],
      allRows:  [],
      rowCount: 0,
      xlsxMissing: true,
    }
  }
}

// ── Build AI context string from dataset ─────────────────────────────────────
// Reads the stored profile (columnStats) and anomalies when available, so the
// AI receives real statistics + outlier info computed over the full dataset.
export function buildDatasetContext(dataset) {
  if (!dataset) return ''

  const stats      = dataset.columnStats || {}
  const hasProfile = Object.keys(stats).length > 0

  const numericLines     = []
  const categoricalLines = []

  for (const col of dataset.columns) {
    const s = stats[col]
    if (!s) continue

    if (s.type === 'numeric') {
      numericLines.push(
        `  ${col}:\n` +
        `    count=${s.count}, null=${s.nullCount}, unique=${s.uniqueCount}\n` +
        `    min=${s.min}, max=${s.max}\n` +
        `    mean=${s.mean}, median=${s.median}, stddev=${s.stddev}\n` +
        `    q1=${s.q1}, q3=${s.q3}`
      )
    } else if (s.type === 'categorical') {
      const top = (s.topValues || []).slice(0, 5)
        .map((t) => `"${t.value}" (${t.count}, ${t.pct}%)`)
        .join(', ')
      categoricalLines.push(
        `  ${col}: count=${s.count}, null=${s.nullCount}, unique=${s.uniqueCount}` +
        (top ? `\n    top values: ${top}` : '')
      )
    }
  }

  // ── Anomalies section ──────────────────────────────────────────────────
  // Format outlier detection (computed by the Python ML service via IQR)
  // so the AI can answer outlier questions with real grounded numbers.
  const anomaliesData = dataset.anomalies || {}
  const anomalyCols   = anomaliesData.anomalies || {}
  const hasAnomalies  = Object.keys(anomalyCols).length > 0

  let anomalyBlock = ''
  if (hasAnomalies) {
    const lines = []
    for (const [col, info] of Object.entries(anomalyCols)) {
      const topList = (info.topOutliers || []).slice(0, 3)
        .map((o) => `row ${o.rowIndex} (value=${o.value})`)
        .join(', ')
      lines.push(
        `  ${col}:\n` +
        `    ${info.outlierCount} outliers (${info.percentage}% of column)\n` +
        `    normal range: [${info.lowerBound}, ${info.upperBound}]\n` +
        `    most extreme: ${topList}`
      )
    }
    anomalyBlock =
      `\nAnomaly detection (IQR 1.5x method):\n` +
      `  Total: ${anomaliesData.totalOutlierRows} rows flagged ` +
      `(${anomaliesData.rowsAffectedPct}% of dataset) across ${Object.keys(anomalyCols).length} columns\n` +
      lines.join('\n')
  }
  // ── Correlations section ───────────────────────────────────────────────
  const corr        = dataset.correlations || {}
  const corrPairs   = corr.topPairs || []
  const hasCorr     = corrPairs.length > 0

  let correlationBlock = ''
  if (hasCorr) {
    const lines = corrPairs.slice(0, 10).map((p) => {
      const sign = p.correlation > 0 ? '+' : ''
      return `  ${p.col1} ↔ ${p.col2}: ${sign}${p.correlation} (${p.strength} ${p.direction})`
    })
    correlationBlock =
      `\nCorrelations (Pearson method, computed over full dataset):\n` +
      lines.join('\n')
  }
  // ── Quality score section ──────────────────────────────────────────────
  const quality = dataset.quality || {}
  let qualityBlock = ''
  if (quality.score != null && quality.breakdown) {
    const b = quality.breakdown
    qualityBlock =
      `\nData quality score: ${quality.score}/100 (${quality.grade || 'unknown'})\n` +
      `  • Completeness: ${b.completeness?.score}/100 — ${b.completeness?.missing} missing of ${b.completeness?.totalCells} cells\n` +
      `  • Uniqueness:   ${b.uniqueness?.score}/100 — ${b.uniqueness?.dominatedCols?.length || 0} dominated columns\n` +
      `  • Consistency:  ${b.consistency?.score}/100 — ${b.consistency?.inconsistentCols?.length || 0} inconsistent numeric columns\n` +
      `  • Outliers:     ${b.outliers?.score}/100 — ${b.outliers?.avgOutlierPct}% average outlier density`
  }
  // ── Smart insights section ─────────────────────────────────────────────
  const insightsData = dataset.insights || {}
  const insightList  = insightsData.insights || []
  let insightBlock = ''
  if (insightList.length > 0) {
    const lines = insightList.map((ins, i) => `  ${i + 1}. ${ins.title} — ${ins.description}`)
    insightBlock =
      `\nKey insights (auto-generated by the Python ML service):\n` +
      lines.join('\n')
  }
  // ── Trends section ─────────────────────────────────────────────────────
  const trendsData = dataset.trends || {}
  const trendList  = trendsData.trends || []
  const hasTrends  = trendsData.hasDateColumn && trendList.length > 0

  let trendBlock = ''
  if (hasTrends) {
    const lines = trendList.map((t) =>
      `  ${t.column}: ${t.direction} ${t.strength} trend, ` +
      `${t.pctChange > 0 ? '+' : ''}${t.pctChange}% change ` +
      `(from ${t.startValue} to ${t.endValue}, R²=${t.rSquared})`
    )
    trendBlock =
      `\nTime-series trends (linear regression over '${trendsData.dateColumn}', ${trendsData.periodDays} days, ${trendsData.dataPoints} data points):\n` +
      lines.join('\n')
  }
  // ── Clusters section ───────────────────────────────────────────────────
  const clustersData = dataset.clusters || {}
  const clusterList  = clustersData.clusters || []
  const hasClusters  = clustersData.hasClusters && clusterList.length > 0

  let clusterBlock = ''
  if (hasClusters) {
    const lines = clusterList.map((c) => {
      const diffs = (c.differences || []).slice(0, 3).map((d) =>
        `${d.column}=${d.value} (${d.pctOffMean > 0 ? '+' : ''}${d.pctOffMean}% vs avg)`
      ).join(', ')
      return `  ${c.label} — ${c.size} rows (${c.percentage}%)` + (diffs ? `; characteristics: ${diffs}` : '')
    })
    clusterBlock =
      `\nClusters (K-Means with K=${clustersData.k}, scikit-learn, computed over ${clustersData.numericColumns?.length || 0} numeric columns):\n` +
      lines.join('\n')
  }
  // ── Forecast section ───────────────────────────────────────────────────
  const forecastData = dataset.forecast || {}
  const forecastList = forecastData.forecasts || []
  const hasForecast  = forecastData.hasForecast && forecastList.length > 0

  let forecastBlock = ''
  if (hasForecast) {
    const lines = forecastList.map((f) => {
      const last = f.predicted?.[f.predicted.length - 1]
      const ci   = last ? ` (95% CI: ${last.lower}–${last.upper})` : ''
      return `  ${f.column}: ${f.lastActual} now → ${f.lastForecast} forecasted ${forecastData.forecastLength} periods out (${f.pctChange > 0 ? '+' : ''}${f.pctChange}%, ${f.direction})${ci}`
    })
    forecastBlock =
      `\nForecasts (ARIMA(1,1,1), statsmodels, forecasting ${forecastData.forecastLength} periods ahead):\n` +
      lines.join('\n')
  }
  // ── PCA section ────────────────────────────────────────────────────────
  const pcaData = dataset.pca || {}
  const hasPCA  = pcaData.hasPCA && pcaData.explainedVariance

  let pcaBlock = ''
  if (hasPCA) {
    const pc1Top = (pcaData.loadings?.PC1 || []).slice(0, 3).map((l) => `${l.column}=${l.loading}`).join(', ')
    const pc2Top = (pcaData.loadings?.PC2 || []).slice(0, 3).map((l) => `${l.column}=${l.loading}`).join(', ')
    pcaBlock =
      `\nPrincipal Component Analysis (scikit-learn PCA, ${pcaData.totalColumns} columns reduced to 2D):\n` +
      `  PC1 explains ${pcaData.explainedVariance.PC1}% of variance, top loadings: ${pc1Top}\n` +
      `  PC2 explains ${pcaData.explainedVariance.PC2}% of variance, top loadings: ${pc2Top}\n` +
      `  Total: ${pcaData.explainedVariance.total}% of dataset variance captured in 2 dimensions.`
  }

  const sampleRows = (dataset.rows || [])
    .slice(0, 5)
    .map((row, i) =>
      `  Row ${i + 1}: ` +
      dataset.columns.map((c) => `${c}=${JSON.stringify(row[c])}`).join(', ')
    )
    .join('\n')

  return `

━━━ ACTIVE DATASET ━━━
File      : ${dataset.name}
Format    : ${dataset.type?.toUpperCase()}
Total rows: ${dataset.rowCount.toLocaleString()}
Columns   : ${dataset.columns.join(', ')} (${dataset.columns.length} total)
${hasProfile ? '\n>>> The statistics below were computed over the ENTIRE dataset and are AUTHORITATIVE. Use these exact numbers in your answers — do not estimate or recompute. <<<' : ''}
${numericLines.length > 0 ? `\nNumeric columns — full-dataset statistics:\n${numericLines.join('\n')}` : ''}
${categoricalLines.length > 0 ? `\nCategorical columns — full-dataset statistics:\n${categoricalLines.join('\n')}` : ''}
${anomalyBlock}
${correlationBlock}
${qualityBlock}
${insightBlock}
${trendBlock}
${clusterBlock}
${forecastBlock}
${pcaBlock}


Sample data (first 5 rows for reference):
${sampleRows}
━━━━━━━━━━━━━━━━━━━━━━

Use the statistics and anomaly blocks above as ground truth. When asked about averages, totals, counts, distributions, top values, or outliers, quote the exact numbers from above.
If asked about a specific row's values, use the sample rows.
Never invent values — only use what is provided above.`
}