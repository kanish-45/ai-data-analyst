import { useState } from 'react'
import {
  FileText, Download, Eye, Trash2,
  Plus, Search, Filter, CheckCircle,
  Clock, AlertCircle, Star, StarOff,
  BarChart3, TrendingUp, Database, Brain,
  Calendar, ChevronRight, RefreshCw, Share2
} from 'lucide-react'

const reports = [
  {
    id: 1,
    title: 'Q4 2024 Revenue Analysis',
    desc: 'Comprehensive breakdown of Q4 revenue trends, top products, and regional performance.',
    type: 'Revenue',
    status: 'ready',
    date: 'Mar 25, 2025',
    size: '2.4 MB',
    pages: 18,
    starred: true,
    icon: TrendingUp,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
  },
  {
    id: 2,
    title: 'Customer Segmentation Report',
    desc: 'AI-generated customer clusters based on purchase behavior and demographics.',
    type: 'AI Insight',
    status: 'ready',
    date: 'Mar 22, 2025',
    size: '1.8 MB',
    pages: 12,
    starred: true,
    icon: Brain,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    id: 3,
    title: 'Marketing Channel Performance',
    desc: 'ROI analysis across paid, organic, email, and social media channels.',
    type: 'Marketing',
    status: 'ready',
    date: 'Mar 20, 2025',
    size: '3.1 MB',
    pages: 24,
    starred: false,
    icon: BarChart3,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 4,
    title: 'Inventory Forecast — April 2025',
    desc: 'Predictive inventory needs based on seasonal patterns and recent trends.',
    type: 'Forecast',
    status: 'generating',
    date: 'Mar 27, 2025',
    size: '—',
    pages: '—',
    starred: false,
    icon: Database,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    id: 5,
    title: 'User Retention Deep Dive',
    desc: 'Cohort analysis and churn risk identification for the past 6 months.',
    type: 'AI Insight',
    status: 'ready',
    date: 'Mar 15, 2025',
    size: '1.2 MB',
    pages: 9,
    starred: false,
    icon: Brain,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    id: 6,
    title: 'Finance Summary — Feb 2025',
    desc: 'Monthly P&L summary with variance analysis vs budget.',
    type: 'Finance',
    status: 'error',
    date: 'Mar 5, 2025',
    size: '—',
    pages: '—',
    starred: false,
    icon: FileText,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
]

const reportTypes = ['All', 'Revenue', 'AI Insight', 'Marketing', 'Forecast', 'Finance']

const summaryStats = [
  { label: 'Total Reports', value: '16', icon: FileText, color: 'text-cyan-400', bg: 'from-cyan-500/15 to-cyan-500/5', border: 'border-cyan-500/20' },
  { label: 'Generated This Month', value: '6', icon: Plus, color: 'text-emerald-400', bg: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/20' },
  { label: 'Scheduled', value: '3', icon: Calendar, color: 'text-violet-400', bg: 'from-violet-500/15 to-violet-500/5', border: 'border-violet-500/20' },
  { label: 'Starred', value: '2', icon: Star, color: 'text-amber-400', bg: 'from-amber-500/15 to-amber-500/5', border: 'border-amber-500/20' },
]

const statusBadge = (status) => {
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

export default function ReportsSection() {
  const [activeType, setActiveType] = useState('All')
  const [search, setSearch] = useState('')
  const [starred, setStarred] = useState({ 1: true, 2: true })
  const [showGenerate, setShowGenerate] = useState(false)

  const filtered = reports.filter((r) => {
    const matchType = activeType === 'All' || r.type === activeType
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const toggleStar = (id) => setStarred((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="space-y-6">

      {/* Summary Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => {
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search reports..."
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 glass border border-white/8 rounded-xl p-1">
            {reportTypes.map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ' +
                  (activeType === t
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-500 hover:text-white')
                }
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
          const Icon = report.icon
          const isStarred = starred[report.id]
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleStar(report.id)}
                      className={'p-1.5 rounded-lg transition-colors ' + (isStarred ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400')}
                    >
                      {isStarred ? <Star size={15} fill="currentColor" /> : <StarOff size={15} />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed mb-4">{report.desc}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock size={11} /> {report.date}</span>
                    {report.pages !== '—' && <span className="flex items-center gap-1"><FileText size={11} /> {report.pages} pages</span>}
                    {report.size !== '—' && <span>{report.size}</span>}
                  </div>
                  {statusBadge(report.status)}
                </div>
              </div>

              {/* Action Bar */}
              <div className="border-t border-white/5 px-5 py-3 flex items-center gap-2 bg-white/1">
                {report.status === 'ready' && (
                  <>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/8 text-gray-400 hover:text-white text-xs font-medium transition-all hover:border-cyan-500/30">
                      <Eye size={12} /> Preview
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 text-xs font-medium transition-all">
                      <Download size={12} /> Download
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/8 text-gray-400 hover:text-white text-xs font-medium transition-all ml-auto">
                      <Share2 size={12} /> Share
                    </button>
                  </>
                )}
                {report.status === 'generating' && (
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <RefreshCw size={12} className="animate-spin" />
                    <span>AI is generating your report… this may take a moment</span>
                  </div>
                )}
                {report.status === 'error' && (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle size={12} /> Generation failed</span>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium transition-all hover:bg-rose-500/20">
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

      {/* Generate Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGenerate(false)}>
          <div className="glass-card rounded-3xl border border-white/10 p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Generate New Report</h3>
                <p className="text-gray-500 text-xs">AI will analyze your data and build a report</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Report Title</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all" placeholder="e.g. Q1 Sales Performance" />
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
              <div>
                <label className="text-xs text-gray-400 font-medium mb-2 block">Data Source</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-cyan-500/40 transition-all">
                  <option className="bg-gray-900">sales_data_2024.csv</option>
                  <option className="bg-gray-900">customer_report.xlsx</option>
                  <option className="bg-gray-900">inventory_nov.csv</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowGenerate(false)} className="flex-1 py-2.5 rounded-xl glass border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-all">
                  Cancel
                </button>
                <button onClick={() => setShowGenerate(false)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <Brain size={15} /> Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}