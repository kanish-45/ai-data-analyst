import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Brain, Mail, Lock, Eye, EyeOff, User, Smile,
  AlertCircle, ArrowRight, CheckCircle2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const strengthLevels = [
  { label: 'Too short', color: 'bg-rose-500'    },
  { label: 'Weak',      color: 'bg-rose-400'    },
  { label: 'Fair',      color: 'bg-amber-400'   },
  { label: 'Good',      color: 'bg-emerald-400' },
  { label: 'Strong',    color: 'bg-emerald-400' },
]

function getStrength(p) {
  if (p.length < 6) return 0
  let s = 1
  if (p.length >= 8)          s++
  if (/[A-Z]/.test(p))        s++
  if (/[0-9]/.test(p))        s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return Math.min(s, 4)
}

const requirements = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8   },
  { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p) => /[0-9]/.test(p) },
]

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate   = useNavigate()

  const [name,      setName]      = useState('')
  const [nickname,  setNickname]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [agreed,    setAgreed]    = useState(false)

  const strength       = getStrength(password)
  const strengthInfo   = strengthLevels[strength]
  const passwordsMatch = confirm.length > 0 && password === confirm

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !nickname || !email || !password || !confirm) {
      setError('Please fill in all fields.')
      return
    }
    if (password !== confirm) { setError('Passwords do not match.');            return }
    if (password.length < 8)  { setError('Password must be at least 8 chars.'); return }
    if (!agreed)               { setError('Please accept the terms.');           return }

    setError('')
    setLoading(true)
    try {
      await signup(name, nickname, email, password)
      navigate('/')   // ← go to landing page after signup
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Brain size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            DataMind <span className="text-cyan-400">AI</span>
          </span>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl border border-white/8 p-8 shadow-2xl shadow-black/40">
          <div className="mb-7">
            <h1 className="text-2xl font-extrabold text-white mb-1">Create your account</h1>
            <p className="text-gray-400 text-sm">Start analyzing your data for free</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-5">
              <AlertCircle size={15} className="text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  autoComplete="name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>

            {/* Nickname — how to call them */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                What should we call you?
              </label>
              <div className="relative">
                <Smile size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Jane, JD, Captain..."
                  autoComplete="nickname"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1.5">
                This is how DataMind AI will greet you
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1.5">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={'flex-1 h-1 rounded-full transition-all duration-300 ' +
                        (i <= strength ? strengthInfo.color : 'bg-white/10')} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Strength:{' '}
                    <span className={strength >= 3 ? 'text-emerald-400' : strength >= 2 ? 'text-amber-400' : 'text-rose-400'}>
                      {strengthInfo.label}
                    </span>
                  </p>
                  <div className="mt-2 space-y-1">
                    {requirements.map((req) => (
                      <div key={req.label} className="flex items-center gap-1.5">
                        <CheckCircle2 size={11} className={req.test(password) ? 'text-emerald-400' : 'text-gray-600'} />
                        <span className={'text-xs ' + (req.test(password) ? 'text-gray-400' : 'text-gray-600')}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showConf ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={'w-full bg-white/5 border rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all ' +
                    (confirm.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-500/40 focus:border-emerald-500/60'
                        : 'border-rose-500/40 focus:border-rose-500/60'
                      : 'border-white/10 focus:border-cyan-500/50')}
                />
                <button type="button" onClick={() => setShowConf(!showConf)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                {confirm.length > 0 && (
                  <div className="absolute right-9 top-1/2 -translate-y-1/2">
                    {passwordsMatch
                      ? <CheckCircle2 size={14} className="text-emerald-400" />
                      : <AlertCircle  size={14} className="text-rose-400"    />}
                  </div>
                )}
              </div>
              {confirm.length > 0 && !passwordsMatch && (
                <p className="text-xs text-rose-400 mt-1.5">Passwords do not match</p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5 pt-1">
              <button type="button" onClick={() => setAgreed(!agreed)}
                className={'w-4 h-4 rounded flex items-center justify-center transition-all border flex-shrink-0 mt-0.5 ' +
                  (agreed ? 'bg-cyan-500 border-cyan-500' : 'bg-white/5 border-white/15 hover:border-white/30')}>
                {agreed && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <span className="text-xs text-gray-400 leading-relaxed select-none cursor-pointer" onClick={() => setAgreed(!agreed)}>
                I agree to the{' '}
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">Privacy Policy</a>
              </span>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 mt-1 shadow-lg shadow-cyan-500/20">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</>
                : <>Create account <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}