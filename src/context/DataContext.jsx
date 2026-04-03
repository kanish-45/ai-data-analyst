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

// ── CSV Parser ────────────────────────────────────────────────────────────────
export function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length === 0) return { columns: [], rows: [], rowCount: 0 }

  // Auto-detect delimiter: comma, semicolon, or tab
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

  const headers = parseRow(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim())

  // Load ALL rows for stats, but only keep first 10 as sample
  const allRows = lines.slice(1).map((line) => {
    const vals = parseRow(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.replace(/^"|"$/g, '').trim() ?? '']))
  })

  return {
    columns:  headers,
    rows:     allRows.slice(0, 10),  // sample for preview & AI context
    allRows,                          // full rows for stats
    rowCount: allRows.length,
  }
}

// ── JSON Parser ───────────────────────────────────────────────────────────────
export function parseJSON(text) {
  const data = JSON.parse(text)
  const arr  = Array.isArray(data)
    ? data
    : Array.isArray(data?.data) ? data.data : [data]

  if (arr.length === 0) return { columns: [], rows: [], rowCount: 0 }

  // Flatten one level of nesting
  const flat = arr.map((item) => {
    const out = {}
    for (const [k, v] of Object.entries(item)) {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        for (const [k2, v2] of Object.entries(v)) out[`${k}.${k2}`] = v2
      } else {
        out[k] = v
      }
    }
    return out
  })

  const columns = Object.keys(flat[0])
  return {
    columns,
    rows:     flat.slice(0, 10),
    allRows:  flat,
    rowCount: arr.length,
  }
}

// ── Excel Parser (uses xlsx npm package if available) ─────────────────────────
export async function parseExcel(arrayBuffer) {
  try {
    // Dynamically import xlsx — works if user has run: npm install xlsx
    const XLSX = await import('xlsx')
    const wb   = XLSX.read(arrayBuffer, { type: 'array' })

    // Parse first sheet
    const ws      = wb.Sheets[wb.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(ws, { defval: '' })

    if (jsonData.length === 0) return { columns: [], rows: [], rowCount: 0 }

    const columns = Object.keys(jsonData[0])
    return {
      columns,
      rows:     jsonData.slice(0, 10),
      allRows:  jsonData,
      rowCount: jsonData.length,
    }
  } catch {
    // xlsx not installed — return placeholder
    return {
      columns:  ['Run: npm install xlsx — to enable Excel parsing'],
      rows:     [],
      allRows:  [],
      rowCount: 0,
      xlsxMissing: true,
    }
  }
}

// ── Build AI context string from dataset ──────────────────────────────────────
export function buildDatasetContext(dataset) {
  if (!dataset) return ''

  const sourceRows = dataset.allRows || dataset.rows

  // Compute numeric column stats
  const numericStats = dataset.columns
    .map((col) => {
      const vals = sourceRows
        .map((r) => parseFloat(r[col]))
        .filter((v) => !isNaN(v))
      if (vals.length < sourceRows.length * 0.4) return null // mostly non-numeric
      const sum = vals.reduce((a, b) => a + b, 0)
      const avg = sum / vals.length
      const min = Math.min(...vals)
      const max = Math.max(...vals)
      return `  ${col}: min=${min.toFixed(2)}, max=${max.toFixed(2)}, avg=${avg.toFixed(2)}, count=${vals.length}`
    })
    .filter(Boolean)

  // Unique values for categorical columns (top 5)
  const categoricalStats = dataset.columns
    .filter((col) => {
      const vals = sourceRows.map((r) => parseFloat(r[col]))
      return vals.filter((v) => isNaN(v)).length > sourceRows.length * 0.5
    })
    .slice(0, 4)
    .map((col) => {
      const unique = [...new Set(sourceRows.map((r) => String(r[col])))]
        .filter(Boolean)
        .slice(0, 5)
      return `  ${col}: ${unique.join(', ')}${unique.length === 5 ? '…' : ''}`
    })

  // Format sample rows
  const sampleRows = dataset.rows
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
${numericStats.length > 0 ? `\nNumeric column statistics:\n${numericStats.join('\n')}` : ''}
${categoricalStats.length > 0 ? `\nCategorical columns (sample values):\n${categoricalStats.join('\n')}` : ''}

Sample data (first 5 rows):
${sampleRows}
━━━━━━━━━━━━━━━━━━━━━━

Use the above data to answer all user questions accurately and specifically.
Reference actual column names and real values from the dataset in your answers.
If asked for statistics, calculate from the data provided above.`
}