import { useState } from 'react'
import {
  Database, Search, Upload, Trash2,
  Eye, Download, FileText,
  Grid, List, Calendar, HardDrive, Rows, Columns, X,
  MessageSquare
} from 'lucide-react'
import { useData } from '../context/DataContext'

const typeColors = {
  csv:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  xlsx: { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20'    },
  xls:  { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20'    },
  json: { bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20'  },
}

const statusLabel = (status) => {
  if (status === 'ready') return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Ready</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">Error</span>
}

function EmptyState({ onNavigate }) {
  return (
    <div className="glass-card rounded-2xl border border-white/5 py-20 text-center">
      <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
        <Database size={28} className="text-gray-600" />
      </div>
      <p className="text-white font-semibold text-lg mb-1">No datasets yet</p>
      <p className="text-gray-500 text-sm mb-6">Upload a CSV or JSON file to get started</p>
      <button onClick={() => onNavigate?.('upload')}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition-all hover:scale-105 active:scale-95">
        <Upload size={16} /> Upload Your First Dataset
      </button>
    </div>
  )
}

export default function DatasetsSection({ onNavigate }) {
  const { datasets, removeDataset, loadIntoChat, activeDataset } = useData()
  const [search,    setSearch]    = useState('')
  const [viewMode,  setViewMode]  = useState('table')
  const [selected,  setSelected]  = useState([])
  const [previewDs, setPreviewDs] = useState(null)

  const filtered = datasets.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  const toggleSelect = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const deleteSelected = () => { selected.forEach((id) => removeDataset(id)); setSelected([]) }

  const handleAskAI = (dataset) => { loadIntoChat(dataset); onNavigate?.('chat') }

  const downloadDataset = (dataset) => {
    if (!dataset.rows?.length) return
    const headers = dataset.columns.join(',')
    const rows = dataset.rows.map((r) => dataset.columns.map((c) => JSON.stringify(r[c] ?? '')).join(','))
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = dataset.name; a.click()
    URL.revokeObjectURL(url)
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const totalRows = datasets.reduce((s, d) => s + (d.rowCount || 0), 0)
  const totalSize = datasets.reduce((s, d) => s + (d.rawSize || 0), 0)
  const avgCols   = datasets.length ? (datasets.reduce((s, d) => s + (d.columns?.length || 0), 0) / datasets.length).toFixed(1) : '—'

  const summaryStats = [
    { label: 'Total Datasets', value: datasets.length, icon: Database, color: 'text-cyan-400', bg: 'from-cyan-500/15 to-cyan-500/5', border: 'border-cyan-500/20' },
    { label: 'Total Rows', value: totalRows > 999 ? (totalRows/1000).toFixed(1)+'K' : totalRows, icon: Rows, color: 'text-violet-400', bg: 'from-violet-500/15 to-violet-500/5', border: 'border-violet-500/20' },
    { label: 'Total Size', value: formatSize(totalSize), icon: HardDrive, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/20' },
    { label: 'Avg Columns', value: avgCols, icon: Columns, color: 'text-amber-400', bg: 'from-amber-500/15 to-amber-500/5', border: 'border-amber-500/20' },
  ]

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={'rounded-2xl p-4 bg-gradient-to-br ' + s.bg + ' border ' + s.border}>
              <div className={'w-8 h-8 rounded-lg glass flex items-center justify-center mb-2 ' + s.color}><Icon size={16} /></div>
              <div className="text-xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      {datasets.length === 0 ? <EmptyState onNavigate={onNavigate} /> : (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Search datasets..."
                className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all" />
            </div>
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <button onClick={deleteSelected} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm hover:bg-rose-500/20 transition-all">
                  <Trash2 size={14} /> Delete ({selected.length})
                </button>
              )}
              <div className="flex items-center glass border border-white/8 rounded-xl p-1">
                <button onClick={() => setViewMode('table')} className={'px-3 py-1.5 rounded-lg transition-all ' + (viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-white')}><List size={15} /></button>
                <button onClick={() => setViewMode('grid')} className={'px-3 py-1.5 rounded-lg transition-all ' + (viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-white')}><Grid size={15} /></button>
              </div>
              <button onClick={() => onNavigate?.('upload')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95">
                <Upload size={15} /> Upload New
              </button>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/2">
                      <th className="w-10 px-4 py-3">
                        <input type="checkbox" className="accent-cyan-400"
                          checked={selected.length === filtered.length && filtered.length > 0}
                          onChange={() => setSelected(selected.length === filtered.length ? [] : filtered.map((d) => d.id))} />
                      </th>
                      {['Name','Type','Rows','Columns','Size','Uploaded','Status'].map((col) => (
                        <th key={col} className="text-left text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{col}</th>
                      ))}
                      <th className="px-4 py-3 text-gray-500 font-medium text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {filtered.map((d) => {
                      const tc = typeColors[d.type] || typeColors.csv
                      const isActive = activeDataset?.id === d.id
                      return (
                        <tr key={d.id} className={'transition-colors ' + (isActive ? 'bg-emerald-500/5' : 'hover:bg-white/2')}>
                          <td className="px-4 py-3"><input type="checkbox" className="accent-cyan-400" checked={selected.includes(d.id)} onChange={() => toggleSelect(d.id)} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ' + tc.bg}><FileText size={14} className={tc.text} /></div>
                              <div>
                                <div className="font-medium text-white text-sm flex items-center gap-2">
                                  {d.name}
                                  {isActive && <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">In Chat</span>}
                                </div>
                                <div className="flex gap-1 mt-0.5">
                                  {(d.tags||[]).map((t) => <span key={t} className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/8">{t}</span>)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className={'text-xs px-2 py-1 rounded-full font-medium border ' + tc.bg + ' ' + tc.text + ' ' + tc.border}>.{d.type}</span></td>
                          <td className="px-4 py-3 text-gray-300">{(d.rowCount||0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-gray-300">{d.columns?.length||'—'}</td>
                          <td className="px-4 py-3 text-gray-400">{d.size}</td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap"><div className="flex items-center gap-1"><Calendar size={12} className="text-gray-600"/>{d.uploaded}</div></td>
                          <td className="px-4 py-3">{statusLabel(d.status)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setPreviewDs(d)} className="p-1.5 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors" title="Preview"><Eye size={14}/></button>
                              <button onClick={() => handleAskAI(d)} className="p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors" title="Ask AI"><MessageSquare size={14}/></button>
                              <button onClick={() => downloadDataset(d)} className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Download"><Download size={14}/></button>
                              <button onClick={() => removeDataset(d.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete"><Trash2 size={14}/></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && <div className="py-16 text-center"><Database size={36} className="text-gray-700 mx-auto mb-3"/><p className="text-gray-500">No datasets match your search</p></div>}
            </div>
          )}

          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((d) => {
                const tc = typeColors[d.type] || typeColors.csv
                const isActive = activeDataset?.id === d.id
                return (
                  <div key={d.id} className={'glass-card rounded-2xl border transition-all duration-300 p-5 ' + (isActive ? 'border-emerald-500/30' : 'border-white/5 hover:border-white/10')}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + tc.bg}><FileText size={18} className={tc.text}/></div>
                        <div>
                          <div className="font-semibold text-white text-sm truncate max-w-[140px]">{d.name}</div>
                          <span className={'text-xs px-2 py-0.5 rounded-full font-medium border mt-1 inline-block ' + tc.bg + ' ' + tc.text + ' ' + tc.border}>.{d.type}</span>
                        </div>
                      </div>
                      {isActive && <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">In Chat</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[{label:'Rows',value:(d.rowCount||0).toLocaleString()},{label:'Cols',value:d.columns?.length||'—'},{label:'Size',value:d.size}].map((s)=>(
                        <div key={s.label} className="bg-white/3 rounded-xl p-2.5 text-center">
                          <div className="text-xs font-semibold text-white">{s.value}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setPreviewDs(d)} className="flex-1 py-2 rounded-xl glass border border-white/8 text-xs font-medium text-gray-400 hover:text-white hover:border-cyan-500/30 transition-all"><Eye size={12} className="inline mr-1"/>Preview</button>
                      <button onClick={() => handleAskAI(d)} className="flex-1 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all"><MessageSquare size={12} className="inline mr-1"/>Ask AI</button>
                      <button onClick={() => removeDataset(d.id)} className="py-2 px-3 rounded-xl glass border border-white/8 text-gray-500 hover:text-rose-400 text-xs transition-all"><Trash2 size={12}/></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewDs && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewDs(null)}>
          <div className="glass-card rounded-3xl border border-white/10 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div>
                <h3 className="font-bold text-white">{previewDs.name}</h3>
                <p className="text-xs text-gray-500">{(previewDs.rowCount||0).toLocaleString()} rows · {previewDs.columns?.length} columns · {previewDs.size}</p>
              </div>
              <button onClick={() => setPreviewDs(null)} className="w-8 h-8 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white transition-colors"><X size={16}/></button>
            </div>
            <div className="px-6 py-3 border-b border-white/5 flex flex-wrap gap-2">
              {(previewDs.columns||[]).map((col) => <span key={col} className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">{col}</span>)}
            </div>
            <div className="flex-1 overflow-auto p-6">
              {previewDs.rows?.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-white/8">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-white/8 bg-white/3">{(previewDs.columns||[]).map((col) => <th key={col} className="text-left text-gray-400 font-medium px-4 py-3 whitespace-nowrap capitalize">{col}</th>)}</tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {previewDs.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-white/2">{(previewDs.columns||[]).map((col) => <td key={col} className="px-4 py-3 text-gray-300 whitespace-nowrap max-w-[200px] truncate">{String(row[col]??'')}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="text-center py-10"><p className="text-gray-400 text-sm">No row preview available.</p></div>}
            </div>
            <div className="px-6 py-4 border-t border-white/5 flex gap-3 justify-end">
              <button onClick={() => downloadDataset(previewDs)} className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-gray-300 text-sm hover:text-white transition-all"><Download size={14}/> Download</button>
              <button onClick={() => { setPreviewDs(null); handleAskAI(previewDs) }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all"><MessageSquare size={14}/> Ask AI about this</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}