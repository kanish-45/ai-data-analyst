import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react'

// ──────────────────────────────────────────────────────────────────────────────
// Toast system — no external library, fully styled to match the rest of the app.
//
// Usage:
//   const toast = useToast()
//   toast.success('Dataset uploaded')
//   toast.error('Upload failed', 'File was too large')
//   toast.info('AI is thinking…')
//   toast.warning('Connection unstable')
//
// Toasts auto-dismiss after 4s (errors after 6s). Pass `duration: 0` to make
// them sticky. Toasts stack at the top-right of the screen.
// ──────────────────────────────────────────────────────────────────────────────

const ToastContext = createContext(null)

const VARIANTS = {
  success: { icon: CheckCircle,    color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  error:   { icon: AlertCircle,    color: 'text-rose-400',    border: 'border-rose-500/30',    bg: 'bg-rose-500/10'    },
  info:    { icon: Info,           color: 'text-cyan-400',    border: 'border-cyan-500/30',    bg: 'bg-cyan-500/10'    },
  warning: { icon: AlertTriangle,  color: 'text-amber-400',   border: 'border-amber-500/30',   bg: 'bg-amber-500/10'   },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((curr) => curr.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((variant, title, description, duration) => {
    const id           = Date.now() + Math.random()
    const defaultDur   = variant === 'error' ? 6000 : 4000
    const finalDur     = duration ?? defaultDur

    setToasts((curr) => [...curr, { id, variant, title, description }])

    if (finalDur > 0) {
      setTimeout(() => dismiss(id), finalDur)
    }
    return id
  }, [dismiss])

  const api = {
    success: (title, description, duration) => push('success', title, description, duration),
    error:   (title, description, duration) => push('error',   title, description, duration),
    info:    (title, description, duration) => push('info',    title, description, duration),
    warning: (title, description, duration) => push('warning', title, description, duration),
    dismiss,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ── Visible viewport (top-right, stacked) ─────────────────────────────────────
function ToastViewport({ toasts, onDismiss }) {
  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-sm w-full sm:w-auto"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  const { variant, title, description } = toast
  const v = VARIANTS[variant] || VARIANTS.info
  const Icon = v.icon

  // Slide-in animation
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      role="status"
      className={
        'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl shadow-black/40 transition-all duration-300 ' +
        v.bg + ' ' + v.border + ' ' +
        (mounted ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0')
      }
    >
      <div className={'flex-shrink-0 mt-0.5 ' + v.color}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{title}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-1 leading-snug">{description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 text-gray-500 hover:text-white transition-colors -m-1 p-1"
      >
        <X size={14} />
      </button>
    </div>
  )
}