import { useState } from 'react'
import {
  User, Mail, Building, MapPin, Calendar,
  BarChart3, Database, MessageSquare, FileText,
  Star, Clock, TrendingUp, Edit3, Check,
  Globe, Twitter, Linkedin, Award, Zap
} from 'lucide-react'

const activityData = [
  { day: 'Mon', queries: 42 },
  { day: 'Tue', queries: 78 },
  { day: 'Wed', queries: 55 },
  { day: 'Thu', queries: 91 },
  { day: 'Fri', queries: 110 },
  { day: 'Sat', queries: 38 },
  { day: 'Sun', queries: 24 },
]
const maxQ = Math.max(...activityData.map((d) => d.queries))

const recentSessions = [
  { file: 'sales_data_2024.csv', action: 'Analyzed with AI', time: '2 min ago', icon: MessageSquare, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { file: 'customer_report.xlsx', action: 'Generated report', time: '1 hr ago', icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { file: 'marketing_q4.json', action: 'Uploaded dataset', time: '3 hr ago', icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { file: 'inventory_nov.csv', action: 'Created 3 charts', time: 'Yesterday', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { file: 'finance_summary.xlsx', action: 'Analyzed with AI', time: '2 days ago', icon: MessageSquare, color: 'text-violet-400', bg: 'bg-violet-500/10' },
]

const achievements = [
  { label: 'Data Explorer', desc: 'Uploaded first dataset', earned: true, icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { label: 'Insight Seeker', desc: '100+ AI queries', earned: true, icon: MessageSquare, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { label: 'Chart Master', desc: '50+ charts created', earned: true, icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Power User', desc: '1000+ queries sent', earned: true, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'Report Pro', desc: 'Generate 10 reports', earned: false, icon: FileText, color: 'text-gray-500', bg: 'bg-white/5' },
  { label: 'Data Wizard', desc: 'Analyze 50 datasets', earned: false, icon: Award, color: 'text-gray-500', bg: 'bg-white/5' },
]

const statsRow = [
  { label: 'Datasets', value: '24', icon: Database, color: 'text-cyan-400' },
  { label: 'AI Queries', value: '1,284', icon: MessageSquare, color: 'text-violet-400' },
  { label: 'Charts', value: '89', icon: BarChart3, color: 'text-emerald-400' },
  { label: 'Reports', value: '16', icon: FileText, color: 'text-amber-400' },
]

export default function ProfileSection({ onNavigate }) {
  const [editBio, setEditBio] = useState(false)
  const [bio, setBio] = useState('Data analyst passionate about turning raw numbers into actionable business insights. Focused on sales, marketing, and customer analytics.')
  const [tempBio, setTempBio] = useState(bio)

  const saveBio = () => { setBio(tempBio); setEditBio(false) }

  return (
    <div className="max-w-4xl space-y-6">

      {/* Hero Card */}
      <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-cyan-500/20 via-violet-500/15 to-teal-500/20 relative">
          <div className="absolute inset-0 opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #22d3ee22 0%, transparent 60%), radial-gradient(circle at 80% 50%, #a78bfa22 0%, transparent 60%)' }} />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-10 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-3xl border-4 border-[#0a0f1e]">
                A
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0a0f1e]" />
            </div>
            <button
              onClick={() => onNavigate && onNavigate('settings')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-gray-300 text-sm font-medium hover:text-white hover:border-white/20 transition-all"
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          </div>

          {/* Name & meta */}
          <h2 className="text-xl font-extrabold text-white">Analyst</h2>
          <p className="text-gray-400 text-sm mt-0.5">Data Analyst · DataMind Inc.</p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><MapPin size={11} /> Chennai, Tamil Nadu</span>
            <span className="flex items-center gap-1"><Mail size={11} /> analyst@datamind.ai</span>
            <span className="flex items-center gap-1"><Calendar size={11} /> Joined Jan 2025</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Star size={10} fill="currentColor" /> Pro Plan
            </span>
          </div>

          {/* Bio */}
          <div className="mt-4">
            {editBio ? (
              <div>
                <textarea
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-cyan-500/30 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none resize-none transition-all"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={saveBio} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-all">
                    <Check size={12} /> Save
                  </button>
                  <button onClick={() => { setTempBio(bio); setEditBio(false) }} className="px-4 py-1.5 rounded-lg glass border border-white/10 text-gray-400 text-xs font-medium hover:text-white transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 group">
                <p className="text-sm text-gray-400 leading-relaxed flex-1">{bio}</p>
                <button onClick={() => setEditBio(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-gray-600 hover:text-cyan-400">
                  <Edit3 size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Social links */}
          <div className="flex items-center gap-2 mt-4">
            {[
              { icon: Globe, label: 'Website' },
              { icon: Twitter, label: 'Twitter' },
              { icon: Linkedin, label: 'LinkedIn' },
            ].map((s) => (
              <button key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-white/8 text-gray-500 hover:text-white text-xs transition-all">
                <s.icon size={12} /> {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statsRow.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="glass-card rounded-2xl border border-white/5 p-4 text-center hover:border-white/10 transition-all">
              <Icon size={20} className={s.color + ' mx-auto mb-2'} />
              <div className="text-2xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Activity + Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Weekly Activity Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-white/5 p-6">
          <h3 className="font-bold text-white text-base mb-1">This Week</h3>
          <p className="text-gray-500 text-xs mb-5">AI queries per day</p>
          <div className="flex items-end gap-2 h-28">
            {activityData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-gradient-to-t from-cyan-500 to-teal-400 opacity-80 transition-all duration-500"
                  style={{ height: (d.queries / maxQ * 100) + '%', minHeight: '4px' }} />
                <span className="text-xs text-gray-600">{d.day}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-white">438</p>
              <p className="text-xs text-gray-500">Total queries this week</p>
            </div>
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={11} /> +22% vs last week
            </span>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="lg:col-span-3 glass-card rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white text-base">Recent Activity</h3>
              <p className="text-gray-500 text-xs mt-0.5">Your latest actions on the platform</p>
            </div>
            <Clock size={16} className="text-gray-600" />
          </div>
          <div className="space-y-4">
            {recentSessions.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ' + s.bg}>
                    <Icon size={15} className={s.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.file}</p>
                    <p className="text-xs text-gray-500">{s.action}</p>
                  </div>
                  <span className="text-xs text-gray-600 flex-shrink-0">{s.time}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="glass-card rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-white text-base">Achievements</h3>
            <p className="text-gray-500 text-xs mt-0.5">4 of 6 unlocked</p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(4)].map((_, i) => <Star key={i} size={13} className="text-amber-400" fill="currentColor" />)}
            {[...Array(2)].map((_, i) => <Star key={i} size={13} className="text-gray-700" />)}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {achievements.map((a, i) => {
            const Icon = a.icon
            return (
              <div key={i} className={'flex items-center gap-3 p-3 rounded-xl border transition-all ' +
                (a.earned ? 'border-white/8 bg-white/2' : 'border-white/4 bg-white/1 opacity-50')}>
                <div className={'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ' + a.bg}>
                  <Icon size={16} className={a.color} />
                </div>
                <div className="min-w-0">
                  <p className={'text-xs font-semibold truncate ' + (a.earned ? 'text-white' : 'text-gray-500')}>{a.label}</p>
                  <p className="text-xs text-gray-600 truncate">{a.desc}</p>
                </div>
                {a.earned && <Check size={12} className="text-emerald-400 flex-shrink-0 ml-auto" />}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}