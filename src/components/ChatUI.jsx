import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Brain, Send, User, Sparkles, BarChart3,
  TrendingUp, Database, RefreshCw, Copy,
  ThumbsUp, ThumbsDown, AlertCircle, ChevronDown,
  Check, Download, X, FileText, Settings,
  MessageSquare, Plus, Trash2, Clock,
  ChevronLeft, ChevronRight, Loader2
} from 'lucide-react'
import { useData, buildDatasetContext } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'

// ─── Config ────────────────────────────────────────────────────────────────────
const OLLAMA_URL    = 'http://localhost:11434/api/chat'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const DEFAULT_MODEL = 'llama3.2'

const AVAILABLE_MODELS = [
  { value: 'llama3.2',    label: 'Llama 3.2',   size: '2GB',   speed: 'Fast'     },
  { value: 'llama3.1',    label: 'Llama 3.1',   size: '4.7GB', speed: 'Smart'    },
  { value: 'mistral',     label: 'Mistral 7B',  size: '4.1GB', speed: 'Balanced' },
  { value: 'gemma2',      label: 'Gemma 2',     size: '5.4GB', speed: 'Smart'    },
  { value: 'phi3',        label: 'Phi-3 Mini',  size: '2.3GB', speed: 'Fastest'  },
  { value: 'qwen2.5',     label: 'Qwen 2.5',    size: '4.4GB', speed: 'Smart'    },
  { value: 'deepseek-r1', label: 'DeepSeek R1', size: '4.7GB', speed: 'Smartest' },
]

const BASE_SYSTEM_PROMPT = `You are DataMind AI, an expert data analyst assistant inside a modern analytics dashboard.

Your job is to help users understand their data and extract meaningful insights.

Rules:
- Always be concise — lead with the most important finding first.
- Use numbered lists or bullet points when listing multiple insights.
- Reference actual column names and real values from the dataset.
- If you can calculate something (sum, average, max, min, count), do it.
- Keep responses under 250 words unless a detailed breakdown is requested.
- Be friendly and professional — like a senior data analyst.
- If no dataset is loaded, remind the user to upload one first.
- Never make up data — only use what is provided in the dataset context.`

const SUGGESTIONS_WITH_DATA = [
  { icon: BarChart3,  text: 'Give me a full summary of this dataset'          },
  { icon: TrendingUp, text: 'What are the top trends in my data?'              },
  { icon: Database,   text: 'Show me min, max and average of each column'      },
  { icon: Sparkles,   text: 'What are 5 key insights from this data?'          },
]

const SUGGESTIONS_NO_DATA = [
  { icon: Database,   text: 'What file formats can I upload?'                  },
  { icon: BarChart3,  text: 'What kind of analysis can you do?'                },
  { icon: TrendingUp, text: 'How do I get started?'                            },
  { icon: Sparkles,   text: 'What insights can DataMind AI generate?'          },
]

const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// ─── API helpers ───────────────────────────────────────────────────────────────
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

// ─── Ollama streamer ───────────────────────────────────────────────────────────
async function streamOllama(history, model, systemPrompt, onToken) {
  const res = await fetch(OLLAMA_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream:   true,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
    }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    if (res.status === 404)
      throw new Error(`Model "${model}" not found. Run: ollama pull ${model}`)
    throw new Error(`Ollama error ${res.status}: ${txt}`)
  }

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let   full    = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value, { stream: true }).split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const token = JSON.parse(line)?.message?.content ?? ''
        if (token) { full += token; onToken(full) }
      } catch { /* skip */ }
    }
  }
  return full
}

// ─── Markdown renderer ─────────────────────────────────────────────────────────
function MessageText({ text }) {
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        if (/^\d+[.)]\s/.test(line.trim())) {
          const match = line.trim().match(/^(\d+[.)]\s*)(.*)/)
          return (
            <div key={i} className="flex gap-2">
              <span className="text-cyan-400 font-semibold flex-shrink-0">{match[1].trim()}</span>
              <span>{renderInlineBold(match[2])}</span>
            </div>
          )
        }
        if (/^[-•*]\s/.test(line.trim())) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-cyan-400 flex-shrink-0 mt-0.5">•</span>
              <span>{renderInlineBold(line.trim().replace(/^[-•*]\s/, ''))}</span>
            </div>
          )
        }
        return <p key={i}>{renderInlineBold(line)}</p>
      })}
    </div>
  )
}

function renderInlineBold(text) {
  if (!text.includes('**')) return text
  return text.split(/\*\*(.*?)\*\*/g).map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{p}</strong> : p
  )
}

