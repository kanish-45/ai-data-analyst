import { useState, useEffect } from 'react'
import {
  User, Mail, BarChart3, Database,
  MessageSquare, FileText,
  Edit3, Lock, Eye, EyeOff, Save, AlertCircle,
  CheckCircle2, Loader2, Key, Smile
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-data-analyst-backend-xj17.onrender.com/api'

function getToken() {
  return localStorage.getItem('datamind_token')
}

async function apiCall(endpoint, options = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`)
  return data
}

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(p) {
  if (p.length < 6) return 0
  let s = 1
  if (p.length >= 8)           s++
  if (/[A-Z]/.test(p))         s++
  if (/[0-9]/.test(p))         s++
  if (/[^A-Za-z0-9]/.test(p))  s++
  return Math.min(s, 4)
}
const strengthColors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-400']
const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']

// ── Alert ─────────────────────────────────────────────────────────────────────
function Alert({ type, message, onDismiss }) {
  if (!message) return null
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error:   'bg-rose-500/10 border-rose-500/20 text-rose-400',
  }
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div className={'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ' + styles[type]}>
      <Icon size={15} className="flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-xs opacity-60 hover:opacity-100 ml-2">✕</button>
      )}
    </div>
  )
}

// Count locally-stored reports for the current user
function getReportCount(userId) {
  try {
    const data = JSON.parse(localStorage.getItem(`datamind_reports_${userId || 'guest'}`) || '[]')
    return Array.isArray(data) ? data.length : 0
  } catch { return 0 }
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProfileSection({ onNavigate }) {
  const { user } = useAuth()

  // ── Profile edit ──────────────────────────────────────────────────────────
  const [editProfile,    setEditProfile]    = useState(false)
  const [name,           setName]           = useState('')
  const [nickname,       setNickname]       = useState('')
  const [email,          setEmail]          = useState('')
  const [savingProfile,  setSavingProfile]  = useState(false)
  const [profileMsg,     setProfileMsg]     = useState({ type: '', text: '' })

  // ── Password ──────────────────────────────────────────────────────────────
  const [showPassSection, setShowPassSection] = useState(false)
  const [currentPass,     setCurrentPass]     = useState('')
  const [newPass,         setNewPass]         = useState('')
  const [confirmPass,     setConfirmPass]     = useState('')
  const [showCurrent,     setShowCurrent]     = useState(false)
  const [showNew,         setShowNew]         = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [savingPass,      setSavingPass]      = useState(false)
  const [passMsg,         setPassMsg]         = useState({ type: '', text: '' })

  // ── Real stats from backend ───────────────────────────────────────────────
  const [stats,         setStats]         = useState(null)
  const [statsLoading,  setStatsLoading]  = useState(false)
  const [reportCount,   setReportCount]   = useState(0)

  // Sync when user loads
  useEffect(() => {
    if (user) {
      setName(user.name     || '')
      setNickname(user.nickname || '')
      setEmail(user.email   || '')
      setReportCount(getReportCount(user.id))
    }
  }, [user])

  // Load real stats
  useEffect(() => {
    if (!user) return
    setStatsLoading(true)
    apiCall('/stats/overview')
      .then((data) => setStats(data.stats))
      .catch((err) => console.error('Profile stats error:', err))
      .finally(() => setStatsLoading(false))
  }, [user])

  const strength    = getStrength(newPass)
  const passesMatch = confirmPass.length > 0 && newPass === confirmPass
  const displayName = user?.nickname || user?.name?.split(' ')[0] || 'User'

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!name.trim() || !nickname.trim() || !email.trim()) {
      setProfileMsg({ type: 'error', text: 'All fields are required.' })
      return
    }
    setSavingProfile(true)
    setProfileMsg({ type: '', text: '' })
    try {
      const data = await apiCall('/profile', {
        method: 'PATCH',
        body:   JSON.stringify({
          name:     name.trim(),
          nickname: nickname.trim(),
          email:    email.trim(),
        }),
      })
      localStorage.setItem('datamind_user', JSON.stringify(data.user))
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' })
      setEditProfile(false)
      setTimeout(() => setProfileMsg({ type: '', text: '' }), 3000)
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message })
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Save password ─────────────────────────────────────────────────────────
  const handleSavePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      setPassMsg({ type: 'error', text: 'All password fields are required.' })
      return
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPass.length < 8) {
      setPassMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setSavingPass(true)
    setPassMsg({ type: '', text: '' })
    try {
      await apiCall('/profile/password', {
        method: 'PATCH',
        body:   JSON.stringify({
          currentPassword: currentPass,
          newPassword:     newPass,
        }),
      })
      setPassMsg({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPass('')
      setNewPass('')
      setConfirmPass('')
      setShowPassSection(false)
      setTimeout(() => setPassMsg({ type: '', text: '' }), 3000)
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message })
    } finally {
      setSavingPass(false)
    }
  }

  // Stat cards — all real data
  const statCards = [
    { label: 'Datasets',     icon: Database,      color: 'text-cyan-400',    value: stats ? stats.totalDatasets : null     },
    { label: 'AI Messages',  icon: MessageSquare, color: 'text-violet-400',  value: stats ? stats.totalMessages : null     },
    { label: 'Chat Sessions',icon: BarChart3,     color: 'text-emerald-400', value: stats ? (stats.totalSessions ?? 0) : null },
    { label: 'Reports',      icon: FileText,      color: 'text-amber-400',   value: reportCount                            },
  ]

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Profile header / edit ── */}
      <div className="glass-card rounded-2xl border border-white/5 p-6">
        {profileMsg.text && (
          <div className="mb-4">
            <Alert type={profileMsg.type} message={profileMsg.text} onDismiss={() => setProfileMsg({ type: '', text: '' })} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-2xl font-extrabold flex-shrink-0 mx-auto sm:mx-0">
            {displayName.charAt(0).toUpperCase()}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h2 className="text-2xl font-extrabold text-white">{user?.name || 'Your Name'}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email || 'you@example.com'}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
              <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                {user?.plan || 'Free'} Plan
              </span>
              {user?.createdAt && (
                <span className="text-xs text-gray-500">
                  · Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>

          <button onClick={() => setEditProfile(!editProfile)}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-gray-300 hover:text-white hover:border-white/20 text-sm transition-all">
            <Edit3 size={13} />
            {editProfile ? 'Cancel' : 'Edit profile'}
          </button>
        </div>

        {editProfile && (
          <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Nickname</label>
                <div className="relative">
                  <Smile size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="How should we call you?"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
              </div>
            </div>
            <button onClick={handleSaveProfile} disabled={savingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60">
              {savingProfile
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : <><Save size={14} /> Save changes</>}
            </button>
          </div>
        )}
      </div>

      {/* ── Real Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="glass-card rounded-2xl border border-white/5 p-4 text-center hover:border-white/10 transition-all">
              <Icon size={20} className={s.color + ' mx-auto mb-2'} />
              <div className="text-2xl font-extrabold text-white">
                {statsLoading && s.value === null
                  ? <Loader2 size={20} className="animate-spin mx-auto text-gray-600" />
                  : s.value !== null ? s.value.toLocaleString() : '—'}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* ── Password Change ── */}
      <div className="glass-card rounded-2xl border border-white/5 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-white text-base">Password</h3>
            <p className="text-gray-500 text-xs mt-0.5">Use a strong, unique password</p>
          </div>
          <button onClick={() => setShowPassSection(!showPassSection)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-gray-300 hover:text-white hover:border-white/20 text-sm transition-all">
            <Key size={13} />
            {showPassSection ? 'Cancel' : 'Change password'}
          </button>
        </div>

        {passMsg.text && (
          <div className="mb-4">
            <Alert type={passMsg.type} message={passMsg.text} onDismiss={() => setPassMsg({ type: '', text: '' })} />
          </div>
        )}

        {showPassSection && (
          <div className="space-y-4 pt-4 border-t border-white/5">

            {/* Current */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showCurrent ? 'text' : 'password'} value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)} placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* New + Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type={showNew ? 'text' : 'password'} value={newPass}
                    onChange={(e) => setNewPass(e.target.value)} placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {newPass.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={'flex-1 h-1 rounded-full transition-all duration-300 ' +
                          (i <= strength ? strengthColors[strength] : 'bg-white/10')} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Strength: <span className={strength >= 3 ? 'text-emerald-400' : strength >= 2 ? 'text-amber-400' : 'text-rose-400'}>
                        {strengthLabels[strength]}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)} placeholder="••••••••"
                    className={'w-full bg-white/5 border rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-all ' +
                      (confirmPass.length > 0
                        ? passesMatch
                          ? 'border-emerald-500/40 focus:border-emerald-500/60'
                          : 'border-rose-500/40 focus:border-rose-500/60'
                        : 'border-white/10 focus:border-cyan-500/50')} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {confirmPass.length > 0 && (
                    <div className="absolute right-9 top-1/2 -translate-y-1/2">
                      {passesMatch
                        ? <CheckCircle2 size={13} className="text-emerald-400" />
                        : <AlertCircle  size={13} className="text-rose-400" />}
                    </div>
                  )}
                </div>
                {confirmPass.length > 0 && !passesMatch && (
                  <p className="text-xs text-rose-400 mt-1.5">Passwords do not match</p>
                )}
              </div>
            </div>

            <button onClick={handleSavePassword} disabled={savingPass}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60">
              {savingPass
                ? <><Loader2 size={14} className="animate-spin" /> Updating…</>
                : <><Key size={14} /> Update password</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}