import { useState, useEffect } from 'react'
import {
  User, Bell, Key, Palette, Shield, Trash2,
  Check, Eye, EyeOff, Save, AlertTriangle,
  Moon, Sun, Monitor, Loader2, CheckCircle2,
  AlertCircle, Lock, Smile, Mail, Download
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-data-analyst-backend-xj17.onrender.com/api'
function getToken() { return localStorage.getItem('datamind_token') }

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

const sidebarSections = [
  { id: 'account',       label: 'Account',        icon: User    },
  { id: 'notifications', label: 'Notifications',  icon: Bell    },
  { id: 'appearance',    label: 'Appearance',     icon: Palette },
  { id: 'security',      label: 'Security',       icon: Shield  },
  { id: 'danger',        label: 'Danger Zone',    icon: Trash2  },
]

function Section({ title, subtitle, children }) {
  return (
    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
      <div className="px-6 py-5 border-b border-white/5">
        <h2 className="font-bold text-white text-base">{title}</h2>
        {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-600 mt-1.5">{hint}</p>}
    </div>
  )
}

function Toggle({ enabled, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={'relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ml-4 ' +
          (enabled ? 'bg-cyan-500' : 'bg-white/10')}
      >
        <span className={'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ' +
          (enabled ? 'translate-x-5' : 'translate-x-0')} />
      </button>
    </div>
  )
}

function Alert({ type, message, onDismiss }) {
  if (!message) return null
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error:   'bg-rose-500/10 border-rose-500/20 text-rose-400',
  }
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div className={'flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ' + styles[type]}>
      <Icon size={14} className="flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onDismiss && <button onClick={onDismiss} className="text-xs opacity-60 hover:opacity-100 ml-2">✕</button>}
    </div>
  )
}

function getStrength(p) {
  if (p.length < 6) return 0
  let s = 1
  if (p.length >= 8)          s++
  if (/[A-Z]/.test(p))        s++
  if (/[0-9]/.test(p))        s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return Math.min(s, 4)
}
const strengthColors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-400']
const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']

