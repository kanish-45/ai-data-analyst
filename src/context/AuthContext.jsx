import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

// ── API base URL ──────────────────────────────────────────────────────────────
const API = 'https://ai-data-analyst-backend-xj17.onrender.com/api'

// ── Token helpers ─────────────────────────────────────────────────────────────
function getToken()        { return localStorage.getItem('datamind_token') }
function saveToken(token)  { localStorage.setItem('datamind_token', token) }
function clearToken()      { localStorage.removeItem('datamind_token') }

// ── User session helpers ──────────────────────────────────────────────────────
function getStoredUser()   {
  try { return JSON.parse(localStorage.getItem('datamind_user') || 'null') }
  catch { return null }
}
function saveUser(user)    { localStorage.setItem('datamind_user', JSON.stringify(user)) }
function clearUser()       { localStorage.removeItem('datamind_user') }

// ── API call helper ───────────────────────────────────────────────────────────
async function apiCall(endpoint, options = {}) {
  const token = getToken()

  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`)
  }

  return data
}

// ── Auth Provider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  // Initialize from localStorage so the user stays logged in on refresh
  const [user, setUser] = useState(() => getStoredUser())

  // ── Signup ──────────────────────────────────────────────────────────────────
  const signup = useCallback(async (name, nickname, email, password) => {
    const data = await apiCall('/auth/signup', {
      method: 'POST',
      body:   JSON.stringify({ name, nickname, email, password }),
    })

    saveToken(data.token)
    saveUser(data.user)
    setUser(data.user)
    return data.user
  }, [])

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    })

    saveToken(data.token)
    saveUser(data.user)
    setUser(data.user)
    return data.user
  }, [])

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearToken()
    clearUser()
    setUser(null)
  }, [])

  // ── Refresh user from server ────────────────────────────────────────────────
  // Call this if you need the latest user data from the DB
  const refreshUser = useCallback(async () => {
    try {
      const data = await apiCall('/auth/me')
      saveUser(data.user)
      setUser(data.user)
      return data.user
    } catch {
      // Token expired or invalid — log out
      clearToken()
      clearUser()
      setUser(null)
      return null
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}