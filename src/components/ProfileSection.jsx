import { useState, useEffect } from 'react'
import {
  User, Mail, BarChart3, Database,
  MessageSquare, FileText, Star, TrendingUp,
  Edit3, Check, Award, Zap, Lock,
  Eye, EyeOff, Save, AlertCircle,
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

// ── Activity chart data ───────────────────────────────────────────────────────
const activityData = [
  { day: 'Mon', queries: 42  },
  { day: 'Tue', queries: 78  },
  { day: 'Wed', queries: 55  },
  { day: 'Thu', queries: 91  },
  { day: 'Fri', queries: 110 },
  { day: 'Sat', queries: 38  },
  { day: 'Sun', queries: 24  },
]
const maxQ = Math.max(...activityData.map((d) => d.queries))

// ── Achievements ──────────────────────────────────────────────────────────────
const achievements = [
  { label: 'Data Explorer',  desc: 'Uploaded first dataset',  earned: true,  icon: Database,      color: 'text-cyan-400',    bg: 'bg-cyan-500/10'    },
  { label: 'Insight Seeker', desc: '100+ AI queries',         earned: true,  icon: MessageSquare, color: 'text-violet-400',  bg: 'bg-violet-500/10'  },
  { label: 'Chart Master',   desc: '50+ charts created',      earned: true,  icon: BarChart3,     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Power User',     desc: '1000+ queries sent',      earned: true,  icon: Zap,           color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
  { label: 'Report Pro',     desc: 'Generate 10 reports',     earned: false, icon: FileText,      color: 'text-gray-500',    bg: 'bg-white/5'        },
  { label: 'Data Wizard',    desc: 'Analyze 50 datasets',     earned: false, icon: Award,         color: 'text-gray-500',    bg: 'bg-white/5'        },
]

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

  // Sync when user loads
  useEffect(() => {
    if (user) {
      setName(user.name     || '')
      setNickname(user.nickname || '')
      setEmail(user.email   || '')
    }
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

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-cyan-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Hero Card ── */}
      <div className="glass-card rounded-3xl border border-white/5 overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-cyan-500/20 via-violet-500/15 to-teal-500/20 relative">
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 50%, #22d3ee22 0%, transparent 60%), radial-gradient(circle at 80% 50%, #a78bfa22 0%, transparent 60%)',
            }}
          />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + Edit button */}
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-10 mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-3xl border-4 border-[#0a0f1e]">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0a0f1e]" />
            </div>
            <button
              onClick={() => {
                setEditProfile(!editProfile)
                setProfileMsg({ type: '', text: '' })
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 text-gray-300 text-sm font-medium hover:text-white hover:border-white/20 transition-all"
            >
              <Edit3 size={14} />
              {editProfile ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Alert message */}
          {profileMsg.text && (
            <div className="mb-4">
              <Alert
                type={profileMsg.type}
                message={profileMsg.text}
                onDismiss={() => setProfileMsg({ type: '', text: '' })}
              />
            </div>
          )}

          {/* View mode */}
          {!editProfile ? (
            <>
              <h2 className="text-xl font-extrabold text-white">{user.name || 'User'}</h2>
              <p className="text-gray-400 text-sm mt-0.5">
                {user.nickname && (
                  <span className="text-cyan-400 font-medium">@{user.nickname}</span>
                )}
                {user.plan && (
                  <span className="ml-2 text-gray-500">· {user.plan} Plan</span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Mail size={11} /> {user.email}
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Star size={10} fill="currentColor" /> {user.plan || 'Free'} Plan
                </span>
              </div>
            </>
          ) : (
            /* Edit mode */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Nickname */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Nickname <span className="text-gray-600">(display name)</span>
                  </label>
                  <div className="relative">
                    <Smile size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="How should we call you?"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Save button */}
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
              >
                {savingProfile
                  ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                  : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Change Password ── */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <button
          onClick={() => {
            setShowPassSection(!showPassSection)
            setPassMsg({ type: '', text: '' })
          }}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Key size={16} className="text-violet-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Change Password</p>
              <p className="text-xs text-gray-500">Update your account password</p>
            </div>
          </div>
          <div className={'w-5 h-5 rounded-full border flex items-center justify-center transition-all ' +
            (showPassSection ? 'border-cyan-400 bg-cyan-500/20' : 'border-white/20')}>
            <div className={'w-1.5 h-1.5 rounded-full transition-all ' +
              (showPassSection ? 'bg-cyan-400' : 'bg-white/20')} />
          </div>
        </button>

        {showPassSection && (
          <div className="px-6 pb-6 space-y-4 border-t border-white/5 pt-5">
            {passMsg.text && (
              <Alert
                type={passMsg.type}
                message={passMsg.text}
                onDismiss={() => setPassMsg({ type: '', text: '' })}
              />
            )}

            {/* Current password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* New password */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {newPass.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={'flex-1 h-1 rounded-full transition-all duration-300 ' +
                            (i <= strength ? strengthColors[strength] : 'bg-white/10')}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Strength:{' '}
                      <span className={
                        strength >= 3 ? 'text-emerald-400' :
                        strength >= 2 ? 'text-amber-400' : 'text-rose-400'
                      }>
                        {strengthLabels[strength]}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="••••••••"
                    className={'w-full bg-white/5 border rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-all ' +
                      (confirmPass.length > 0
                        ? passesMatch
                          ? 'border-emerald-500/40 focus:border-emerald-500/60'
                          : 'border-rose-500/40 focus:border-rose-500/60'
                        : 'border-white/10 focus:border-cyan-500/50')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
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

            <button
              onClick={handleSavePassword}
              disabled={savingPass}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-60"
            >
              {savingPass
                ? <><Loader2 size={14} className="animate-spin" /> Updating…</>
                : <><Key size={14} /> Update Password</>}
            </button>
          </div>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Datasets',   icon: Database,      color: 'text-cyan-400'    },
          { label: 'AI Queries', icon: MessageSquare, color: 'text-violet-400'  },
          { label: 'Charts',     icon: BarChart3,     color: 'text-emerald-400' },
          { label: 'Reports',    icon: FileText,      color: 'text-amber-400'   },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="glass-card rounded-2xl border border-white/5 p-4 text-center hover:border-white/10 transition-all">
              <Icon size={20} className={s.color + ' mx-auto mb-2'} />
              <div className="text-2xl font-extrabold text-white">—</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* ── Weekly Activity ── */}
      <div className="glass-card rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-white text-base">This Week</h3>
            <p className="text-gray-500 text-xs mt-0.5">AI queries per day</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp size={13} />
            +22% vs last week
          </div>
        </div>
        <div className="flex items-end gap-2 h-28">
          {activityData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-cyan-500 to-teal-400 opacity-80 transition-all duration-500"
                style={{ height: (d.queries / maxQ * 100) + '%', minHeight: '4px' }}
              />
              <span className="text-xs text-gray-600">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-white">438</p>
            <p className="text-xs text-gray-500">Total queries this week</p>
          </div>
          <button
            onClick={() => onNavigate?.('analytics')}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View Analytics →
          </button>
        </div>
      </div>

      {/* ── Achievements ── */}
      <div className="glass-card rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-white text-base">Achievements</h3>
            <p className="text-gray-500 text-xs mt-0.5">4 of 6 unlocked</p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(4)].map((_, i) => (
              <Star key={i} size={13} className="text-amber-400" fill="currentColor" />
            ))}
            {[...Array(2)].map((_, i) => (
              <Star key={i} size={13} className="text-gray-700" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((a, i) => {
            const Icon = a.icon
            return (
              <div
                key={i}
                className={'flex items-center gap-3 p-3 rounded-xl border transition-all ' +
                  (a.earned ? 'border-white/8 bg-white/2' : 'border-white/4 bg-white/1 opacity-50')}
              >
                <div className={'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ' + a.bg}>
                  <Icon size={16} className={a.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={'text-xs font-semibold truncate ' + (a.earned ? 'text-white' : 'text-gray-500')}>
                    {a.label}
                  </p>
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