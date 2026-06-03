import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Download, Eye, Trash2,
  Plus, CheckCircle, Clock,
  AlertCircle, BarChart3,
  Brain, Database,
  Loader2, X, Sparkles
} from 'lucide-react'
import { useData, buildDatasetContext } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

const API_URL        = import.meta.env.VITE_API_URL || 'https://ai-data-analyst-backend-xj17.onrender.com/api'
const COMPLETION_URL = `${API_URL}/chat/completion`

function getToken() { return localStorage.getItem('datamind_token') }

// localStorage key (per user) so each user sees only their own reports
function reportsKey(userId) { return `datamind_reports_${userId || 'guest'}` }

function loadStoredReports(userId) {
  try {
    return JSON.parse(localStorage.getItem(reportsKey(userId)) || '[]')
  } catch { return [] }
}
function saveStoredReports(userId, reports) {
  localStorage.setItem(reportsKey(userId), JSON.stringify(reports))
}

// ── AI prompt template ────────────────────────────────────────────────────────
const REPORT_SYSTEM_PROMPT = `You are DataMind AI generating a structured data analysis report.

Generate a markdown report with EXACTLY these sections, in order:

## Executive Summary
A 3–4 sentence overview of what this dataset is and the most important takeaway.

## Key Insights
A numbered list of 4–6 specific, data-driven insights. Reference actual column names and concrete numbers.

## Notable Patterns
2–3 patterns, anomalies, or relationships you spot in the data.

## Recommendations
3–5 actionable next steps a user could take to explore further.

## Methodology
A short paragraph describing what data this report was based on (column count, row count, types).

Rules:
- Be concise, accurate, and grounded in the actual numbers provided.
- Never invent values — only use what's in the dataset context.
- Use **bold** for key column names and numbers.
- Keep total length under 700 words.`

// ── Generate report via Groq completion endpoint ──────────────────────────────
async function generateReportContent(dataset) {
  const token = getToken()
  const systemPrompt = REPORT_SYSTEM_PROMPT + buildDatasetContext(dataset)

  const res = await fetch(COMPLETION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({
      model: 'llama3.1',  // bigger model for report-quality output
      systemPrompt,
      messages: [{
        role:    'user',
        content: `Generate the full structured report for the dataset "${dataset.name}". Use the markdown format described in your instructions.`,
      }],
    }),
  })

  if (!res.ok) {
    let msg = `Report generation failed (${res.status})`
    try {
      const data = await res.json()
      msg = data.message || msg
    } catch { /* ignore */ }
    if (res.status === 401) throw new Error('Your session expired. Please sign in again.')
    throw new Error(msg)
  }

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer    = ''
  let full      = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop()
    for (const evt of events) {
      let eventName = 'message'
      let dataLine  = ''
      for (const line of evt.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim()
        else if (line.startsWith('data:'))  dataLine  = line.slice(5).trim()
      }
      if (!dataLine) continue
      if (eventName === 'done') return full
      if (eventName === 'error') {
        try { throw new Error(JSON.parse(dataLine).message || 'AI error') }
        catch (e) { throw e instanceof Error ? e : new Error('AI error') }
      }
      try {
        const { token: chunk } = JSON.parse(dataLine)
        if (chunk) full += chunk
      } catch { /* skip */ }
    }
  }
  return full
}

// ── Markdown → simple HTML for preview / PDF ──────────────────────────────────
function renderMarkdown(md) {
  if (!md) return ''
  const lines = md.split('\n')
  const out = []
  let inList = false

  for (const line of lines) {
    if (/^## /.test(line)) {
      if (inList) { out.push('</ol>'); inList = false }
      out.push(`<h2>${line.replace(/^## /, '')}</h2>`)
    } else if (/^# /.test(line)) {
      out.push(`<h1>${line.replace(/^# /, '')}</h1>`)
    } else if (/^\d+\.\s/.test(line.trim())) {
      if (!inList) { out.push('<ol>'); inList = true }
      out.push(`<li>${renderInline(line.trim().replace(/^\d+\.\s/, ''))}</li>`)
    } else if (/^[-*]\s/.test(line.trim())) {
      if (!inList) { out.push('<ul>'); inList = true }
      out.push(`<li>${renderInline(line.trim().replace(/^[-*]\s/, ''))}</li>`)
    } else if (line.trim() === '') {
      if (inList) { out.push('</ol>'); inList = false }
    } else {
      if (inList) { out.push('</ol>'); inList = false }
      out.push(`<p>${renderInline(line)}</p>`)
    }
  }
  if (inList) out.push('</ol>')
  return out.join('\n')
}
function renderInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

