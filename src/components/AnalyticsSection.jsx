import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext'
import { TrendingUp, BarChart3, Info, Loader2 } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// ── Color helpers ────────────────────────────────────────────────────────────
function corrColor(r) {
  const abs   = Math.min(Math.abs(r), 1)
  const alpha = 0.15 + abs * 0.65
  if (r > 0)  return `rgba(34, 211, 238, ${alpha})`
  if (r < 0)  return `rgba(244, 114, 182, ${alpha})`
  return 'rgba(255,255,255,0.05)'
}

// ── Auth helper ──────────────────────────────────────────────────────────────
function getToken() {
  return (
    localStorage.getItem('datamind_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    null
  )
}

export default function AnalyticsSection() {
  const { activeDataset, loadIntoChat } = useData()
  const [loading, setLoading]           = useState(false)
  const [attempted, setAttempted]       = useState(false)

  // ── Auto-load most recent dataset if none is active ─────────────────────
  useEffect(() => {
    if (activeDataset || attempted) return
    const token = getToken()
    if (!token) return

    setAttempted(true)
    setLoading(true)

    ;(async () => {
      try {
        // 1. Get the dataset list (summary)
        const listRes = await fetch(`${API_BASE}/datasets`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!listRes.ok) return
        const { datasets } = await listRes.json()
        if (!datasets?.length) return

        // 2. Fetch the most recent one in full (includes correlations)
        const recent = datasets[0]
        const fullRes = await fetch(`${API_BASE}/datasets/${recent.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!fullRes.ok) return
        const { dataset } = await fullRes.json()
        if (dataset) loadIntoChat(dataset)
      } catch (err) {
        console.warn('[Analytics] auto-load failed:', err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [activeDataset, attempted, loadIntoChat])

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Analytics</h1>
          <p className="text-gray-400 text-sm">Statistical relationships and patterns across your data.</p>
        </div>
        <div className="glass-card rounded-2xl border border-white/5 p-12 text-center">
          <Loader2 size={28} className="text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading your most recent dataset…</p>
        </div>
      </div>
    )
  }

  // ── Empty state (no dataset at all) ────────────────────────────────────
  if (!activeDataset) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Analytics</h1>
          <p className="text-gray-400 text-sm">Statistical relationships and patterns across your data.</p>
        </div>
        <div className="glass-card rounded-2xl border border-white/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 mx-auto mb-4 flex items-center justify-center">
            <BarChart3 size={28} className="text-gray-500" />
          </div>
          <p className="text-white font-semibold mb-2">No dataset loaded</p>
          <p className="text-gray-500 text-sm">Upload a dataset to see correlation analysis.</p>
        </div>
      </div>
    )
  }

  const corr      = activeDataset.correlations || {}
  const columns   = corr.columns  || []
  const matrix    = corr.matrix   || []
  const topPairs  = corr.topPairs || []
  const hasMatrix = columns.length >= 2 && matrix.length > 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Analytics</h1>
        <p className="text-gray-400 text-sm">
          Statistical relationships between numeric columns in <span className="text-cyan-400">{activeDataset.name}</span>
        </p>
      </div>
      {/* Trends card (only shows if dataset has a date column) */}
      {activeDataset.trends?.hasDateColumn && activeDataset.trends?.trends?.length > 0 && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">Time-series trends</h2>
              <p className="text-xs text-gray-500">
                Linear regression over <span className="font-mono">{activeDataset.trends.dateColumn}</span> · {activeDataset.trends.periodDays} days · {activeDataset.trends.dataPoints} points
              </p>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {activeDataset.trends.trends.slice(0, 10).map((t, i) => {
              const dir = t.direction
              const dirColor =
                dir === 'rising'  ? 'text-emerald-400' :
                dir === 'falling' ? 'text-rose-400'    :
                                    'text-gray-500'
              const arrow =
                dir === 'rising'  ? '↗' :
                dir === 'falling' ? '↘' : '→'
              return (
                <div key={i} className="px-6 py-3 flex items-center gap-4">
                  <div className={'text-xl ' + dirColor}>{arrow}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-mono">{t.column}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.summary}</p>
                  </div>
                  <div className={'px-3 py-1.5 rounded-lg font-mono text-sm font-semibold tabular-nums ' +
                    (dir === 'rising'  ? 'bg-emerald-500/15 text-emerald-400' :
                     dir === 'falling' ? 'bg-rose-500/15 text-rose-400'       :
                                         'bg-gray-500/15 text-gray-400')}>
                    {t.pctChange > 0 ? '+' : ''}{t.pctChange}%
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Strongest correlations card */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <TrendingUp size={18} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">Strongest correlations</h2>
            <p className="text-xs text-gray-500">Pairwise Pearson correlation, ranked by absolute strength</p>
          </div>
        </div>

        {topPairs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">
            {columns.length < 2
              ? `This dataset has only ${columns.length} numeric column${columns.length === 1 ? '' : 's'} — at least 2 are needed.`
              : 'No meaningful correlations found (all pairs are below the 0.10 threshold).'}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {topPairs.slice(0, 10).map((p, i) => (
              <div key={i} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="font-mono">{p.col1}</span>
                    <span className="text-gray-500"> ↔ </span>
                    <span className="font-mono">{p.col2}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{p.strength} {p.direction}</p>
                </div>
                <div
                  className="px-3 py-1.5 rounded-lg font-mono text-sm font-semibold tabular-nums"
                  style={{ backgroundColor: corrColor(p.correlation), color: '#fff' }}
                >
                  {p.correlation > 0 ? '+' : ''}{p.correlation.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Correlation matrix heatmap */}
      {hasMatrix && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <BarChart3 size={18} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">Correlation matrix</h2>
              <p className="text-xs text-gray-500">Cyan = positive, pink = negative, intensity = strength</p>
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th></th>
                  {columns.map((c) => (
                    <th key={c} className="px-3 py-2 text-xs text-gray-400 font-mono whitespace-nowrap">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {columns.map((rowCol, i) => (
                  <tr key={rowCol}>
                    <th className="px-3 py-2 text-xs text-gray-400 font-mono text-right whitespace-nowrap">{rowCol}</th>
                    {columns.map((_, j) => {
                      const r = matrix[i]?.[j] ?? 0
                      const isDiag = i === j
                      return (
                        <td
                          key={j}
                          className="border border-white/5 text-center text-xs font-mono font-semibold text-white"
                          style={{
                            backgroundColor: isDiag ? 'rgba(255,255,255,0.08)' : corrColor(r),
                            minWidth: 64,
                            height: 44,
                          }}
                        >
                          {isDiag ? '—' : (r > 0 ? '+' : '') + r.toFixed(2)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/3 border border-white/5">
        <Info size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          Correlation measures how two columns move together. Values range from −1 (perfect inverse) to +1 (perfect alignment).
          Near 0 means no linear relationship. Computed via Python pandas (Pearson method) over your full dataset.
        </p>
      </div>
    </div>
  )
}