import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Calendar, Download, Filter, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

const revenueYoY = [
  { month: 'Jan', current: 42000, previous: 31000 },
  { month: 'Feb', current: 38000, previous: 28000 },
  { month: 'Mar', current: 55000, previous: 39000 },
  { month: 'Apr', current: 48000, previous: 35000 },
  { month: 'May', current: 63000, previous: 44000 },
  { month: 'Jun', current: 71000, previous: 52000 },
  { month: 'Jul', current: 68000, previous: 49000 },
  { month: 'Aug', current: 79000, previous: 58000 },
  { month: 'Sep', current: 85000, previous: 61000 },
  { month: 'Oct', current: 92000, previous: 67000 },
  { month: 'Nov', current: 98000, previous: 72000 },
  { month: 'Dec', current: 110000, previous: 80000 },
]

const funnelSteps = [
  { stage: 'Visitors', value: 84200, pct: 100, color: '#22d3ee' },
  { stage: 'Leads', value: 21400, pct: 25.4, color: '#34d399' },
  { stage: 'Prospects', value: 8900, pct: 10.6, color: '#a78bfa' },
  { stage: 'Customers', value: 4100, pct: 4.87, color: '#fbbf24' },
]

const channelData = [
  { channel: 'Organic', sessions: 18400, conversions: 920 },
  { channel: 'Paid', sessions: 11200, conversions: 640 },
  { channel: 'Email', sessions: 7800, conversions: 510 },
  { channel: 'Social', sessions: 5900, conversions: 270 },
  { channel: 'Direct', sessions: 4200, conversions: 310 },
]

const cohortRows = [
  { cohort: 'Jan cohort', w0: 100, w1: 68, w2: 52, w3: 44, w4: 38, w5: 33, w6: 29 },
  { cohort: 'Feb cohort', w0: 100, w1: 71, w2: 55, w3: 47, w4: 40, w5: 36, w6: 31 },
  { cohort: 'Mar cohort', w0: 100, w1: 65, w2: 49, w3: 41, w4: 35, w5: 30, w6: 27 },
  { cohort: 'Apr cohort', w0: 100, w1: 73, w2: 58, w3: 50, w4: 43, w5: 38, w6: null },
  { cohort: 'May cohort', w0: 100, w1: 69, w2: 54, w3: 46, w4: null, w5: null, w6: null },
]
const cohortCols = ['w0','w1','w2','w3','w4','w5','w6']
const cohortLabels = ['Week 0','Week 1','Week 2','Week 3','Week 4','Week 5','Week 6']

const growthData = [
  { month: 'Jan', mrr: 38000, churn: 4.2 },
  { month: 'Feb', mrr: 41000, churn: 3.8 },
  { month: 'Mar', mrr: 47000, churn: 3.5 },
  { month: 'Apr', mrr: 52000, churn: 4.1 },
  { month: 'May', mrr: 58000, churn: 3.2 },
  { month: 'Jun', mrr: 65000, churn: 2.9 },
]

