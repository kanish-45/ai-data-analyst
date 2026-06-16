import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext'
import { TrendingUp, BarChart3, Info, Loader2, Sparkles } from 'lucide-react'

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
      {/* PCA card (only shows if PCA was computed) */}
      {activeDataset.pca?.hasPCA && activeDataset.pca?.scatter?.points?.length > 0 && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BarChart3 size={18} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">Principal Component Analysis</h2>
              <p className="text-xs text-gray-500">
                {activeDataset.pca.totalColumns} numeric columns reduced to 2D · {activeDataset.pca.explainedVariance?.total}% variance explained · scikit-learn PCA
              </p>
            </div>
          </div>

          {/* Scatter plot */}
          <div className="p-6 border-b border-white/5">
            <p className="text-xs text-gray-500 mb-3">
              <span className="font-mono text-blue-400">PC1</span> ({activeDataset.pca.explainedVariance?.PC1}% variance) · <span className="font-mono text-blue-400">PC2</span> ({activeDataset.pca.explainedVariance?.PC2}% variance)
            </p>
            <svg viewBox="0 0 400 280" className="w-full h-64">
              {(() => {
                const points = activeDataset.pca.scatter.points
                const xs = points.map((p) => p.x)
                const ys = points.map((p) => p.y)
                const xMin = Math.min(...xs), xMax = Math.max(...xs)
                const yMin = Math.min(...ys), yMax = Math.max(...ys)
                const xRange = xMax - xMin || 1
                const yRange = yMax - yMin || 1
                return points.map((p, i) => {
                  const cx = 30 + ((p.x - xMin) / xRange) * 350
                  const cy = 250 - ((p.y - yMin) / yRange) * 220
                  return (
                    <circle key={i} cx={cx} cy={cy} r="4"
                      fill="#60a5fa" opacity="0.6"
                      stroke="#0f172a" strokeWidth="1" />
                  )
                })
              })()}
              {/* Axes */}
              <line x1="30" y1="250" x2="380" y2="250" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="30" y1="30"  x2="30"  y2="250" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              {/* Axis labels */}
              <text x="200" y="275" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace" textAnchor="middle">PC1</text>
              <text x="15" y="140" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 15 140)">PC2</text>
            </svg>
          </div>

          {/* Loadings: which columns drive each PC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-blue-400 mb-2">
                PC1 — {activeDataset.pca.explainedVariance?.PC1}% of variance
              </p>
              <p className="text-xs text-gray-500 mb-2">Top columns driving this axis:</p>
              <div className="space-y-1">
                {(activeDataset.pca.loadings?.PC1 || []).slice(0, 5).map((l, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-gray-300 flex-1 truncate">{l.column}</span>
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={'h-full ' + (l.loading >= 0 ? 'bg-blue-400' : 'bg-rose-400')}
                           style={{ width: `${Math.round(l.absLoading * 100)}%` }} />
                    </div>
                    <span className={'font-mono tabular-nums w-12 text-right ' +
                      (l.loading >= 0 ? 'text-blue-400' : 'text-rose-400')}>
                      {l.loading > 0 ? '+' : ''}{l.loading}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-blue-400 mb-2">
                PC2 — {activeDataset.pca.explainedVariance?.PC2}% of variance
              </p>
              <p className="text-xs text-gray-500 mb-2">Top columns driving this axis:</p>
              <div className="space-y-1">
                {(activeDataset.pca.loadings?.PC2 || []).slice(0, 5).map((l, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-gray-300 flex-1 truncate">{l.column}</span>
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={'h-full ' + (l.loading >= 0 ? 'bg-blue-400' : 'bg-rose-400')}
                           style={{ width: `${Math.round(l.absLoading * 100)}%` }} />
                    </div>
                    <span className={'font-mono tabular-nums w-12 text-right ' +
                      (l.loading >= 0 ? 'text-blue-400' : 'text-rose-400')}>
                      {l.loading > 0 ? '+' : ''}{l.loading}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interpretation footer */}
          <div className="px-6 py-3 border-t border-white/5 bg-blue-500/5">
            <p className="text-xs text-gray-400 leading-relaxed">
              {activeDataset.pca.interpretation}
            </p>
          </div>
        </div>
      )}
      {/* K-Means clustering card (only shows if clusters were computed) */}
      {activeDataset.clusters?.hasClusters && activeDataset.clusters?.clusters?.length > 0 && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Sparkles size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">Clusters (K-Means)</h2>
              <p className="text-xs text-gray-500">
                {activeDataset.clusters.k} clusters discovered across {activeDataset.clusters.numericColumns?.length || 0} numeric columns · scikit-learn
              </p>
            </div>
          </div>

          {/* Scatter plot */}
          <div className="p-6 border-b border-white/5">
            <p className="text-xs text-gray-500 mb-3">
              <span className="font-mono">{activeDataset.clusters.scatter?.xColumn}</span> (x-axis) · <span className="font-mono">{activeDataset.clusters.scatter?.yColumn}</span> (y-axis)
            </p>
            <svg viewBox="0 0 400 280" className="w-full h-64">
              {(() => {
                const points = activeDataset.clusters.scatter?.points || []
                if (points.length === 0) return null
                const xs = points.map((p) => p.x)
                const ys = points.map((p) => p.y)
                const xMin = Math.min(...xs), xMax = Math.max(...xs)
                const yMin = Math.min(...ys), yMax = Math.max(...ys)
                const xRange = xMax - xMin || 1
                const yRange = yMax - yMin || 1
                const colors = ['#22d3ee', '#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#fb7185']
                return points.map((p, i) => {
                  const cx = 30 + ((p.x - xMin) / xRange) * 350
                  const cy = 250 - ((p.y - yMin) / yRange) * 220
                  return (
                    <circle
                      key={i}
                      cx={cx} cy={cy} r="5"
                      fill={colors[p.cluster % colors.length]}
                      opacity="0.75"
                      stroke="#0f172a" strokeWidth="1"
                    />
                  )
                })
              })()}
              {/* Axes */}
              <line x1="30" y1="250" x2="380" y2="250" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <line x1="30" y1="30"  x2="30"  y2="250" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            </svg>
          </div>

          {/* Cluster details */}
          <div className="divide-y divide-white/5">
            {activeDataset.clusters.clusters.map((c, i) => {
              const colors = ['#22d3ee', '#f472b6', '#a78bfa', '#fbbf24', '#34d399', '#fb7185']
              const color  = colors[c.clusterId % colors.length]
              return (
                <div key={i} className="px-6 py-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <p className="text-sm font-semibold text-white flex-1">{c.label}</p>
                    <span className="text-xs text-gray-500 tabular-nums">{c.size} rows · {c.percentage}%</span>
                  </div>
                  {c.differences && c.differences.length > 0 && (
                    <div className="ml-6 space-y-0.5">
                      {c.differences.slice(0, 3).map((d, j) => (
                        <p key={j} className="text-xs text-gray-500">
                          <span className="font-mono">{d.column}</span>: {d.value} —{' '}
                          <span className={d.direction === 'above' ? 'text-emerald-400' : 'text-rose-400'}>
                            {d.pctOffMean > 0 ? '+' : ''}{d.pctOffMean}% vs avg
                          </span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {/* Forecast card (only shows if forecasts were computed) */}
      {activeDataset.forecast?.hasForecast && activeDataset.forecast?.forecasts?.length > 0 && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-bold">Forecast (ARIMA)</h2>
              <p className="text-xs text-gray-500">
                Predicting {activeDataset.forecast.forecastLength} periods ahead · statsmodels ARIMA(1,1,1) with 95% confidence intervals
              </p>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {activeDataset.forecast.forecasts.map((f, idx) => {
              const dir       = f.direction
              const dirColor  = dir === 'rising' ? 'text-emerald-400' : dir === 'falling' ? 'text-rose-400' : 'text-gray-400'
              const arrow     = dir === 'rising' ? '↗' : dir === 'falling' ? '↘' : '→'
              const chipColor = dir === 'rising' ? 'bg-emerald-500/15 text-emerald-400' :
                                dir === 'falling' ? 'bg-rose-500/15 text-rose-400' :
                                                    'bg-gray-500/15 text-gray-400'

              // Build the chart: combine historical + predicted into one timeline
              const allPoints = [
                ...f.historical.map((p) => ({ ...p, value: p.value })),
                ...f.predicted.map((p) => ({ ...p, value: p.value })),
              ]
              const allVals = [
                ...f.historical.map((p) => p.value),
                ...f.predicted.flatMap((p) => [p.value, p.lower, p.upper]),
              ]
              const yMin   = Math.min(...allVals)
              const yMax   = Math.max(...allVals)
              const yRange = yMax - yMin || 1
              const W = 600, H = 180, PAD = 8
              const xStep = (W - PAD * 2) / Math.max(allPoints.length - 1, 1)
              const yOf   = (v) => H - PAD - ((v - yMin) / yRange) * (H - PAD * 2)

              // Build path for historical line
              const histPath = f.historical.map((p, i) =>
                `${i === 0 ? 'M' : 'L'} ${PAD + i * xStep},${yOf(p.value)}`).join(' ')

              // Build path for predicted line (continues from last historical point)
              const startX  = PAD + (f.historical.length - 1) * xStep
              const startY  = yOf(f.historical[f.historical.length - 1].value)
              const predPath = `M ${startX},${startY} ` + f.predicted.map((p, i) =>
                `L ${PAD + (f.historical.length + i) * xStep},${yOf(p.value)}`).join(' ')

              // Build confidence-interval band
              const ciTopPath = f.predicted.map((p, i) =>
                `${i === 0 ? 'M' : 'L'} ${PAD + (f.historical.length + i) * xStep},${yOf(p.upper)}`).join(' ')
              const ciBotPath = [...f.predicted].reverse().map((p, i) => {
                const realIdx = f.predicted.length - 1 - i
                return `L ${PAD + (f.historical.length + realIdx) * xStep},${yOf(p.lower)}`
              }).join(' ')
              const ciBand = `${ciTopPath} ${ciBotPath} Z`

              return (
                <div key={idx} className="px-6 py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={'text-xl ' + dirColor}>{arrow}</div>
                    <p className="text-sm font-mono text-white flex-1">{f.column}</p>
                    <div className={'px-3 py-1.5 rounded-lg font-mono text-xs font-semibold tabular-nums ' + chipColor}>
                      {f.pctChange > 0 ? '+' : ''}{f.pctChange}%
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    Current: <span className="text-white font-mono">{f.lastActual}</span>
                    {' → Forecast: '}
                    <span className="text-white font-mono">{f.lastForecast}</span>
                  </p>
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 180 }}>
                    {/* Confidence band */}
                    <path d={ciBand} fill="rgba(167, 139, 250, 0.15)" stroke="none" />
                    {/* Historical line */}
                    <path d={histPath} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                    {/* Predicted line (dashed) */}
                    <path d={predPath} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 3" />
                    {/* Divider line at forecast boundary */}
                    <line
                      x1={PAD + (f.historical.length - 1) * xStep}
                      y1={PAD}
                      x2={PAD + (f.historical.length - 1) * xStep}
                      y2={H - PAD}
                      stroke="rgba(167, 139, 250, 0.3)"
                      strokeDasharray="2 4"
                    />
                  </svg>
                </div>
              )
            })}
          </div>

          <div className="px-6 py-3 border-t border-white/5 bg-violet-500/5">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="text-violet-400">━━━</span> historical &nbsp;&nbsp;
              <span className="text-violet-400">─ ─ ─</span> forecast &nbsp;&nbsp;
              <span className="text-violet-400/40">▓</span> 95% confidence interval
            </p>
          </div>
        </div>
      )}
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