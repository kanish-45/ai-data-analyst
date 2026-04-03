import { useState } from 'react'
import {
  User, Bell, Key, Palette, Shield, Trash2,
  ChevronRight, Check, Eye, EyeOff, Copy,
  RefreshCw, Save, AlertTriangle, Moon, Sun,
  Monitor, Mail, MessageSquare, TrendingUp, Database
} from 'lucide-react'

const sidebarSections = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'danger', label: 'Danger Zone', icon: Trash2 },
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

function Input({ value, onChange, type = 'text', placeholder, disabled }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={
        'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all ' +
        (disabled ? 'opacity-50 cursor-not-allowed' : '')
      }
    />
  )
}

function Toggle({ enabled, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={
          'relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ' +
          (enabled ? 'bg-cyan-500' : 'bg-white/10')
        }
      >
        <span
          className={
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ' +
            (enabled ? 'translate-x-5' : 'translate-x-0')
          }
        />
      </button>
    </div>
  )
}

const apiKeys = [
  { name: 'Production Key', key: 'sk-dm-prod-••••••••••••••••4f2a', created: 'Jan 12, 2025', last: '2 min ago', active: true },
  { name: 'Development Key', key: 'sk-dm-dev-••••••••••••••••9c1b', created: 'Feb 4, 2025', last: '3 days ago', active: true },
  { name: 'Old Key', key: 'sk-dm-old-••••••••••••••••3d8e', created: 'Oct 1, 2024', last: 'Never', active: false },
]