const ranges = ['7D','30D','90D','1Y']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass border border-white/10 rounded-xl px-4 py-3 text-sm">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-400 capitalize">{entry.name}:</span>
          <span className="text-white font-semibold">
            {entry.value > 999 ? '$' + (entry.value / 1000).toFixed(0) + 'k' : entry.value}
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
          <h3 className="font-bold text-white text-base">{title}</h3>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {badge && (
          <span className={'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ' + badge.cls}>
            {badge.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {badge.label}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

export default function AnalyticsSection() {
  const [range, setRange] = useState('30D')

  const heatColor = (val) => {
    if (val === null) return { bg: 'bg-white/3', text: 'text-gray-700', label: '—' }
    if (val >= 70) return { bg: 'bg-cyan-500/25', text: 'text-cyan-300', label: val + '%' }
    if (val >= 50) return { bg: 'bg-cyan-500/15', text: 'text-cyan-400', label: val + '%' }
    if (val >= 35) return { bg: 'bg-violet-500/15', text: 'text-violet-400', label: val + '%' }
    return { bg: 'bg-white/5', text: 'text-gray-500', label: val + '%' }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 glass border border-white/8 rounded-xl p-1">
          {ranges.map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ' +
                (range === r ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-white')}>
              {r}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/8 text-gray-400 hover:text-white text-sm transition-all">
            <Calendar size={14} /> Mar 2025
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/8 text-gray-400 hover:text-white text-sm transition-all">
            <Filter size={14} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Insight Banner */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-violet-500/10 border border-cyan-500/15 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <TrendingUp size={20} className="text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Revenue up 37.5% year-over-year</p>
            <p className="text-gray-400 text-xs mt-0.5">Strongest growth in Nov–Dec. Churn rate trending down for 3 consecutive months.</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
          View full report <ArrowRight size={12} />
        </button>
      </div>

      {/* Row 1: YoY Revenue + MRR */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ChartCard title="Revenue Year-over-Year" subtitle="2024 vs 2023 monthly comparison"
            badge={{ label: '+37.5%', up: true, cls: 'bg-emerald-500/10 text-emerald-400' }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueYoY} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="aCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + v/1000 + 'k'} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px', paddingTop: '12px' }} />
                <Area type="monotone" dataKey="current" stroke="#22d3ee" strokeWidth={2.5} fill="url(#aCurrent)" name="2024" />
                <Area type="monotone" dataKey="previous" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 4" fill="url(#aPrev)" name="2023" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard title="MRR Growth vs Churn" subtitle="Monthly recurring revenue & churn %">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={growthData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => '$' + v/1000 + 'k'} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v + '%'} />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="left" type="monotone" dataKey="mrr" stroke="#34d399" strokeWidth={2.5} dot={false} name="MRR" />
                <Line yAxisId="right" type="monotone" dataKey="churn" stroke="#f87171" strokeWidth={2} strokeDasharray="4 3" dot={false} name="Churn %" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Row 2: Funnel + Channel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Conversion Funnel" subtitle="Visitor → Lead → Prospect → Customer">
          <div className="space-y-3">
            {funnelSteps.map((step, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: step.color }} />
                    <span className="text-sm text-gray-300 font-medium">{step.stage}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{step.value.toLocaleString()}</span>
                    <span className="text-xs font-bold w-12 text-right" style={{ color: step.color }}>{step.pct}%</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: step.pct + '%', backgroundColor: step.color, opacity: 0.8 }} />
                </div>
                {i < funnelSteps.length - 1 && (
                  <div className="text-xs text-gray-600 mt-1.5 pl-4">
                    ↓ {((funnelSteps[i+1].value / step.value) * 100).toFixed(1)}% pass through
                  </div>
                )}
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Traffic by Channel" subtitle="Sessions and conversions per acquisition channel">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={channelData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="channel" type="category" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} width={58} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="sessions" name="Sessions" fill="#22d3ee" opacity={0.65} radius={[0,4,4,0]} />
              <Bar dataKey="conversions" name="Conversions" fill="#a78bfa" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Cohort Heatmap */}
      <ChartCard title="Cohort Retention Heatmap" subtitle="Weekly user retention by signup cohort — color intensity = retention strength">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-gray-500 font-medium pb-3 pr-6 text-xs">Cohort</th>
                {cohortLabels.map((l) => (
                  <th key={l} className="text-center text-gray-500 font-medium pb-3 px-2 text-xs">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortRows.map((row, i) => (
                <tr key={i}>
                  <td className="text-gray-400 py-1.5 pr-6 text-xs font-medium whitespace-nowrap">{row.cohort}</td>
                  {cohortCols.map((col) => {
                    const cell = heatColor(row[col])
                    return (
                      <td key={col} className="py-1.5 px-2 text-center">
                        <span className={'inline-flex items-center justify-center w-14 py-1.5 rounded-lg text-xs font-semibold ' + cell.bg + ' ' + cell.text}>
                          {cell.label}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <span className="text-xs text-gray-500">Retention strength:</span>
          {[
            { label: '≥70%', cls: 'bg-cyan-500/25 text-cyan-300' },
            { label: '50–70%', cls: 'bg-cyan-500/15 text-cyan-400' },
            { label: '35–50%', cls: 'bg-violet-500/15 text-violet-400' },
            { label: '<35%', cls: 'bg-white/5 text-gray-500' },
          ].map((l) => (
            <span key={l.label} className={'text-xs px-2.5 py-1 rounded-lg ' + l.cls}>{l.label}</span>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}