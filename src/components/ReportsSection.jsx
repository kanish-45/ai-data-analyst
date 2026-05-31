import { useState } from 'react'
import {
  FileText, Download, Eye, Trash2,
  Plus, Search, CheckCircle, Clock,
  AlertCircle, Star, StarOff, BarChart3,
  TrendingUp, Database, Brain, Calendar,
  RefreshCw, Share2, Loader2, X
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

// ── Sample reports ────────────────────────────────────────────────────────────
const SAMPLE_REPORTS = [
  {
    id: 1,
    title:   'Q4 2024 Revenue Analysis',
    desc:    'Comprehensive breakdown of Q4 revenue trends, top products, and regional performance.',
    type:    'Revenue',
    status:  'ready',
    date:    'Mar 25, 2025',
    size:    '2.4 MB',
    pages:   18,
    starred: true,
    icon:    TrendingUp,
    color:   'text-cyan-400',
    bg:      'bg-cyan-500/10',
  },
  {
    id: 2,
    title:   'Customer Segmentation Report',
    desc:    'AI-generated customer clusters based on purchase behavior and demographics.',
    type:    'AI Insight',
    status:  'ready',
    date:    'Mar 22, 2025',
    size:    '1.8 MB',
    pages:   12,
    starred: true,
    icon:    Brain,
    color:   'text-violet-400',
    bg:      'bg-violet-500/10',
  },
  {
    id: 3,
    title:   'Marketing Channel Performance',
    desc:    'ROI analysis across paid, organic, email, and social media channels.',
    type:    'Marketing',
    status:  'ready',
    date:    'Mar 20, 2025',
    size:    '3.1 MB',
    pages:   24,
    starred: false,
    icon:    BarChart3,
    color:   'text-emerald-400',
    bg:      'bg-emerald-500/10',
  },
  {
    id: 4,
    title:   'Inventory Forecast — April 2025',
    desc:    'Predictive inventory needs based on seasonal patterns and recent trends.',
    type:    'Forecast',
    status:  'generating',
    date:    'Mar 27, 2025',
    size:    '—',
    pages:   '—',
    starred: false,
    icon:    Database,
    color:   'text-amber-400',
    bg:      'bg-amber-500/10',
  },
  {
    id: 5,
    title:   'User Retention Deep Dive',
    desc:    'Cohort analysis and churn risk identification for the past 6 months.',
    type:    'AI Insight',
    status:  'ready',
    date:    'Mar 15, 2025',
    size:    '1.2 MB',
    pages:   9,
    starred: false,
    icon:    Brain,
    color:   'text-violet-400',
    bg:      'bg-violet-500/10',
  },
  {
    id: 6,
    title:   'Finance Summary — Feb 2025',
    desc:    'Monthly P&L summary with variance analysis vs budget.',
    type:    'Finance',
    status:  'error',
    date:    'Mar 5, 2025',
    size:    '—',
    pages:   '—',
    starred: false,
    icon:    FileText,
    color:   'text-rose-400',
    bg:      'bg-rose-500/10',
  },
]

const REPORT_TYPES  = ['All', 'Revenue', 'AI Insight', 'Marketing', 'Forecast', 'Finance']

// ── PDF Generator ─────────────────────────────────────────────────────────────
function generatePDF(report, dataset, user) {
  const now      = new Date().toLocaleString()
  const userName = user?.nickname || user?.name || 'DataMind User'

  // Build dataset section
  const datasetSection = dataset
    ? `
      <div class="section">
        <h2>Dataset Overview</h2>
        <table>
          <tr><th>File Name</th><td>${dataset.name}</td></tr>
          <tr><th>Format</th><td>${dataset.type?.toUpperCase()}</td></tr>
          <tr><th>Total Rows</th><td>${(dataset.rowCount || 0).toLocaleString()}</td></tr>
          <tr><th>Total Columns</th><td>${dataset.columns?.length || 0}</td></tr>
          <tr><th>File Size</th><td>${dataset.size}</td></tr>
        </table>
        ${dataset.columns?.length > 0 ? `
          <h3>Columns</h3>
          <p class="columns">${dataset.columns.join(' · ')}</p>
        ` : ''}
        ${(dataset.rows || dataset.sampleRows || []).length > 0 ? `
          <h3>Sample Data (first ${Math.min(5, (dataset.rows || dataset.sampleRows).length)} rows)</h3>
          <table class="data-table">
            <thead>
              <tr>${dataset.columns.map((c) => `<th>${c}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${(dataset.rows || dataset.sampleRows).slice(0, 5).map((row) =>
                `<tr>${dataset.columns.map((c) => `<td>${String(row[c] ?? '')}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
        ` : ''}
      </div>
    `
    : '<div class="section"><p class="no-data">No dataset loaded. Upload a dataset and ask AI questions to generate data-driven insights.</p></div>'

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${report.title} — DataMind AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; background: #fff; }

    .cover {
      background: linear-gradient(135deg, #0a0f1e 0%, #0d1530 100%);
      color: white;
      padding: 60px 50px;
      min-height: 200px;
    }
    .cover-logo { font-size: 13px; color: #22d3ee; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 40px; }
    .cover-title { font-size: 32px; font-weight: 800; margin-bottom: 12px; line-height: 1.2; }
    .cover-subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 30px; }
    .cover-meta { display: flex; gap: 30px; font-size: 12px; color: #64748b; }
    .cover-meta span { display: flex; flex-direction: column; gap: 3px; }
    .cover-meta strong { color: #94a3b8; font-size: 13px; }

    .content { padding: 40px 50px; max-width: 900px; }

    .section { margin-bottom: 35px; page-break-inside: avoid; }
    .section h2 {
      font-size: 18px; font-weight: 700; color: #0a0f1e;
      border-bottom: 2px solid #22d3ee; padding-bottom: 8px; margin-bottom: 16px;
    }
    .section h3 { font-size: 14px; font-weight: 600; color: #374151; margin: 16px 0 8px; }

    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
    th { text-align: left; padding: 10px 14px; background: #f8fafc; color: #475569; font-weight: 600; border: 1px solid #e2e8f0; width: 35%; }
    td { padding: 10px 14px; border: 1px solid #e2e8f0; color: #1e293b; }

    .data-table th { width: auto; font-size: 11px; background: #0a0f1e; color: #94a3b8; }
    .data-table td { font-size: 11px; font-family: monospace; }
    .data-table tr:nth-child(even) td { background: #f8fafc; }

    .columns { font-size: 12px; color: #475569; line-height: 2; background: #f8fafc; padding: 12px; border-radius: 8px; }
    .no-data { color: #94a3b8; font-style: italic; font-size: 13px; }

    .insight-box {
      background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
      border-left: 4px solid #22d3ee;
      padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 12px;
    }
    .insight-box p { font-size: 13px; color: #0369a1; line-height: 1.6; }

    .footer {
      margin-top: 50px; padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px; color: #94a3b8;
      display: flex; justify-content: space-between;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cover { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- Cover -->
  <div class="cover">
    <div class="cover-logo">⬡ DataMind AI</div>
    <div class="cover-title">${report.title}</div>
    <div class="cover-subtitle">${report.desc}</div>
    <div class="cover-meta">
      <span><strong>Generated by</strong>${userName}</span>
      <span><strong>Date</strong>${now}</span>
      <span><strong>Type</strong>${report.type}</span>
      ${dataset ? `<span><strong>Dataset</strong>${dataset.name}</span>` : ''}
    </div>
  </div>

  <!-- Content -->
  <div class="content">

    <!-- Report Summary -->
    <div class="section">
      <h2>Report Summary</h2>
      <table>
        <tr><th>Report Title</th><td>${report.title}</td></tr>
        <tr><th>Report Type</th><td>${report.type}</td></tr>
        <tr><th>Generated On</th><td>${now}</td></tr>
        <tr><th>Generated By</th><td>${userName}</td></tr>
        <tr><th>Status</th><td>✅ Complete</td></tr>
      </table>
    </div>

    <!-- Key Insights -->
    <div class="section">
      <h2>Key Insights</h2>
      <div class="insight-box">
        <p>📊 This report was generated by DataMind AI based on ${dataset ? `the dataset <strong>${dataset.name}</strong> containing ${(dataset.rowCount || 0).toLocaleString()} rows across ${dataset.columns?.length || 0} columns` : 'your uploaded data'}.</p>
      </div>
      <div class="insight-box">
        <p>🔍 Use the AI Chat feature to ask specific questions about your data and get instant, context-aware answers backed by your real dataset.</p>
      </div>
      <div class="insight-box">
        <p>📈 Upload more datasets and analyze them with DataMind AI to uncover deeper patterns, trends, and business insights automatically.</p>
      </div>
    </div>

    <!-- Dataset Section -->
    <div class="section">
      <h2>Dataset Information</h2>
      ${datasetSection}
    </div>

    <!-- How to Use -->
    <div class="section">
      <h2>Next Steps</h2>
      <table>
        <tr><th>1. Ask AI Questions</th><td>Go to AI Chat and ask questions about your data in plain English</td></tr>
        <tr><th>2. Explore Charts</th><td>Visit the Charts section to see visualizations of your data</td></tr>
        <tr><th>3. Track Analytics</th><td>Use Analytics to monitor trends, funnels, and cohort retention</td></tr>
        <tr><th>4. Export More Reports</th><td>Generate reports for different datasets and time periods</td></tr>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <span>Generated by DataMind AI · ${now}</span>
      <span>Confidential — For internal use only</span>
    </div>

  </div>

</body>
</html>`

  // Open in new tab and trigger print dialog (browser will save as PDF)
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
  }, 500)
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'ready') return (
    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
      <CheckCircle size={11} /> Ready
    </span>
  )
  if (status === 'generating') return (
    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-medium">
      <RefreshCw size={11} className="animate-spin" /> Generating
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-medium">
      <AlertCircle size={11} /> Failed
    </span>
  )
}

// ── Summary stats ─────────────────────────────────────────────────────────────
const SUMMARY_STATS = [
  { label: 'Total Reports',         value: '6',  icon: FileText,   color: 'text-cyan-400',   bg: 'from-cyan-500/15 to-cyan-500/5',     border: 'border-cyan-500/20'   },
  { label: 'Generated This Month',  value: '6',  icon: Plus,       color: 'text-emerald-400',bg: 'from-emerald-500/15 to-emerald-500/5',border: 'border-emerald-500/20'},
  { label: 'Ready to Download',     value: '4',  icon: Download,   color: 'text-violet-400', bg: 'from-violet-500/15 to-violet-500/5', border: 'border-violet-500/20' },
  { label: 'Starred',               value: '2',  icon: Star,       color: 'text-amber-400',  bg: 'from-amber-500/15 to-amber-500/5',   border: 'border-amber-500/20'  },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportsSection() {
  const { activeDataset } = useData()
  const { user }          = useAuth()

  const [activeType,    setActiveType]    = useState('All')
  const [search,        setSearch]        = useState('')
  const [starred,       setStarred]       = useState({ 1: true, 2: true })
  const [showGenerate,  setShowGenerate]  = useState(false)
  const [downloading,   setDownloading]   = useState(null)
  const [previewReport, setPreviewReport] = useState(null)

  const filtered = SAMPLE_REPORTS.filter((r) => {
    const matchType   = activeType === 'All' || r.type === activeType
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
                        r.desc.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const toggleStar = (id) => setStarred((prev) => ({ ...prev, [id]: !prev[id] }))

  // ── Handle PDF download ───────────────────────────────────────────────────
  const handleDownload = async (report) => {
    setDownloading(report.id)
    try {
      await new Promise((r) => setTimeout(r, 600)) // brief delay for UX
      generatePDF(report, activeDataset, user)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* Summary Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {SUMMARY_STATS.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={'rounded-2xl p-5 bg-gradient-to-br ' + s.bg + ' border ' + s.border + ' hover:scale-[1.02] transition-all duration-300'}>
              <div className={'w-9 h-9 rounded-xl glass flex items-center justify-center mb-3 ' + s.color}>
                <Icon size={18} />
              </div>
              <div className="text-2xl font-extrabold text-white mb-1">{s.value}</div>
              <div className="text-sm text-gray-400">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Active dataset notice */}
      {activeDataset && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/8 border border-cyan-500/20">
          <Database size={15} className="text-cyan-400 flex-shrink-0" />
          <p className="text-xs text-cyan-400">
            Active dataset: <span className="text-white font-semibold">{activeDataset.name}</span>
            <span className="text-gray-500 ml-2">— PDF reports will include your dataset's data</span>
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search reports…"
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 glass border border-white/8 rounded-xl p-1">
            {REPORT_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ' +
                  (activeType === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-white')}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={15} /> Generate Report
          </button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((report) => {
          const Icon      = report.icon
          const isStarred = starred[report.id]
          const isDownloading = downloading === report.id

          return (
            <div key={report.id} className="glass-card rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden group">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className={'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ' + report.bg}>
                      <Icon size={18} className={report.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-white text-sm leading-tight">{report.title}</h3>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/8">{report.type}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStar(report.id)}
                    className={'p-1.5 rounded-lg transition-colors flex-shrink-0 ' + (isStarred ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400')}
                  >
                    {isStarred ? <Star size={15} fill="currentColor" /> : <StarOff size={15} />}
                  </button>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-4">{report.desc}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={11} /> {report.date}</span>
                    {report.pages !== '—' && <span className="flex items-center gap-1"><FileText size={11} /> {report.pages} pages</span>}
                    {report.size !== '—' && <span>{report.size}</span>}
                  </div>
                  <StatusBadge status={report.status} />
                </div>
              </div>

              {/* Action Bar */}
              <div className="border-t border-white/5 px-5 py-3 flex items-center gap-2 bg-white/1">
                {report.status === 'ready' && (
                  <>
                    <button
                      onClick={() => setPreviewReport(report)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/8 text-gray-400 hover:text-white text-xs font-medium transition-all hover:border-cyan-500/30"
                    >
                      <Eye size={12} /> Preview
                    </button>
                    <button
                      onClick={() => handleDownload(report)}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 text-xs font-medium transition-all disabled:opacity-60"
                    >
                      {isDownloading
                        ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
                        : <><Download size={12} /> Download PDF</>}
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/8 text-gray-400 hover:text-white text-xs font-medium transition-all ml-auto">
                      <Share2 size={12} /> Share
                    </button>
                  </>
                )}
                {report.status === 'generating' && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <RefreshCw size={12} className="animate-spin" />
                    AI is generating your report…
                  </div>
                )}
                {report.status === 'error' && (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle size={12} /> Generation failed</span>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/20">
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/5">
          <FileText size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No reports found</p>
          <p className="text-gray-600 text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewReport(null)}>
          <div className="glass-card rounded-3xl border border-white/10 p-8 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + previewReport.bg}>
                  <previewReport.icon size={18} className={previewReport.color} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{previewReport.title}</h3>
                  <p className="text-xs text-gray-500">{previewReport.type} · {previewReport.date}</p>
                </div>
              </div>
              <button onClick={() => setPreviewReport(null)}
                className="w-8 h-8 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mb-6">{previewReport.desc}</p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pages</span>
                <span className="text-white font-medium">{previewReport.pages}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Size</span>
                <span className="text-white font-medium">{previewReport.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Active Dataset</span>
                <span className="text-white font-medium">
                  {activeDataset ? activeDataset.name : 'None loaded'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">PDF will include</span>
                <span className="text-cyan-400 font-medium text-xs">
                  {activeDataset ? 'Your real dataset data ✓' : 'Sample insights only'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPreviewReport(null)}
                className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-all">
                Close
              </button>
              <button
                onClick={() => { setPreviewReport(null); handleDownload(previewReport) }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowGenerate(false)}>
          <div className="glass-card rounded-3xl border border-white/10 p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Generate New Report</h3>
                <p className="text-gray-500 text-xs">AI will create a PDF from your dataset</p>
              </div>
            </div>

            {!activeDataset && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400">No dataset loaded. Upload a dataset first to include real data in your report.</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Report Title</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all"
                  placeholder="e.g. Q1 Sales Performance" />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Report Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Revenue', 'AI Insight', 'Marketing', 'Forecast', 'Finance', 'Custom'].map((t) => (
                    <button key={t} className="px-3 py-2 rounded-xl glass border border-white/8 text-xs text-gray-400 hover:text-white hover:border-cyan-500/30 transition-all">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowGenerate(false)}
                  className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowGenerate(false)
                    const mockReport = {
                      id: 99, title: 'Custom Report', desc: 'AI-generated report from your dataset.',
                      type: 'Custom', status: 'ready', date: new Date().toLocaleDateString(),
                      icon: Brain, color: 'text-cyan-400', bg: 'bg-cyan-500/10',
                    }
                    handleDownload(mockReport)
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={15} /> Generate PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}