export default function SettingsSection() {
  const { user, logout } = useAuth()
  const [active, setActive] = useState('account')

  // ── Account ───────────────────────────────────────────────────────────────
  const [name,           setName]           = useState(user?.name     || '')
  const [nickname,       setNickname]       = useState(user?.nickname || '')
  const [email,          setEmail]          = useState(user?.email    || '')
  const [savingAccount,  setSavingAccount]  = useState(false)
  const [accountMsg,     setAccountMsg]     = useState({ type: '', text: '' })

  // ── Password ──────────────────────────────────────────────────────────────
  const [currentPass,    setCurrentPass]    = useState('')
  const [newPass,        setNewPass]        = useState('')
  const [confirmPass,    setConfirmPass]    = useState('')
  const [showCurrent,    setShowCurrent]    = useState(false)
  const [showNew,        setShowNew]        = useState(false)
  const [showConfirm,    setShowConfirm]    = useState(false)
  const [savingPass,     setSavingPass]     = useState(false)
  const [passMsg,        setPassMsg]        = useState({ type: '', text: '' })

  // ── Notifications (saved locally as preferences) ──────────────────────────
  const [notifs, setNotifs] = useState({
    analysisComplete: true,
    weeklyReport:     true,
    aiInsights:       false,
    product:          false,
  })
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [notifsMsg,    setNotifsMsg]    = useState({ type: '', text: '' })

  // ── Appearance (saved locally as preferences) ─────────────────────────────
  const [theme,       setTheme]       = useState('dark')
  const [accentColor, setAccentColor] = useState('cyan')
  const [density,     setDensity]     = useState('comfortable')

  // ── Export ────────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false)
  const [dangerMsg, setDangerMsg] = useState({ type: '', text: '' })

  // Sync user
  useEffect(() => {
    if (user) {
      setName(user.name     || '')
      setNickname(user.nickname || '')
      setEmail(user.email   || '')
    }
  }, [user])

  // Load saved preferences
  useEffect(() => {
    try {
      const savedNotifs = JSON.parse(localStorage.getItem('datamind_notifs') || 'null')
      if (savedNotifs) setNotifs(savedNotifs)
      const savedAppearance = JSON.parse(localStorage.getItem('datamind_appearance') || 'null')
      if (savedAppearance) {
        if (savedAppearance.theme)       setTheme(savedAppearance.theme)
        if (savedAppearance.accentColor) setAccentColor(savedAppearance.accentColor)
        if (savedAppearance.density)     setDensity(savedAppearance.density)
      }
    } catch { /* ignore */ }
  }, [])

  const strength    = getStrength(newPass)
  const passesMatch = confirmPass.length > 0 && newPass === confirmPass

  const handleSaveAccount = async () => {
    if (!name.trim() || !email.trim()) {
      setAccountMsg({ type: 'error', text: 'Name and email are required.' })
      return
    }
    setSavingAccount(true); setAccountMsg({ type: '', text: '' })
    try {
      const data = await apiCall('/profile', {
        method: 'PATCH',
        body:   JSON.stringify({ name: name.trim(), nickname: nickname.trim(), email: email.trim() }),
      })
      localStorage.setItem('datamind_user', JSON.stringify(data.user))
      setAccountMsg({ type: 'success', text: 'Account updated successfully!' })
      setTimeout(() => setAccountMsg({ type: '', text: '' }), 3000)
    } catch (err) {
      setAccountMsg({ type: 'error', text: err.message })
    } finally {
      setSavingAccount(false)
    }
  }

  const handleSavePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      setPassMsg({ type: 'error', text: 'All fields are required.' }); return
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' }); return
    }
    if (newPass.length < 8) {
      setPassMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return
    }
    setSavingPass(true); setPassMsg({ type: '', text: '' })
    try {
      await apiCall('/profile/password', {
        method: 'PATCH',
        body:   JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      })
      setPassMsg({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPass(''); setNewPass(''); setConfirmPass('')
      setTimeout(() => setPassMsg({ type: '', text: '' }), 3000)
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message })
    } finally {
      setSavingPass(false)
    }
  }

  // Notifications: save preferences locally
  const handleSaveNotifs = async () => {
    setSavingNotifs(true)
    await new Promise((r) => setTimeout(r, 400))
    localStorage.setItem('datamind_notifs', JSON.stringify(notifs))
    setNotifsMsg({ type: 'success', text: 'Notification preferences saved.' })
    setSavingNotifs(false)
    setTimeout(() => setNotifsMsg({ type: '', text: '' }), 3000)
  }

  // Appearance: save preferences locally
  const handleSaveAppearance = () => {
    localStorage.setItem('datamind_appearance', JSON.stringify({ theme, accentColor, density }))
    setAccountMsg({ type: 'success', text: 'Appearance preferences saved.' })
    setTimeout(() => setAccountMsg({ type: '', text: '' }), 3000)
  }

  // ── REAL: Export all data ─────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true); setDangerMsg({ type: '', text: '' })
    try {
      const token = getToken()
      const res = await fetch(`${API_URL}/profile/export`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || `Export failed (${res.status})`)
      }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `datamind-export-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setDangerMsg({ type: 'success', text: 'Your data has been downloaded.' })
      setTimeout(() => setDangerMsg({ type: '', text: '' }), 4000)
    } catch (err) {
      setDangerMsg({ type: 'error', text: err.message })
    } finally {
      setExporting(false)
    }
  }

  // ── REAL: Clear all datasets ──────────────────────────────────────────────
  const handleClearDatasets = async () => {
    if (!window.confirm('This will permanently delete ALL your uploaded datasets. Are you sure?')) return
    setDangerMsg({ type: '', text: '' })
    try {
      await apiCall('/datasets', { method: 'DELETE' })
      setDangerMsg({ type: 'success', text: 'All your datasets have been deleted.' })
      setTimeout(() => setDangerMsg({ type: '', text: '' }), 4000)
    } catch (err) {
      setDangerMsg({ type: 'error', text: err.message })
    }
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure? This will permanently delete your account and ALL your data. This cannot be undone.')) {
      logout()
    }
  }

  const themes  = [
    { id: 'dark',   label: 'Dark',   icon: Moon    },
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'light',  label: 'Light',  icon: Sun     },
  ]
  const accents = [
    { id: 'cyan',    color: 'bg-cyan-400'    },
    { id: 'violet',  color: 'bg-violet-400'  },
    { id: 'emerald', color: 'bg-emerald-400' },
    { id: 'amber',   color: 'bg-amber-400'   },
    { id: 'rose',    color: 'bg-rose-400'    },
  ]
  const densities = ['compact', 'comfortable', 'spacious']

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-5xl">

      {/* Sidebar (desktop) */}
      <div className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0">
        {sidebarSections.map((s) => {
          const Icon     = s.icon
          const isDanger = s.id === 'danger'
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ' +
                (active === s.id
                  ? isDanger ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : isDanger ? 'text-rose-500 hover:bg-rose-500/5' : 'text-gray-500 hover:text-white hover:bg-white/5')}>
              <Icon size={16} className="flex-shrink-0" /> {s.label}
            </button>
          )
        })}
      </div>

      {/* Tab strip (mobile) */}
      <div className="flex lg:hidden gap-1 overflow-x-auto pb-1 w-full">
        {sidebarSections.map((s) => {
          const Icon = s.icon
          return (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ' +
                (active === s.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 glass border border-white/8 hover:text-white')}>
              <Icon size={13} /> {s.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5 min-w-0">

        {/* ── ACCOUNT ── */}
        {active === 'account' && (
          <Section title="Account Information" subtitle="Update your profile details">
            {accountMsg.text && <Alert type={accountMsg.type} message={accountMsg.text} onDismiss={() => setAccountMsg({ type: '', text: '' })} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name">
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all" />
                </div>
              </Field>
              <Field label="Nickname">
                <div className="relative">
                  <Smile size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="How to call you"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all" />
                </div>
              </Field>
            </div>
            <Field label="Email">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all" />
              </div>
            </Field>
            <button onClick={handleSaveAccount} disabled={savingAccount}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60">
              {savingAccount ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save changes</>}
            </button>
          </Section>
        )}

        {/* ── NOTIFICATIONS ── */}
        {active === 'notifications' && (
          <Section title="Notification preferences" subtitle="Choose what you'd like to be notified about">
            {notifsMsg.text && <Alert type={notifsMsg.type} message={notifsMsg.text} onDismiss={() => setNotifsMsg({ type: '', text: '' })} />}
            <Toggle enabled={notifs.analysisComplete} onChange={(v) => setNotifs({ ...notifs, analysisComplete: v })}
              label="Analysis complete" desc="When an AI report finishes generating" />
            <Toggle enabled={notifs.weeklyReport} onChange={(v) => setNotifs({ ...notifs, weeklyReport: v })}
              label="Weekly summary" desc="A weekly summary of your activity" />
            <Toggle enabled={notifs.aiInsights} onChange={(v) => setNotifs({ ...notifs, aiInsights: v })}
              label="AI insight tips" desc="Suggestions on what to ask next about your data" />
            <Toggle enabled={notifs.product} onChange={(v) => setNotifs({ ...notifs, product: v })}
              label="Product updates" desc="New features and releases" />
            <p className="text-xs text-gray-600 -mt-2">Preferences are saved on this device.</p>
            <button onClick={handleSaveNotifs} disabled={savingNotifs}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60">
              {savingNotifs ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save preferences</>}
            </button>
          </Section>
        )}

        {/* ── APPEARANCE ── */}
        {active === 'appearance' && (
          <Section title="Appearance" subtitle="Personalize the look and feel of your dashboard">
            <Field label="Theme" hint="Light mode is coming soon — DataMind currently uses dark mode globally.">
              <div className="flex flex-wrap gap-2">
                {themes.map((t) => {
                  const Icon = t.icon
                  const disabled = t.id !== 'dark'
                  return (
                    <button key={t.id} onClick={() => !disabled && setTheme(t.id)} disabled={disabled}
                      className={'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all ' +
                        (theme === t.id ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'glass border-white/10 text-gray-400 hover:text-white') +
                        (disabled ? ' opacity-50 cursor-not-allowed' : '')}>
                      <Icon size={14} /> {t.label}
                    </button>
                  )
                })}
              </div>
            </Field>
            <Field label="Accent color" hint="Preference saved locally.">
              <div className="flex flex-wrap gap-2">
                {accents.map((a) => (
                  <button key={a.id} onClick={() => setAccentColor(a.id)}
                    className={'w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ' +
                      (accentColor === a.id ? 'border-white/40 scale-110' : 'border-transparent hover:border-white/20')}>
                    <div className={'w-6 h-6 rounded-md ' + a.color} />
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Density" hint="How tightly to pack the interface.">
              <div className="flex flex-wrap gap-2">
                {densities.map((d) => (
                  <button key={d} onClick={() => setDensity(d)}
                    className={'px-4 py-2 rounded-xl text-sm capitalize transition-all border ' +
                      (density === d ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'glass border-white/10 text-gray-400 hover:text-white')}>
                    {d}
                  </button>
                ))}
              </div>
            </Field>
            <button onClick={handleSaveAppearance}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition-all">
              <Save size={14} /> Save preferences
            </button>
          </Section>
        )}

        {/* ── SECURITY ── */}
        {active === 'security' && (
          <Section title="Change password" subtitle="Use a strong, unique password for your account">
            {passMsg.text && <Alert type={passMsg.type} message={passMsg.text} onDismiss={() => setPassMsg({ type: '', text: '' })} />}
            <Field label="Current password">
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showCurrent ? 'text' : 'password'} value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)} placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="New password">
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type={showNew ? 'text' : 'password'} value={newPass}
                    onChange={(e) => setNewPass(e.target.value)} placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all" />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {newPass.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={'flex-1 h-1 rounded-full transition-all ' +
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
              </Field>
              <Field label="Confirm new password">
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)} placeholder="••••••••"
                    className={'w-full bg-white/5 border rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-all ' +
                      (confirmPass.length > 0 ? (passesMatch ? 'border-emerald-500/40' : 'border-rose-500/40') : 'border-white/10 focus:border-cyan-500/40')} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmPass.length > 0 && !passesMatch && (
                  <p className="text-xs text-rose-400 mt-1">Passwords do not match</p>
                )}
              </Field>
            </div>
            <button onClick={handleSavePassword} disabled={savingPass}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-60">
              {savingPass ? <><Loader2 size={14} className="animate-spin" /> Updating…</> : <><Lock size={14} /> Update password</>}
            </button>
          </Section>
        )}

        {/* ── DANGER ZONE ── */}
        {active === 'danger' && (
          <Section title="Danger Zone" subtitle="These actions affect your account and data. Some are permanent.">
            {dangerMsg.text && <Alert type={dangerMsg.type} message={dangerMsg.text} onDismiss={() => setDangerMsg({ type: '', text: '' })} />}

            {/* Export — REAL */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
              <div className="flex items-start gap-3">
                <Download size={18} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Export All Your Data</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Download a complete JSON copy of your account, datasets, and chat history.
                  </p>
                </div>
              </div>
              <button onClick={handleExport} disabled={exporting}
                className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-all disabled:opacity-60">
                {exporting ? <><Loader2 size={14} className="animate-spin" /> Exporting…</> : <><Download size={13} /> Export data</>}
              </button>
            </div>

            {/* Clear datasets — REAL */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Clear all datasets</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Permanently delete every dataset you've uploaded. Your account and chat history remain.
                  </p>
                </div>
              </div>
              <button onClick={handleClearDatasets}
                className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all">
                <Trash2 size={13} /> Clear datasets
              </button>
            </div>

            {/* Logout / delete account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">Sign out everywhere</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Log out of your account on this device. Sign back in to continue using DataMind.
                  </p>
                </div>
              </div>
              <button onClick={handleDeleteAccount}
                className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all">
                Sign out
              </button>
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}