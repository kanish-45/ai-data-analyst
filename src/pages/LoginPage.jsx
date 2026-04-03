import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Brain, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')   // ← always go to landing page after login
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fill demo credentials
  const fillDemo = () => {
    setEmail('demo@datamind.ai')
    setPassword('Demo1234')
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

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
            <h1 className="text-2xl font-extrabold text-white mb-1">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to continue to your dashboard</p>
          </div>

          {/* Demo banner */}
          <button type="button" onClick={fillDemo}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/8 border border-cyan-500/20 text-cyan-400 text-sm mb-5 hover:bg-cyan-500/15 transition-all">
            <Sparkles size={14} />
            <span>Use demo account</span>
            <span className="ml-auto text-xs text-gray-500">demo@datamind.ai</span>
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-gray-600">or sign in with email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-5">
              <AlertCircle size={15} className="text-rose-400 flex-shrink-0" />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400">Password</label>
                <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 mt-2 shadow-lg shadow-cyan-500/20">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                : <>Sign in <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Create one free</Link>
        </p>
      </div>
    </div>
  )
}