import { TrendingUp, Brain, Construction, ArrowRight } from 'lucide-react'

const PLANNED_FEATURES = [
  {
    title: 'Time-series trend analysis',
    desc:  'Detect upward / downward trends, seasonality, and anomalies in date-stamped data.',
    needs: 'A date or timestamp column',
  },
  {
    title: 'Funnel & conversion analytics',
    desc:  'Step-by-step funnel analysis across user-defined stages with drop-off rates.',
    needs: 'Columns mapping users to event stages',
  },
  {
    title: 'Cohort retention',
    desc:  'Track how groups of users retain over time after a starting event.',
    needs: 'User identifiers + timestamps spanning multiple periods',
  },
  {
    title: 'Correlation explorer',
    desc:  'Automatically surface the strongest relationships between numeric columns.',
    needs: 'Multiple numeric columns',
  },
  {
    title: 'Segment comparison',
    desc:  'Compare metrics across categorical segments with statistical significance.',
    needs: 'A categorical column + at least one numeric column',
  },
]

export default function AnalyticsSection({ onNavigate }) {
  return (
    <div className="space-y-6">

      {/* Header card */}
      <div className="glass-card rounded-2xl border border-white/5 p-8 text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 items-center justify-center mb-4">
          <Construction size={28} className="text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Advanced Analytics — Coming Soon</h2>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Generic CSV data can be analyzed in many ways, but features like funnels, cohorts, and time-series
          trends need columns of specific shapes. The Analytics module is being designed to detect those shapes
          automatically and offer the right analyses for each dataset.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button onClick={() => onNavigate?.('charts')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
            <TrendingUp size={14} /> Explore Charts
          </button>
          <button onClick={() => onNavigate?.('chat')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-white/10 text-gray-300 hover:text-white hover:border-white/20 text-sm font-semibold transition-all">
            <Brain size={14} /> Ask AI directly
          </button>
        </div>
      </div>

      {/* Planned features list */}
      <div>
        <h3 className="text-white font-bold text-lg mb-4">What's planned</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PLANNED_FEATURES.map((f, i) => (
            <div key={i} className="glass-card rounded-2xl border border-white/5 p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/8 border border-violet-500/15 flex items-center justify-center flex-shrink-0">
                  <ArrowRight size={15} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white">{f.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{f.desc}</p>
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="text-gray-500 font-medium">Requires:</span> {f.needs}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Closing note */}
      <div className="rounded-2xl bg-cyan-500/5 border border-cyan-500/15 p-5 text-center">
        <p className="text-sm text-gray-300">
          In the meantime, the <strong className="text-cyan-400">AI Chat</strong> can answer most analytical
          questions about your data right now — averages, trends, comparisons, summaries — by simply asking in
          plain English.
        </p>
      </div>

    </div>
  )
}