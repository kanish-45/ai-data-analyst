import { useState, useRef } from 'react'
import {
  Upload, FileText, CheckCircle, XCircle, X,
  AlertCircle, BarChart3, Database, TrendingUp,
  MessageSquare, ChevronRight, Eye, Hash,
  Type, Table2, Cloud, CloudOff
} from 'lucide-react'
import { useData, parseCSV, parseJSON, parseExcel } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

const API_URL     = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const allowedTypes = ['csv', 'xlsx', 'xls', 'json']

function getToken() { return localStorage.getItem('datamind_token') }

async function saveDatasetToAPI(datasetPayload) {
  const token = getToken()
  const res = await fetch(`${API_URL}/datasets`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(datasetPayload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Failed to save dataset')
  return data.dataset
}

export default function FileUpload({ onNavigateToChat }) {
  const { addDataset, loadIntoChat } = useData()
  const { user }                     = useAuth()

  const [isDragging,    setIsDragging]    = useState(false)
  const [files,         setFiles]         = useState([])
  const [analyzing,     setAnalyzing]     = useState(false)
  const [analyzed,      setAnalyzed]      = useState(false)
  const [parsedDataset, setParsedDataset] = useState(null)
  const [previewOpen,   setPreviewOpen]   = useState(false)
  const [parseError,    setParseError]    = useState(null)
  const [savedToCloud,  setSavedToCloud]  = useState(false)
  const inputRef = useRef(null)

  const getExt     = (name) => name.split('.').pop().toLowerCase()
  const isValid    = (file) => allowedTypes.includes(getExt(file.name))
  const formatSize = (bytes) => {
    if (!bytes || bytes < 1024)       return (bytes || 0) + ' B'
    if (bytes < 1024 * 1024)          return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (name) => {
    const ext = getExt(name)
    if (ext === 'csv')  return { icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
    if (ext === 'json') return { icon: BarChart3, color: 'text-violet-400',  bg: 'bg-violet-500/10'  }
    return                     { icon: FileText,  color: 'text-cyan-400',    bg: 'bg-cyan-500/10'    }
  }

  const processFiles = (incoming) => {
    const newFiles = Array.from(incoming).map((file) => ({
      id: Date.now() + Math.random(), file,
      name: file.name, size: file.size,
      valid: isValid(file), status: isValid(file) ? 'ready' : 'error',
    }))
    setFiles((prev) => [...prev, ...newFiles])
    setAnalyzed(false); setParsedDataset(null)
    setParseError(null); setSavedToCloud(false)
  }

  const handleDrop      = (e) => { e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files) }
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = ()  => setIsDragging(false)
  const handleBrowse    = (e) => processFiles(e.target.files)
  const removeFile      = (id) => {
    setFiles((p) => p.filter((f) => f.id !== id))
    setAnalyzed(false); setParsedDataset(null)
    setParseError(null); setSavedToCloud(false)
  }

  // ── Parse file ───────────────────────────────────────────────────────────────
  const parseFile = (fileObj) => new Promise((resolve, reject) => {
    const ext    = getExt(fileObj.name)
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('File read failed'))

    if (ext === 'csv') {
      reader.onload = (e) => {
        try { resolve(buildDataset(fileObj, ext, parseCSV(e.target.result))) }
        catch (err) { reject(new Error(`CSV error: ${err.message}`)) }
      }
      reader.readAsText(fileObj)
    } else if (ext === 'json') {
      reader.onload = (e) => {
        try { resolve(buildDataset(fileObj, ext, parseJSON(e.target.result))) }
        catch (err) { reject(new Error(`JSON error: ${err.message}`)) }
      }
      reader.readAsText(fileObj)
    } else {
      reader.onload = async (e) => {
        try { resolve(buildDataset(fileObj, ext, await parseExcel(e.target.result))) }
        catch (err) { reject(new Error(`Excel error: ${err.message}`)) }
      }
      reader.readAsArrayBuffer(fileObj)
    }
  })

  const buildDataset = (fileObj, ext, parsed) => ({
    id:       Date.now() + Math.random(),
    name:     fileObj.name,
    type:     ext,
    size:     formatSize(fileObj.size),
    rawSize:  fileObj.size,
    uploaded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    status:   'ready',
    tags:     [ext.toUpperCase()],
    columns:  parsed.columns,
    rows:     parsed.rows,
    allRows:  parsed.allRows,
    rowCount: parsed.rowCount,
    xlsxMissing: parsed.xlsxMissing || false,
  })

  // ── Compute column stats for MongoDB storage ──────────────────────────────────
  const computeStats = (dataset) => {
    const rows = dataset.allRows || dataset.rows || []
    const stats = {}
    dataset.columns.forEach((col) => {
      const vals = rows.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v))
      if (vals.length > rows.length * 0.4) {
        const sum = vals.reduce((a, b) => a + b, 0)
        stats[col] = {
          min: Math.min(...vals),
          max: Math.max(...vals),
          avg: sum / vals.length,
          count: vals.length,
          type: 'numeric',
        }
      } else {
        const unique = [...new Set(rows.map((r) => String(r[col] || '')))].slice(0, 10)
        stats[col] = { unique, type: 'categorical' }
      }
    })
    return stats
  }

  // ── Main analyze handler ──────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    const validFiles = files.filter((f) => f.valid)
    if (validFiles.length === 0) return

    setAnalyzing(true); setAnalyzed(false)
    setParsedDataset(null); setParseError(null); setSavedToCloud(false)
    setFiles((prev) => prev.map((f) => f.valid ? { ...f, progress: 0, status: 'uploading' } : f))

    let tick = 0
    const interval = setInterval(() => {
      tick = Math.min(tick + 18, 85)
      setFiles((prev) => prev.map((f) => f.valid ? { ...f, progress: tick } : f))
    }, 100)

    try {
      const dataset = await parseFile(validFiles[0].file)
      clearInterval(interval)
      setFiles((prev) => prev.map((f) => f.valid ? { ...f, progress: 100, status: 'done' } : f))

      // Add to local context immediately
      addDataset(dataset)
      setParsedDataset(dataset)
      setAnalyzed(true)

      // Save to MongoDB if logged in
      if (user) {
        try {
          const columnStats  = computeStats(dataset)
          const sampleRows   = (dataset.allRows || dataset.rows || []).slice(0, 20)

          await saveDatasetToAPI({
            name:        dataset.name,
            type:        dataset.type,
            size:        dataset.size,
            rawSize:     dataset.rawSize,
            rowCount:    dataset.rowCount,
            columns:     dataset.columns,
            sampleRows,
            columnStats,
            tags:        dataset.tags,
          })
          setSavedToCloud(true)
        } catch (saveErr) {
          console.warn('Cloud save failed (dataset still available locally):', saveErr.message)
          setSavedToCloud(false)
        }
      }
    } catch (err) {
      clearInterval(interval)
      setFiles((prev) => prev.map((f) => f.valid ? { ...f, status: 'error', progress: 0 } : f))
      setParseError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAskAI = () => {
    if (parsedDataset) { loadIntoChat(parsedDataset); onNavigateToChat?.() }
  }

  const handleReset = () => {
    setFiles([]); setAnalyzed(false); setAnalyzing(false)
    setParsedDataset(null); setParseError(null); setSavedToCloud(false)
  }

  const validCount = files.filter((f) => f.valid).length
  const insights   = parsedDataset ? buildInsights(parsedDataset) : []

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Drop Zone */}
      <div
        onDrop={handleDrop} onDragOver={handleDragOver}
        onDragLeave={handleDragLeave} onClick={() => inputRef.current?.click()}
        className={'relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ' +
          (isDragging ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02]' : 'border-white/10 hover:border-cyan-500/40 hover:bg-white/2 bg-white/1')}
      >
        <input ref={inputRef} type="file" multiple accept=".csv,.xlsx,.xls,.json" onChange={handleBrowse} className="hidden" />
        <div className={'w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center transition-all duration-300 ' + (isDragging ? 'bg-cyan-500/20' : 'glass')}>
          <Upload size={36} className={isDragging ? 'text-cyan-400' : 'text-gray-500'} />
        </div>
        {isDragging ? (
          <><p className="text-xl font-bold text-cyan-400 mb-2">Drop your file here!</p>
            <p className="text-gray-500 text-sm">Release to start parsing</p></>
        ) : (
          <><p className="text-xl font-bold text-white mb-2">Drag and drop your dataset here</p>
            <p className="text-gray-500 text-sm mb-6">or click to browse from your computer</p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition-all">
              <Upload size={16} /> Browse Files
            </div></>
        )}
        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
          {allowedTypes.map((ext) => (
            <span key={ext} className="px-3 py-1 rounded-full glass border border-white/10 text-xs text-gray-400 uppercase font-medium">.{ext}</span>
          ))}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h3 className="font-bold text-white">{files.length} file{files.length > 1 ? 's' : ''} selected</h3>
            <button onClick={handleReset} className="text-xs text-gray-500 hover:text-rose-400 transition-colors">Clear all</button>
          </div>
          <div className="divide-y divide-white/5">
            {files.map((f) => {
              const meta = getFileIcon(f.name)
              const Icon = meta.icon
              return (
                <div key={f.id} className="flex items-center gap-4 px-6 py-4">
                  <div className={'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ' + meta.bg}>
                    <Icon size={18} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">{f.name}</span>
                      {!f.valid && <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">Invalid</span>}
                    </div>
                    <div className="text-xs text-gray-500">{formatSize(f.size)}</div>
                    {f.status === 'uploading' && (
                      <div className="mt-2 h-1.5 rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-200" style={{ width: (f.progress || 0) + '%' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {f.status === 'ready'     && <span className="text-xs text-gray-500">Ready</span>}
                    {f.status === 'uploading' && <span className="text-xs text-cyan-400">{f.progress || 0}%</span>}
                    {f.status === 'done'      && <CheckCircle size={18} className="text-emerald-400" />}
                    {f.status === 'error'     && <XCircle    size={18} className="text-rose-400" />}
                  </div>
                  <button onClick={() => removeFile(f.id)}
                    className="flex-shrink-0 w-7 h-7 rounded-lg glass flex items-center justify-center text-gray-500 hover:text-rose-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>

          {parseError && (
            <div className="mx-6 mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertCircle size={14} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-400">{parseError}</p>
            </div>
          )}

          {!analyzed && (
            <div className="px-6 py-4 border-t border-white/5">
              <button onClick={handleAnalyze} disabled={analyzing || validCount === 0}
                className={'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ' +
                  (validCount > 0 && !analyzing
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90 hover:scale-[1.01] active:scale-95'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed')}>
                {analyzing
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Parsing & analyzing…</>
                  : <><TrendingUp size={16} /> Analyze {validCount} file{validCount !== 1 ? 's' : ''} with AI</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analysis Results */}
      {analyzed && parsedDataset && (
        <div className="glass-card rounded-2xl border border-emerald-500/20 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-emerald-500/5">
            <CheckCircle size={20} className="text-emerald-400" />
            <div className="flex-1">
              <h3 className="font-bold text-white">Dataset Ready!</h3>
              <p className="text-xs text-gray-500">
                {parsedDataset.rowCount.toLocaleString()} rows · {parsedDataset.columns.length} columns · {parsedDataset.type.toUpperCase()}
              </p>
            </div>
            {/* Cloud save indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              {user ? (
                savedToCloud
                  ? <><Cloud size={13} className="text-emerald-400" /><span className="text-emerald-400">Saved</span></>
                  : <><CloudOff size={13} className="text-gray-500" /><span className="text-gray-500">Local only</span></>
              ) : (
                <><CloudOff size={13} className="text-gray-600" /><span className="text-gray-600">Login to save</span></>
              )}
            </div>
            <button onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 text-gray-400 hover:text-white text-xs transition-all">
              <Eye size={12} /> Preview
            </button>
          </div>

          {parsedDataset.xlsxMissing && (
            <div className="mx-6 mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">
                Run <code className="text-cyan-400 bg-black/30 px-1 py-0.5 rounded">npm install xlsx</code> for Excel support, then restart.
              </p>
            </div>
          )}

          <div className="p-6 space-y-2.5">
            {insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/3">
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-cyan-400 font-bold">{i + 1}</span>
                </div>
                <p className="text-sm text-gray-300">{insight}</p>
              </div>
            ))}
          </div>

          {/* Column type pills */}
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-500 mb-2">Columns detected:</p>
            <div className="flex flex-wrap gap-1.5">
              {parsedDataset.columns.slice(0, 12).map((col) => {
                const isNum = isNumericCol(col, parsedDataset.rows)
                return (
                  <span key={col} className={'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ' +
                    (isNum ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400')}>
                    {isNum ? <Hash size={10} /> : <Type size={10} />} {col}
                  </span>
                )
              })}
              {parsedDataset.columns.length > 12 && (
                <span className="text-xs px-2.5 py-1 rounded-full glass border border-white/10 text-gray-500">+{parsedDataset.columns.length - 12} more</span>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button onClick={handleAskAI}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <MessageSquare size={15} /> Ask AI About This Data <ChevronRight size={14} />
            </button>
            <button onClick={handleReset}
              className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-gray-300 font-semibold text-sm hover:border-white/20 transition-all">
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Info note */}
      {files.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl glass border border-amber-500/20">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400 mb-1">Supported Formats</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              CSV and JSON work instantly. For Excel, run <code className="text-cyan-400">npm install xlsx</code> once.
              {user ? ' Your datasets are automatically saved to your account.' : ' Log in to save datasets to your account.'}
              {' '}Max 50MB per file.
            </p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && parsedDataset && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewOpen(false)}>
          <div className="glass-card rounded-3xl border border-white/10 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div>
                <h3 className="font-bold text-white text-lg">{parsedDataset.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{parsedDataset.rowCount.toLocaleString()} rows · {parsedDataset.columns.length} columns · {parsedDataset.size}</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="w-8 h-8 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="px-6 py-3 border-b border-white/5 flex flex-wrap gap-1.5">
              {parsedDataset.columns.map((col) => {
                const isNum = isNumericCol(col, parsedDataset.rows)
                return (
                  <span key={col} className={'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ' +
                    (isNum ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400')}>
                    {isNum ? <Hash size={9} /> : <Type size={9} />} {col}
                  </span>
                )
              })}
            </div>
            <div className="flex-1 overflow-auto p-6">
              {parsedDataset.rows.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Table2 size={14} className="text-gray-500" />
                    <p className="text-xs text-gray-500">Showing first {parsedDataset.rows.length} of {parsedDataset.rowCount.toLocaleString()} rows</p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-white/8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/8 bg-white/3">
                          <th className="text-left text-gray-600 font-medium px-4 py-3 w-10">#</th>
                          {parsedDataset.columns.map((col) => (
                            <th key={col} className="text-left text-gray-400 font-medium px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {isNumericCol(col, parsedDataset.rows) ? <Hash size={10} className="text-violet-400" /> : <Type size={10} className="text-cyan-400" />}
                                {col}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {parsedDataset.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-white/2 transition-colors">
                            <td className="px-4 py-2.5 text-gray-600 text-xs">{i + 1}</td>
                            {parsedDataset.columns.map((col) => (
                              <td key={col} className="px-4 py-2.5 text-gray-300 whitespace-nowrap max-w-[180px] truncate text-sm">{String(row[col] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Table2 size={40} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No row preview available</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-gray-600"><span className="text-violet-400">■</span> Numeric &nbsp;<span className="text-cyan-400">■</span> Text</p>
              <button onClick={() => { setPreviewOpen(false); handleAskAI() }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
                <MessageSquare size={14} /> Ask AI About This Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isNumericCol(col, rows) {
  if (!rows?.length) return false
  const vals = rows.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v))
  return vals.length >= rows.length * 0.5
}

function buildInsights(dataset) {
  const rows     = dataset.allRows || dataset.rows || []
  const insights = []
  insights.push(`${dataset.rowCount.toLocaleString()} rows and ${dataset.columns.length} columns detected`)
  const colPreview = dataset.columns.slice(0, 6).join(', ')
  insights.push(`Columns: ${colPreview}${dataset.columns.length > 6 ? ` and ${dataset.columns.length - 6} more` : ''}`)
  const numCols = dataset.columns.filter((col) => isNumericCol(col, dataset.rows))
  if (numCols.length > 0) {
    const col  = numCols[0]
    const vals = rows.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v))
    if (vals.length > 0) {
      const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
      const max = Math.max(...vals).toFixed(2)
      const min = Math.min(...vals).toFixed(2)
      insights.push(`"${col}" ranges from ${min} to ${max} with an average of ${avg}`)
    }
  }
  insights.push('AI is ready — ask anything about this dataset in the chat!')
  return insights
}