export default function SettingsSection() {
  const [active, setActive] = useState('account')
  const [saved, setSaved] = useState(false)

  // Account
  const [name, setName] = useState('Analyst')
  const [email, setEmail] = useState('analyst@datamind.ai')
  const [company, setCompany] = useState('DataMind Inc.')
  const [role, setRole] = useState('Data Analyst')

  // Notifications
  const [notifs, setNotifs] = useState({
    analysisComplete: true,
    weeklyReport: true,
    aiInsights: false,
    billing: true,
    product: false,
  })

  // Appearance
  const [theme, setTheme] = useState('dark')
  const [density, setDensity] = useState('comfortable')
  const [accentColor, setAccentColor] = useState('cyan')

  // Security
  const [showPass, setShowPass] = useState(false)
  const [twoFA, setTwoFA] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('30')

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const themes = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'light', label: 'Light', icon: Sun },
  ]

  const accents = [
    { id: 'cyan', color: 'bg-cyan-400' },
    { id: 'violet', color: 'bg-violet-400' },
    { id: 'emerald', color: 'bg-emerald-400' },
    { id: 'amber', color: 'bg-amber-400' },
    { id: 'rose', color: 'bg-rose-400' },
  ]

  const densities = ['compact', 'comfortable', 'spacious']

  return (
    <div className="flex gap-6 max-w-5xl">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0">
        {sidebarSections.map((s) => {
          const Icon = s.icon
          const isDanger = s.id === 'danger'
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ' +
                (active === s.id
                  ? isDanger
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : isDanger
                  ? 'text-rose-500 hover:bg-rose-500/5'
                  : 'text-gray-500 hover:text-white hover:bg-white/5')
              }
            >
              <Icon size={16} className="flex-shrink-0" />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Mobile tab strip */}
      <div className="flex lg:hidden gap-1 overflow-x-auto pb-1 w-full">
        {sidebarSections.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ' +
                (active === s.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 glass border border-white/8 hover:text-white')
              }
            >
              <Icon size={13} /> {s.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5 min-w-0">

        {/* ── ACCOUNT ── */}
        {active === 'account' && (
          <>
            <Section title="Profile Information" subtitle="Update your name, email and company details">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {name.charAt(0)}
                </div>
                <div>
                  <button className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">Change avatar</button>
                  <p className="text-xs text-gray-600 mt-0.5">JPG, PNG or GIF · Max 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </Field>
                <Field label="Email Address">
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </Field>
                <Field label="Company">
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
                </Field>
                <Field label="Job Role">
                  <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role" />
                </Field>
              </div>
            </Section>

            <Section title="Plan & Billing" subtitle="Your current subscription details">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
                <div>
                  <p className="font-semibold text-white">Pro Plan</p>
                  <p className="text-xs text-gray-400 mt-0.5">Renews on April 27, 2025 · $49/mo</p>
                </div>
                <button className="px-4 py-2 rounded-xl glass border border-white/10 text-sm text-gray-300 hover:text-white hover:border-white/20 transition-all">
                  Manage Plan
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Datasets', used: 24, total: 100 },
                  { label: 'AI Queries', used: 1284, total: 5000 },
                  { label: 'Storage', used: 9.1, total: 50, unit: 'GB' },
                ].map((u) => (
                  <div key={u.label} className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">{u.label}</p>
                    <p className="text-sm font-semibold text-white">{u.used}{u.unit || ''} <span className="text-gray-600 font-normal">/ {u.total}{u.unit || ''}</span></p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400"
                        style={{ width: (u.used / u.total * 100) + '%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <div className="flex justify-end">
              <button onClick={handleSave}
                className={'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ' +
                  (saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90 hover:scale-105 active:scale-95')}>
                {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
              </button>
            </div>
          </>
        )}

        {/* ── NOTIFICATIONS ── */}
        {active === 'notifications' && (
          <Section title="Notification Preferences" subtitle="Choose what you want to be notified about">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Activity</p>
              <div className="space-y-4">
                <Toggle enabled={notifs.analysisComplete} onChange={(v) => setNotifs({ ...notifs, analysisComplete: v })}
                  label="Analysis Complete" desc="Get notified when AI finishes analyzing your dataset" />
                <Toggle enabled={notifs.aiInsights} onChange={(v) => setNotifs({ ...notifs, aiInsights: v })}
                  label="AI Insights" desc="Proactive suggestions based on your data patterns" />
              </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Reports</p>
              <div className="space-y-4">
                <Toggle enabled={notifs.weeklyReport} onChange={(v) => setNotifs({ ...notifs, weeklyReport: v })}
                  label="Weekly Summary Report" desc="A digest of your data activity every Monday" />
              </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Account</p>
              <div className="space-y-4">
                <Toggle enabled={notifs.billing} onChange={(v) => setNotifs({ ...notifs, billing: v })}
                  label="Billing & Invoices" desc="Receipts, renewal reminders, and payment issues" />
                <Toggle enabled={notifs.product} onChange={(v) => setNotifs({ ...notifs, product: v })}
                  label="Product Updates" desc="New features, improvements and announcements" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleSave}
                className={'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ' +
                  (saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90')}>
                {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save</>}
              </button>
            </div>
          </Section>
        )}

        {/* ── API KEYS ── */}
        {active === 'api' && (
          <>
            <Section title="API Keys" subtitle="Use these keys to access the DataMind API from your own apps">
              <div className="space-y-3">
                {apiKeys.map((k, i) => (
                  <div key={i} className={'flex items-center gap-4 p-4 rounded-xl border transition-all ' +
                    (k.active ? 'bg-white/2 border-white/8' : 'bg-white/1 border-white/4 opacity-60')}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{k.name}</span>
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (k.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500')}>
                          {k.active ? 'Active' : 'Revoked'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-gray-400">{k.key}</p>
                      <p className="text-xs text-gray-600 mt-1">Created {k.created} · Last used {k.last}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button className="p-2 rounded-lg glass text-gray-500 hover:text-cyan-400 transition-colors"><Copy size={13} /></button>
                      {k.active && <button className="p-2 rounded-lg glass text-gray-500 hover:text-rose-400 transition-colors"><Trash2 size={13} /></button>}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-white/10 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30 text-sm font-medium transition-all">
                <Key size={15} /> Generate New API Key
              </button>
            </Section>

            <Section title="Usage Limits" subtitle="Your current API usage this billing period">
              <div className="space-y-4">
                {[
                  { label: 'API Requests', used: 8420, total: 50000, color: 'from-cyan-500 to-teal-400' },
                  { label: 'AI Tokens Used', used: 1240000, total: 5000000, color: 'from-violet-500 to-purple-400' },
                  { label: 'Compute Minutes', used: 340, total: 1000, color: 'from-emerald-500 to-green-400' },
                ].map((u) => (
                  <div key={u.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-gray-300">{u.label}</span>
                      <span className="text-xs text-gray-500">{u.used.toLocaleString()} / {u.total.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div className={'h-full rounded-full bg-gradient-to-r ' + u.color} style={{ width: (u.used / u.total * 100) + '%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        {/* ── APPEARANCE ── */}
        {active === 'appearance' && (
          <Section title="Appearance" subtitle="Customize how DataMind AI looks for you">
            <Field label="Theme">
              <div className="flex gap-3 mt-1">
                {themes.map((t) => {
                  const Icon = t.icon
                  return (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={'flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ' +
                        (theme === t.id ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-white/8 glass text-gray-400 hover:text-white hover:border-white/20')}>
                      <Icon size={20} />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="Accent Color">
              <div className="flex items-center gap-3 mt-1">
                {accents.map((a) => (
                  <button key={a.id} onClick={() => setAccentColor(a.id)}
                    className={'w-8 h-8 rounded-full ' + a.color + ' flex items-center justify-center transition-all ' +
                      (accentColor === a.id ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0f1e] scale-110' : 'opacity-70 hover:opacity-100')}>
                    {accentColor === a.id && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Layout Density" hint="Controls spacing between elements across the dashboard">
              <div className="flex gap-2 mt-1">
                {densities.map((d) => (
                  <button key={d} onClick={() => setDensity(d)}
                    className={'flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-all border ' +
                      (density === d ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'border-white/8 glass text-gray-500 hover:text-white')}>
                    {d}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex justify-end pt-2">
              <button onClick={handleSave}
                className={'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ' +
                  (saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90')}>
                {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save</>}
              </button>
            </div>
          </Section>
        )}

        {/* ── SECURITY ── */}
        {active === 'security' && (
          <>
            <Section title="Change Password" subtitle="Use a strong, unique password">
              <Field label="Current Password">
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all pr-10" />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="New Password">
                  <input type="password" placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all" />
                </Field>
                <Field label="Confirm New Password">
                  <input type="password" placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all" />
                </Field>
              </div>
              <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
                Update Password
              </button>
            </Section>

            <Section title="Two-Factor Authentication" subtitle="Add an extra layer of security to your account">
              <Toggle enabled={twoFA} onChange={setTwoFA}
                label="Enable 2FA" desc="Require a verification code on every login" />
              {twoFA && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-sm text-emerald-400 font-medium">2FA is enabled</p>
                  <p className="text-xs text-gray-400 mt-1">Your account is protected with an authenticator app.</p>
                  <button className="mt-3 text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    <RefreshCw size={11} /> Regenerate backup codes
                  </button>
                </div>
              )}
            </Section>

            <Section title="Active Sessions" subtitle="Devices currently signed into your account">
              {[
                { device: 'Chrome on macOS', location: 'Chennai, IN', time: 'Active now', current: true },
                { device: 'Safari on iPhone', location: 'Chennai, IN', time: '2 hours ago', current: false },
                { device: 'Firefox on Windows', location: 'Mumbai, IN', time: '5 days ago', current: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium flex items-center gap-2">
                      {s.device}
                      {s.current && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Current</span>}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.location} · {s.time}</p>
                  </div>
                  {!s.current && (
                    <button className="text-xs text-rose-400 hover:text-rose-300 transition-colors">Revoke</button>
                  )}
                </div>
              ))}
            </Section>
          </>
        )}

        {/* ── DANGER ZONE ── */}
        {active === 'danger' && (
          <Section title="Danger Zone" subtitle="These actions are irreversible. Please proceed with caution.">
            <div className="space-y-4">
              {[
                {
                  title: 'Clear All Datasets',
                  desc: 'Permanently delete all uploaded datasets and their associated analyses.',
                  btn: 'Clear Datasets',
                  color: 'border-amber-500/20 bg-amber-500/5',
                  btnColor: 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20',
                },
                {
                  title: 'Export All Data',
                  desc: 'Download a copy of all your data, reports, and settings before deleting.',
                  btn: 'Export Data',
                  color: 'border-cyan-500/20 bg-cyan-500/5',
                  btnColor: 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20',
                },
                {
                  title: 'Delete Account',
                  desc: 'Permanently delete your account and all associated data. This cannot be undone.',
                  btn: 'Delete Account',
                  color: 'border-rose-500/20 bg-rose-500/5',
                  btnColor: 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20',
                },
              ].map((item, i) => (
                <div key={i} className={'flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border ' + item.color}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <button className={'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ' + item.btnColor}>
                    {item.btn}
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}