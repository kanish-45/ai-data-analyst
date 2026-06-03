import { useState, useMemo } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import {
  Database, Upload, BarChart3 as BarIcon,
  TrendingUp, PieChart as PieIcon, Hash, Type
} from 'lucide-react'
import { useData } from '../context/DataContext'

const PALETTE = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#f472b6', '#a3e635']

// ── Helpers ───────────────────────────────────────────────────────────────────

function isNumericValue(v) {
  if (v === null || v === undefined || v === '') return false
  const n = parseFloat(v)
  return !isNaN(n) && isFinite(n)
}

function detectColumnType(rows, col) {
  const sample = rows.slice(0, 100)
  const numeric = sample.filter((r) => isNumericValue(r[col])).length
  return numeric / sample.length >= 0.7 ? 'numeric' : 'categorical'
}

function getNumericValues(rows, col) {
  return rows.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v) && isFinite(v))
}

function getCategoricalCounts(rows, col, limit = 8) {
  const counts = {}
  for (const r of rows) {
    const v = r[col]
    if (v === null || v === undefined || v === '') continue
    const key = String(v).trim()
    if (!key) continue
    counts[key] = (counts[key] || 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }))
}

// Histogram bins for a numeric column
function buildHistogram(values, binCount = 10) {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return [{ bin: min.toFixed(1), count: values.length }]

  const width = (max - min) / binCount
  const bins = Array.from({ length: binCount }, (_, i) => ({
    bin:   `${(min + i * width).toFixed(1)}`,
    range: [min + i * width, min + (i + 1) * width],
    count: 0,
  }))
  for (const v of values) {
    let idx = Math.floor((v - min) / width)
    if (idx >= binCount) idx = binCount - 1
    bins[idx].count++
  }
  return bins.map(({ bin, count }) => ({ bin, count }))
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass border border-white/10 rounded-xl px-4 py-3 text-sm">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill }} />
          <span className="text-gray-400 capitalize">{entry.name}:</span>
          <span className="text-white font-semibold">
            {typeof entry.value === 'number' && entry.value > 999
              ? entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function ChartCard({ title, subtitle, badge, children }) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-white/5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-white font-bold text-base mb-1">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        {badge && (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {badge}
          </span>
        )}
      </div>
      <div className="h-72">{children}</div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onNavigateToUpload }) {
  return (
    <div className="glass-card rounded-2xl p-12 border border-white/5 text-center">
      <div className="inline-flex w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 items-center justify-center mb-4">
        <BarIcon size={26} className="text-cyan-400" />
      </div>
      <h2 className="text-white font-bold text-lg mb-2">No dataset selected</h2>
      <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
        Upload a CSV, Excel, or JSON file to see charts built from your real data — automatically.
      </p>
      <button onClick={onNavigateToUpload}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
        <Upload size={14} /> Upload a dataset
      </button>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ChartsSection({ onNavigateToUpload }) {
  const { activeDataset, datasets, loadIntoChat } = useData()
  const [selectedNumericCol,     setSelectedNumericCol]     = useState(null)
  const [selectedCategoricalCol, setSelectedCategoricalCol] = useState(null)

  // Pick whichever is "active" or fall back to the most recent dataset
  const dataset = activeDataset || datasets[0]

  // Analyze columns
  const { numericColumns, categoricalColumns, rows } = useMemo(() => {
    if (!dataset) return { numericColumns: [], categoricalColumns: [], rows: [] }
    const rowsSrc = dataset.allRows || dataset.rows || []
    const numeric = []
    const categorical = []
    for (const col of dataset.columns) {
      const t = detectColumnType(rowsSrc, col)
      if (t === 'numeric') numeric.push(col)
      else                 categorical.push(col)
    }
    return { numericColumns: numeric, categoricalColumns: categorical, rows: rowsSrc }
  }, [dataset])

  // Default selections
  const numericCol     = selectedNumericCol     || numericColumns[0]     || null
  const categoricalCol = selectedCategoricalCol || categoricalColumns[0] || null

  // Compute chart data
  const numericValues   = useMemo(() => numericCol ? getNumericValues(rows, numericCol) : [], [rows, numericCol])
  const histogramData   = useMemo(() => buildHistogram(numericValues),                         [numericValues])
  const categoryData    = useMemo(() => categoricalCol ? getCategoricalCounts(rows, categoricalCol) : [], [rows, categoricalCol])

  // Multi-numeric comparison (first 4 numeric cols)
  const multiNumericData = useMemo(() => {
    if (numericColumns.length < 2) return null
    const cols = numericColumns.slice(0, 4)
    // Bucket rows into groups by categorical column, OR by index in chunks of N
    if (categoricalCol) {
      const groups = {}
      for (const r of rows) {
        const key = String(r[categoricalCol] || '').trim()
        if (!key) continue
        if (!groups[key]) groups[key] = Object.fromEntries(cols.map((c) => [c, []]))
        for (const c of cols) {
          const v = parseFloat(r[c])
          if (!isNaN(v)) groups[key][c].push(v)
        }
      }
      return Object.entries(groups)
        .sort((a, b) => Object.values(b[1])[0].length - Object.values(a[1])[0].length)
        .slice(0, 8)
        .map(([name, byCol]) => {
          const out = { name }
          for (const c of cols) {
            const vs = byCol[c]
            out[c] = vs.length > 0 ? (vs.reduce((a, b) => a + b, 0) / vs.length) : 0
          }
          return out
        })
    }
    // No categorical: bucket rows into chunks of ~10
    const chunkSize = Math.max(1, Math.ceil(rows.length / 10))
    const chunks = []
    for (let i = 0; i < rows.length; i += chunkSize) {
      const slice = rows.slice(i, i + chunkSize)
      const out = { name: `Rows ${i + 1}–${Math.min(i + chunkSize, rows.length)}` }
      for (const c of cols) {
        const vals = slice.map((r) => parseFloat(r[c])).filter((v) => !isNaN(v))
        out[c] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
      }
      chunks.push(out)
      if (chunks.length >= 10) break
    }
    return chunks
  }, [rows, numericColumns, categoricalCol])

  // No dataset → empty state
  if (!dataset) {
    return <EmptyState onNavigateToUpload={onNavigateToUpload} />
  }

  // No usable data
  if (rows.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 border border-white/5 text-center">
        <Database size={36} className="text-gray-700 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">This dataset has no rows</p>
        <p className="text-gray-600 text-xs mt-1">Try uploading another file.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Active dataset banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-cyan-500/8 border border-cyan-500/20">
        <div className="flex items-center gap-3 min-w-0">
          <Database size={18} className="text-cyan-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-white font-semibold truncate">{dataset.name}</p>
            <p className="text-xs text-gray-500">
              {dataset.rowCount.toLocaleString()} rows · {dataset.columns.length} columns ·
              {' '}{numericColumns.length} numeric · {categoricalColumns.length} categorical
            </p>
          </div>
        </div>
        {datasets.length > 1 && (
          <select
            value={dataset.id}
            onChange={(e) => {
              const d = datasets.find((x) => x.id === e.target.value)
              if (d) loadIntoChat(d)
            }}
            className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/40"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0a0f1e]">{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Column type warning */}
      {numericColumns.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20 text-sm text-amber-300">
          No numeric columns detected in this dataset. Histogram and trend charts need at least one numeric column.
        </div>
      )}

      {/* Histogram of a numeric column */}
      {numericColumns.length > 0 && (
        <ChartCard
          title={`Distribution of ${numericCol}`}
          subtitle="How values are spread across the column"
          badge={`${numericValues.length.toLocaleString()} values`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Hash size={12} className="text-violet-400" />
            <span className="text-xs text-gray-500">Numeric column:</span>
            <select
              value={numericCol}
              onChange={(e) => setSelectedNumericCol(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500/40"
            >
              {numericColumns.map((c) => (
                <option key={c} value={c} className="bg-[#0a0f1e]">{c}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={histogramData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="bin" stroke="#6b7280" style={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Category counts */}
      {categoricalColumns.length > 0 && categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title={`Top values in ${categoricalCol}`}
            subtitle="Most common categories"
            badge={`${categoryData.length} shown`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Type size={12} className="text-cyan-400" />
              <span className="text-xs text-gray-500">Categorical column:</span>
              <select
                value={categoricalCol}
                onChange={(e) => setSelectedCategoricalCol(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500/40"
              >
                {categoricalColumns.map((c) => (
                  <option key={c} value={c} className="bg-[#0a0f1e]">{c}</option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#6b7280" style={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} stroke="#6b7280" style={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Share of categories"
            subtitle={`Distribution by ${categoricalCol}`}
            badge="Pie"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* Multi-numeric grouped comparison */}
      {multiNumericData && multiNumericData.length > 1 && (
        <ChartCard
          title={categoricalCol ? `Numeric metrics by ${categoricalCol}` : 'Numeric trends across rows'}
          subtitle={categoricalCol
            ? `Average of each numeric column, grouped by ${categoricalCol}`
            : 'Average of each numeric column across row buckets'}
          badge={`${numericColumns.slice(0, 4).length} metrics`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiNumericData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#6b7280" style={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {numericColumns.slice(0, 4).map((c, i) => (
                <Line key={c} type="monotone" dataKey={c} stroke={PALETTE[i % PALETTE.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Single numeric area trend */}
      {numericColumns.length > 0 && rows.length > 1 && (
        <ChartCard
          title={`${numericCol} — trend across rows`}
          subtitle="The column's value as it appears in order through the dataset"
          badge="Trend"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows.slice(0, 200).map((r, i) => ({ index: i + 1, value: parseFloat(r[numericCol]) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="index" stroke="#6b7280" style={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" style={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

    </div>
  )
}