// ── Download as printable HTML (user picks "Save as PDF") ─────────────────────
function downloadReportAsPDF(report) {
  const now = new Date(report.generatedAt).toLocaleString()
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${report.title}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 780px; margin: 40px auto; padding: 0 24px; color: #0a0f1e; line-height: 1.6; }
  h1   { font-size: 28px; margin: 0 0 8px; }
  h2   { font-size: 18px; margin: 24px 0 8px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  p    { margin: 8px 0; }
  ol, ul { margin: 8px 0; padding-left: 20px; }
  li   { margin: 4px 0; }
  strong { color: #0e7490; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 28px; }
  .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 12px; color: #9ca3af; }
</style></head>
<body>
  <h1>${report.title}</h1>
  <div class="meta">Generated by DataMind AI · ${now} · Dataset: ${report.datasetName}</div>
  ${renderMarkdown(report.content)}
  <div class="footer">Generated by DataMind AI — Use your browser's "Save as PDF" option.</div>
</body></html>`
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportsSection({ onNavigateToUpload }) {
  const { activeDataset, datasets } = useData()
  const { user } = useAuth()

  const [reports,        setReports]        = useState([])
  const [generating,     setGenerating]     = useState(false)
  const [error,          setError]          = useState('')
  const [previewReport,  setPreviewReport]  = useState(null)
  const [selectedDsId,   setSelectedDsId]   = useState(activeDataset?.id || datasets[0]?.id || '')

  // Hydrate from localStorage
  useEffect(() => {
    if (user) setReports(loadStoredReports(user.id))
  }, [user])

  // Persist whenever reports change
  useEffect(() => {
    if (user) saveStoredReports(user.id, reports)
  }, [user, reports])

  // Sync selectedDsId if active dataset changes
  useEffect(() => {
    if (activeDataset?.id) setSelectedDsId(activeDataset.id)
  }, [activeDataset])

  const handleGenerate = useCallback(async () => {
    setError('')
    const dataset = datasets.find((d) => d.id === selectedDsId) || activeDataset
    if (!dataset) {
      setError('Please upload a dataset first.')
      return
    }
    setGenerating(true)
    try {
      const content = await generateReportContent(dataset)
      const newReport = {
        id:          `r-${Date.now()}`,
        title:       `Analysis Report — ${dataset.name}`,
        datasetName: dataset.name,
        datasetId:   dataset.id,
        rowCount:    dataset.rowCount,
        columnCount: dataset.columns.length,
        content,
        generatedAt: new Date().toISOString(),
      }
      setReports((prev) => [newReport, ...prev])
    } catch (err) {
      setError(err.message || 'Failed to generate report.')
    } finally {
      setGenerating(false)
    }
  }, [datasets, selectedDsId, activeDataset])

  const handleDelete = (id) => {
    setReports((prev) => prev.filter((r) => r.id !== id))
    if (previewReport?.id === id) setPreviewReport(null)
  }

  // No datasets at all
  if (datasets.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 border border-white/5 text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 items-center justify-center mb-4">
          <FileText size={26} className="text-cyan-400" />
        </div>
        <h2 className="text-white font-bold text-lg mb-2">No datasets yet</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
          Reports are AI-generated summaries of your data. Upload a dataset to generate your first report.
        </p>
        <button onClick={onNavigateToUpload}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
          <Plus size={14} /> Upload a dataset
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Generate panel */}
      <div className="glass-card rounded-2xl border border-white/5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-cyan-400" />
              <h3 className="text-white font-semibold">Generate a new report</h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              AI analyzes your dataset and writes a structured report with insights, patterns, and recommendations.
            </p>
            <label className="block text-xs text-gray-400 mb-1.5">Dataset</label>
            <select
              value={selectedDsId}
              onChange={(e) => setSelectedDsId(e.target.value)}
              disabled={generating}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/40 disabled:opacity-50"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id} className="bg-[#0a0f1e]">
                  {d.name} ({d.rowCount.toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={generating || !selectedDsId}
            className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {generating
              ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
              : <><Sparkles size={14} /> Generate report</>}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <AlertCircle size={14} className="text-rose-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-rose-400">{error}</p>
          </div>
        )}
      </div>

      {/* Reports list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Your reports</h2>
          <span className="text-xs text-gray-500">{reports.length} total</span>
        </div>

        {reports.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/5 p-12 text-center">
            <Brain size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No reports yet</p>
            <p className="text-gray-600 text-xs mt-1">Click "Generate report" above to create your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reports.map((r) => (
              <div key={r.id} className="glass-card rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{r.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.datasetName} · {r.rowCount.toLocaleString()} rows · {r.columnCount} cols
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Clock size={10} className="text-gray-600" />
                      <span className="text-xs text-gray-600">
                        {new Date(r.generatedAt).toLocaleString()}
                      </span>
                      <span className="text-xs ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle size={9} /> Ready
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button onClick={() => setPreviewReport(r)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/15 transition-all">
                    <Eye size={12} /> Preview
                  </button>
                  <button onClick={() => downloadReportAsPDF(r)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/10 text-gray-300 text-xs font-medium hover:text-white hover:border-white/20 transition-all">
                    <Download size={12} /> Download
                  </button>
                  <button onClick={() => handleDelete(r.id)}
                    className="w-8 h-8 rounded-xl glass border border-white/10 text-gray-500 hover:text-rose-400 hover:border-rose-500/20 flex items-center justify-center transition-all"
                    title="Delete">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewReport(null)}>
          <div className="glass-card rounded-3xl border border-white/10 w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] mx-4 sm:mx-0 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="min-w-0">
                <h3 className="font-bold text-white text-lg truncate">{previewReport.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {previewReport.datasetName} · Generated {new Date(previewReport.generatedAt).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setPreviewReport(null)}
                className="w-8 h-8 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-invert max-w-none report-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(previewReport.content) }} />
            </div>
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-end">
              <button onClick={() => downloadReportAsPDF(previewReport)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
                <Download size={14} /> Download as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for the preview content */}
      <style>{`
        .report-content h1 { font-size: 22px; font-weight: 700; color: #fff; margin: 8px 0 4px; }
        .report-content h2 { font-size: 16px; font-weight: 600; color: #fff; margin: 18px 0 6px; padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .report-content p  { color: #d1d5db; font-size: 14px; line-height: 1.65; margin: 6px 0; }
        .report-content ol, .report-content ul { color: #d1d5db; font-size: 14px; line-height: 1.65; padding-left: 22px; margin: 6px 0; }
        .report-content li { margin: 4px 0; }
        .report-content strong { color: #22d3ee; font-weight: 600; }
        .report-content code { background: rgba(34,211,238,0.1); color: #67e8f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
      `}</style>
    </div>
  )
}