// ─── Ollama setup guide ────────────────────────────────────────────────────────
function SetupGuide({ model, onDismiss }) {
  const steps = [
    { step: '1', label: 'Download & install Ollama', cmd: null, link: 'https://ollama.com' },
    { step: '2', label: 'Start Ollama with CORS',    cmd: `$env:OLLAMA_ORIGINS="*"; ollama serve`, link: null },
    { step: '3', label: 'Pull a model',              cmd: `ollama pull ${model}`, link: null },
  ]
  return (
    <div className="mb-4 flex-shrink-0 rounded-2xl bg-amber-500/8 border border-amber-500/20 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-amber-500/15">
        <div className="flex items-center gap-2">
          <AlertCircle size={15} className="text-amber-400" />
          <p className="text-sm font-semibold text-amber-400">Ollama is not running</p>
        </div>
        <button onClick={onDismiss} className="text-xs text-gray-500 hover:text-white transition-colors">Dismiss</button>
      </div>
      <div className="p-5 space-y-3">
        {steps.map((s) => (
          <div key={s.step} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{s.step}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 mb-1">{s.label}</p>
              {s.cmd && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 font-mono">
                  <span className="text-xs text-cyan-400 flex-1 break-all">{s.cmd}</span>
                  <button onClick={() => navigator.clipboard.writeText(s.cmd)} className="text-gray-600 hover:text-white transition-colors flex-shrink-0">
                    <Copy size={11} />
                  </button>
                </div>
              )}
              {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 hover:underline">{s.link}</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Model dropdown ────────────────────────────────────────────────────────────
function ModelDropdown({ model, onChange }) {
  const [open, setOpen] = useState(false)
  const current = AVAILABLE_MODELS.find((m) => m.value === model) || AVAILABLE_MODELS[0]

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/10 text-gray-300 hover:text-white text-xs transition-all hover:border-white/20">
        <Settings size={12} className="text-cyan-400" />
        {current.label}
        <ChevronDown size={11} className={'transition-transform ' + (open ? 'rotate-180' : '')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 right-0 z-20 w-60 glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl shadow-black/40">
            <div className="px-4 py-2.5 border-b border-white/5">
              <p className="text-xs font-semibold text-gray-400">Select Model</p>
            </div>
            {AVAILABLE_MODELS.map((m) => (
              <button key={m.value} onClick={() => { onChange(m.value); setOpen(false) }}
                className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                <div className="text-left">
                  <p className={model === m.value ? 'text-cyan-400 font-medium' : 'text-gray-300'}>{m.label}</p>
                  <p className="text-xs text-gray-600">{m.size}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{m.speed}</span>
                  {model === m.value && <Check size={12} className="text-cyan-400" />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Chat History Sidebar ──────────────────────────────────────────────────────
function ChatHistorySidebar({ sessions, activeSessionId, onSelect, onDelete, onNew, loading }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now  = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7)  return `${days} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Group sessions by date
  const grouped = sessions.reduce((acc, session) => {
    const label = formatDate(session.updatedAt)
    if (!acc[label]) acc[label] = []
    acc[label].push(session)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={15} className="text-cyan-400" />
          <span className="text-sm font-semibold text-white">Chat History</span>
        </div>
        <button onClick={onNew}
          className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
          title="New chat">
          <Plus size={14} />
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="text-gray-600 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare size={24} className="text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-600">No chat history yet</p>
            <p className="text-xs text-gray-700 mt-1">Start a conversation!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, groupSessions]) => (
            <div key={dateLabel}>
              <p className="text-xs text-gray-600 font-medium px-4 py-2">{dateLabel}</p>
              {groupSessions.map((session) => (
                <div key={session.id}
                  className={'group relative flex items-start gap-2 px-3 py-2.5 mx-1 rounded-xl cursor-pointer transition-all ' +
                    (activeSessionId === session.id
                      ? 'bg-cyan-500/10 border border-cyan-500/20'
                      : 'hover:bg-white/4 border border-transparent')}>
                  <button className="flex-1 min-w-0 text-left" onClick={() => onSelect(session)}>
                    <p className={'text-xs font-medium truncate ' +
                      (activeSessionId === session.id ? 'text-cyan-400' : 'text-gray-300 group-hover:text-white')}>
                      {session.title}
                    </p>
                    {session.lastMessage && (
                      <p className="text-xs text-gray-600 truncate mt-0.5">{session.lastMessage}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={9} className="text-gray-700" />
                      <span className="text-xs text-gray-700">{session.messageCount} messages</span>
                    </div>
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(session.id) }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-gray-600 hover:text-rose-400 transition-all flex-shrink-0 mt-0.5"
                    title="Delete chat">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Export chat ───────────────────────────────────────────────────────────────
function exportChat(messages, datasetName) {
  const lines = [
    '# DataMind AI — Chat Export',
    `Date: ${new Date().toLocaleString()}`,
    datasetName ? `Dataset: ${datasetName}` : '',
    '', '---', '',
    ...messages.filter((m) => m.text).map((m) =>
      `**${m.role === 'user' ? 'You' : 'DataMind AI'}** (${m.time})\n${m.text}\n`
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `datamind-chat-${Date.now()}.md`; a.click()
  URL.revokeObjectURL(url)
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ChatUI({ onNavigateToUpload }) {
  const { activeDataset, clearActiveDataset } = useData()
  const { user }                              = useAuth()

  const makeWelcome = (dataset) => ({
    id:   Date.now(),
    role: 'assistant',
    text: dataset
      ? `Hello! I've loaded **${dataset.name}** — ${dataset.rowCount.toLocaleString()} rows across ${dataset.columns.length} columns. Ask me anything about this data!`
      : "Hello! I'm DataMind AI, running locally via Ollama. Upload a dataset and ask me anything about it — trends, summaries, patterns, or analysis.",
    time: nowTime(),
  })

  // ── State ────────────────────────────────────────────────────────────────────
  const [model,         setModel]         = useState(DEFAULT_MODEL)
  const [messages,      setMessages]      = useState(() => [makeWelcome(activeDataset)])
  const [input,         setInput]         = useState('')
  const [isLoading,     setIsLoading]     = useState(false)
  const [isStreaming,   setIsStreaming]   = useState(false)
  const [error,         setError]         = useState(null)
  const [copiedId,      setCopiedId]      = useState(null)
  const [likedMsgs,     setLikedMsgs]     = useState({})
  const [dislikedMsgs,  setDislikedMsgs]  = useState({})

  // Chat history state
  const [sessions,         setSessions]         = useState([])
  const [activeSessionId,  setActiveSessionId]  = useState(null)
  const [sessionsLoading,  setSessionsLoading]  = useState(false)
  const [sidebarOpen,      setSidebarOpen]      = useState(true)
  const [savingSession,    setSavingSession]     = useState(false)

  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)
  const prevDataset = useRef(activeDataset?.id)

  const systemPrompt    = BASE_SYSTEM_PROMPT + buildDatasetContext(activeDataset)
  const isOllamaDown    = error?.includes('Failed to fetch') || error?.includes('ERR_CONNECTION_REFUSED')
  const showSuggestions = messages.length <= 1 && !isLoading
  const SUGGESTIONS     = activeDataset ? SUGGESTIONS_WITH_DATA : SUGGESTIONS_NO_DATA

  // ── Load sessions on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (user) loadSessions()
  }, [user])

  const loadSessions = async () => {
    setSessionsLoading(true)
    try {
      const data = await apiCall('/chat/sessions')
      setSessions(data.sessions || [])
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setSessionsLoading(false)
    }
  }

  // ── Auto-scroll ───────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Auto-resize textarea ──────────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  // ── Reset chat when dataset changes ──────────────────────────────────────────
  useEffect(() => {
    if (activeDataset?.id !== prevDataset.current) {
      prevDataset.current = activeDataset?.id
      startNewChat()
    }
  }, [activeDataset])

  // ── Create new session in DB ──────────────────────────────────────────────────
  const createSession = async () => {
    if (!user) return null
    try {
      const data = await apiCall('/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({
          model,
          datasetInfo: activeDataset
            ? { name: activeDataset.name, rowCount: activeDataset.rowCount, columns: activeDataset.columns }
            : { name: null, rowCount: null, columns: [] },
        }),
      })
      const newSession = data.session
      setSessions((prev) => [newSession, ...prev])
      setActiveSessionId(newSession.id)
      return newSession.id
    } catch (err) {
      console.error('Failed to create session:', err)
      return null
    }
  }

  // ── Save messages to DB ───────────────────────────────────────────────────────
  const saveMessagesToDB = async (sessionId, newMessages) => {
    if (!user || !sessionId) return
    setSavingSession(true)
    try {
      const data = await apiCall(`/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ messages: newMessages }),
      })
      // Update session title in sidebar if it was generated
      setSessions((prev) =>
        prev.map((s) => s.id === sessionId ? { ...s, ...data.session } : s)
      )
    } catch (err) {
      console.error('Failed to save messages:', err)
    } finally {
      setSavingSession(false)
    }
  }

  // ── Load a session ────────────────────────────────────────────────────────────
  const loadSession = async (session) => {
    try {
      const data = await apiCall(`/chat/sessions/${session.id}`)
      const msgs = data.session.messages.map((m) => ({
        id:   m._id,
        role: m.role,
        text: m.text,
        time: m.time,
      }))
      setMessages(msgs.length > 0 ? msgs : [makeWelcome(null)])
      setActiveSessionId(session.id)
      setModel(data.session.model || DEFAULT_MODEL)
      setError(null)
    } catch (err) {
      console.error('Failed to load session:', err)
    }
  }

  // ── Delete a session ──────────────────────────────────────────────────────────
  const deleteSession = async (sessionId) => {
    try {
      await apiCall(`/chat/sessions/${sessionId}`, { method: 'DELETE' })
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSessionId === sessionId) {
        startNewChat()
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
    }
  }

  // ── Start a brand new chat ────────────────────────────────────────────────────
  const startNewChat = () => {
    setMessages([makeWelcome(activeDataset)])
    setActiveSessionId(null)
    setInput('')
    setError(null)
    setLikedMsgs({})
    setDislikedMsgs({})
  }

  // ── Build Ollama history ──────────────────────────────────────────────────────
  const buildHistory = (msgs) =>
    msgs.filter((m) => !m.streaming && m.text)
        .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))

  // ── Send message ──────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setError(null)
    setInput('')

    const userMsg = { id: Date.now(), role: 'user', text, time: nowTime() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setIsLoading(true)

    const aiId  = Date.now() + 1
    const aiMsg = { id: aiId, role: 'assistant', text: '', time: nowTime(), streaming: true }
    setMessages((prev) => [...prev, aiMsg])
    setIsStreaming(true)

    let finalAiText = ''

    try {
      finalAiText = await streamOllama(buildHistory(updated), model, systemPrompt, (fullText) => {
        setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, text: fullText } : m))
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      })

      setMessages((prev) => prev.map((m) => m.id === aiId ? { ...m, streaming: false } : m))

      // Save to MongoDB
      if (user) {
        let sessionId = activeSessionId

        // Create session on first real message
        if (!sessionId) {
          sessionId = await createSession()
        }

        if (sessionId) {
          await saveMessagesToDB(sessionId, [
            { role: 'user',      text,          time: userMsg.time },
            { role: 'assistant', text: finalAiText, time: nowTime() },
          ])
        }
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== aiId))
      setError(err.message)
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 10rem)' }}>

      {/* ── History Sidebar ── */}
      {user && (
        <div className={
          'flex-shrink-0 glass-card rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 ' +
          (sidebarOpen ? 'w-64' : 'w-0 opacity-0 pointer-events-none')
        }>
          <ChatHistorySidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={loadSession}
            onDelete={deleteSession}
            onNew={startNewChat}
            loading={sessionsLoading}
          />
        </div>
      )}

      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle */}
            {user && (
              <button onClick={() => setSidebarOpen((v) => !v)}
                className="w-8 h-8 rounded-xl glass border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                title={sidebarOpen ? 'Hide history' : 'Show history'}>
                {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight">DataMind AI</h2>
              <div className="flex items-center gap-1.5">
                {isLoading ? (
                  <><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-xs text-amber-400">{isStreaming ? 'Generating…' : 'Connecting…'}</span></>
                ) : (
                  <><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400">
                      Local AI · Ollama{savingSession ? ' · Saving…' : ''}
                    </span></>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModelDropdown model={model} onChange={setModel} />
            <button onClick={() => exportChat(messages.filter((m) => m.text), activeDataset?.name)}
              title="Export chat"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/10 text-gray-400 hover:text-white text-xs transition-all hover:border-white/20">
              <Download size={13} />
            </button>
            <button onClick={startNewChat}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass border border-white/10 text-gray-400 hover:text-white text-xs transition-all hover:border-white/20">
              <Plus size={13} /> New
            </button>
          </div>
        </div>

        {/* Active dataset banner */}
        {activeDataset && (
          <div className="flex items-center justify-between gap-3 mb-3 px-4 py-2.5 rounded-xl bg-cyan-500/8 border border-cyan-500/20 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={14} className="text-cyan-400 flex-shrink-0" />
              <span className="text-xs text-cyan-400 font-medium">Active:</span>
              <span className="text-xs text-white font-semibold truncate">{activeDataset.name}</span>
              <span className="text-xs text-gray-500 flex-shrink-0">
                · {activeDataset.rowCount.toLocaleString()} rows · {activeDataset.columns.length} cols
              </span>
            </div>
            <button onClick={() => { clearActiveDataset(); startNewChat() }}
              className="w-5 h-5 rounded-md text-gray-500 hover:text-white transition-colors flex-shrink-0 flex items-center justify-center">
              <X size={12} />
            </button>
          </div>
        )}

        {/* No dataset prompt */}
        {!activeDataset && messages.length <= 1 && (
          <div className="mb-3 flex-shrink-0">
            <button onClick={() => onNavigateToUpload?.()}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-dashed border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 text-gray-500 hover:text-cyan-400 text-sm transition-all">
              <span className="flex items-center gap-2">
                <Database size={15} /> Upload a CSV or JSON file to get real AI-powered insights
              </span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Ollama setup guide */}
        {isOllamaDown && <SetupGuide model={model} onDismiss={() => setError(null)} />}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={'flex gap-3 ' + (msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ' +
                (msg.role === 'user' ? 'bg-gradient-to-br from-cyan-500 to-teal-500' : 'bg-gradient-to-br from-violet-500 to-purple-600')}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Brain size={16} className="text-white" />}
              </div>

              <div className={'max-w-[78%] flex flex-col gap-1 ' + (msg.role === 'user' ? 'items-end' : 'items-start')}>
                <div className={'px-4 py-3 rounded-2xl text-sm leading-relaxed ' +
                  (msg.role === 'user'
                    ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white rounded-tr-sm'
                    : 'glass border border-white/8 text-gray-200 rounded-tl-sm')}>
                  {msg.role === 'assistant' ? (
                    msg.text ? (
                      <><MessageText text={msg.text} />
                        {msg.streaming && <span className="inline-block w-0.5 h-4 bg-cyan-400 ml-0.5 animate-pulse align-middle" />}</>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )
                  ) : msg.text}
                </div>

                {!msg.streaming && (
                  <div className={'flex items-center gap-2 px-1 ' + (msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                    <span className="text-xs text-gray-600">{msg.time}</span>
                    {msg.role === 'assistant' && msg.text && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleCopy(msg.id, msg.text)} className="p-1 rounded-md text-gray-600 hover:text-gray-300 transition-colors">
                          {copiedId === msg.id ? <span className="text-xs text-emerald-400">Copied!</span> : <Copy size={12} />}
                        </button>
                        <button onClick={() => setLikedMsgs((p) => ({ ...p, [msg.id]: !p[msg.id] }))}
                          className={'p-1 rounded-md transition-colors ' + (likedMsgs[msg.id] ? 'text-emerald-400' : 'text-gray-600 hover:text-emerald-400')}>
                          <ThumbsUp size={12} />
                        </button>
                        <button onClick={() => setDislikedMsgs((p) => ({ ...p, [msg.id]: !p[msg.id] }))}
                          className={'p-1 rounded-md transition-colors ' + (dislikedMsgs[msg.id] ? 'text-rose-400' : 'text-gray-600 hover:text-rose-400')}>
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Error */}
          {error && !isOllamaDown && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-rose-400 font-medium">Something went wrong</p>
                <p className="text-xs text-gray-400 mt-0.5 break-words">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-xs text-gray-500 hover:text-white transition-colors flex-shrink-0">✕</button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 flex-shrink-0">
            {SUGGESTIONS.map((s, i) => {
              const Icon = s.icon
              return (
                <button key={i} onClick={() => { setInput(s.text); textareaRef.current?.focus() }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl glass border border-white/8 text-gray-400 hover:text-white hover:border-cyan-500/30 text-sm text-left transition-all duration-200">
                  <Icon size={16} className="text-cyan-400 flex-shrink-0" />
                  {s.text}
                </button>
              )
            })}
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0">
          <div className="glass border border-white/10 focus-within:border-cyan-500/30 rounded-2xl p-3 flex items-end gap-3 transition-all duration-200">
            <textarea ref={textareaRef} value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeDataset ? `Ask anything about ${activeDataset.name}…` : 'Ask anything about your data…'}
              rows={1} disabled={isLoading}
              className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
              style={{ minHeight: '24px', maxHeight: '120px' }} />
            <button onClick={handleSend} disabled={!input.trim() || isLoading}
              className={'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ' +
                (input.trim() && !isLoading
                  ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-white hover:scale-110 active:scale-95 shadow-lg shadow-cyan-500/25'
                  : 'bg-white/5 text-gray-600 cursor-not-allowed')}>
              {isLoading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={16} />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-xs text-gray-700">Enter to send · Shift+Enter for new line</p>
            <p className="text-xs text-gray-700 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {model} · ollama
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}