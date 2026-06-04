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

Sample data (first 5 rows for reference):
${sampleRows}
━━━━━━━━━━━━━━━━━━━━━━

Use the statistics block above as ground truth. When asked about averages, totals, counts, distributions, or top values, quote the exact numbers from the statistics block.
If asked about a specific row's values, use the sample rows.
Never invent values — only use what is provided above.`
}