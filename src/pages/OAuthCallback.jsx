import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE = 'https://ai-data-analyst-backend-xj17.onrender.com/api'

export default function OAuthCallback() {
  const navigate         = useNavigate()
  const { setSession }   = useAuth()
  const [status,   setStatus]   = useState('loading') // 'loading' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // The token (or error) arrives in the URL fragment, e.g.
    //   /oauth/callback#token=eyJhbGc...
    //   /oauth/callback#error=Google%20sign-in%20failed.
    const hash   = window.location.hash.slice(1) // strip the '#'
    const params = new URLSearchParams(hash)
    const token  = params.get('token')
    const error  = params.get('error')

    // Clean the URL right away so the token doesn't sit in history
    window.history.replaceState({}, document.title, '/oauth/callback')

    if (error) {
      setErrorMsg(error)
      setStatus('error')
      return
    }

    if (!token) {
      setErrorMsg('No sign-in token was returned. Please try again.')
      setStatus('error')
      return
    }

    // Store the token, then fetch the user with it and finish login
    ;(async () => {
      try {
        localStorage.setItem('datamind_token', token)

        const res  = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()

        if (!res.ok) throw new Error(data.message || 'Failed to load your profile.')

        // Hand the user off to AuthContext so the rest of the app reacts to login
        setSession(token, data.user)

        // Off to the landing page (matches the destination used after normal login)
        navigate('/', { replace: true })
      } catch (err) {
        localStorage.removeItem('datamind_token')
        setErrorMsg(err.message || 'Something went wrong while signing you in.')
        setStatus('error')
      }
    })()
  }, [navigate, setSession])

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-violet-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Brain size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            DataMind <span className="text-cyan-400">AI</span>
          </span>
        </div>

        <div className="glass-card rounded-3xl border border-white/8 p-8 shadow-2xl shadow-black/40 text-center">
          {status === 'loading' && (
            <>
              <Loader2 size={32} className="text-cyan-400 animate-spin mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-1">Signing you in…</h1>
              <p className="text-sm text-gray-400">Just a moment while we get things ready.</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle size={32} className="text-rose-400 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-1">Sign-in failed</h1>
              <p className="text-sm text-gray-400 mb-6">{errorMsg}</p>
              <button
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 transition-all"
              >
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}