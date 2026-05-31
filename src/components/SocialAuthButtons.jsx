import { useState } from 'react'

// Backend URL — same one your AuthContext already uses
const API_BASE = 'https://ai-data-analyst-backend-xj17.onrender.com/api'

// Brand-coloured logos (inline SVG so no extra packages needed)
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.5 34.7 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.4 35.9 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  )
}

function GitHubLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.9C23.5 5.7 18.3.5 12 .5z"/>
    </svg>
  )
}

export default function SocialAuthButtons({ label = 'Continue with' }) {
  // Track which provider is "in flight" to give visual feedback during redirect
  const [redirecting, setRedirecting] = useState(null) // 'google' | 'github' | null

  const handleSocialLogin = (provider) => {
    setRedirecting(provider)
    // Full-page redirect to your backend, which then redirects to Google/GitHub
    window.location.href = `${API_BASE}/auth/${provider}`
  }

  const baseClass =
    'w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border text-sm font-medium ' +
    'transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100'

  return (
    <div className="space-y-2.5">
      {/* Google */}
      <button
        type="button"
        onClick={() => handleSocialLogin('google')}
        disabled={!!redirecting}
        className={`${baseClass} bg-white hover:bg-gray-100 text-gray-800 border-white/10`}
      >
        {redirecting === 'google'
          ? <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
          : <GoogleLogo />}
        <span>{label} Google</span>
      </button>

      {/* GitHub */}
      <button
        type="button"
        onClick={() => handleSocialLogin('github')}
        disabled={!!redirecting}
        className={`${baseClass} bg-[#24292f] hover:bg-[#1c2024] text-white border-white/10`}
      >
        {redirecting === 'github'
          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <GitHubLogo />}
        <span>{label} GitHub</span>
      </button>
    </div>
  )
}