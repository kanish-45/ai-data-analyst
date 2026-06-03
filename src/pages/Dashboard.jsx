import { useState, useEffect } from 'react'
import {
  BarChart3, Brain, Upload, MessageSquare,
  ChevronLeft, ChevronRight, Bell, Search,
  Settings, Home, FileText, Menu, User,
  LogOut, TrendingUp, Database, Loader2,
  X, CheckCircle
} from 'lucide-react'
import { DataProvider } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import ChatUI from '../components/ChatUI'
import FileUpload from '../components/FileUpload'
import ChartsSection from '../components/ChartsSection'
import AnalyticsSection from '../components/AnalyticsSection'
import ReportsSection from '../components/ReportsSection'
import DatasetsSection from '../components/DatasetsSection'
import SettingsSection from '../components/SettingsSection'
import ProfileSection from '../components/ProfileSection'

const API_URL = import.meta.env.VITE_API_URL || 'https://ai-data-analyst-backend-xj17.onrender.com/api'
function getToken() { return localStorage.getItem('datamind_token') }

async function fetchOverview(token) {
  const res = await fetch(`${API_URL}/stats/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

async function fetchNotifications(token) {
  const res = await fetch(`${API_URL}/stats/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

const navItems = [
  { icon: Home,          label: 'Overview',    id: 'overview'  },
  { icon: BarChart3,     label: 'Charts',      id: 'charts'    },
  { icon: MessageSquare, label: 'AI Chat',     id: 'chat'      },
  { icon: Upload,        label: 'Upload Data', id: 'upload'    },
  { icon: Database,      label: 'Datasets',    id: 'datasets'  },
  { icon: TrendingUp,    label: 'Analytics',   id: 'analytics' },
  { icon: FileText,      label: 'Reports',     id: 'reports'   },
]

const bottomNavItems = [
  { icon: Settings, label: 'Settings', id: 'settings' },
  { icon: User,     label: 'Profile',  id: 'profile'  },
]

const quickActions = [
  { icon: Upload,        label: 'Upload Dataset',  desc: 'CSV, Excel, JSON',    color: 'text-cyan-400',    bg: 'hover:bg-cyan-500/5 hover:border-cyan-500/20',    nav: 'upload'  },
  { icon: MessageSquare, label: 'Ask AI',           desc: 'Chat with your data', color: 'text-violet-400',  bg: 'hover:bg-violet-500/5 hover:border-violet-500/20', nav: 'chat'    },
  { icon: BarChart3,     label: 'View Charts',      desc: 'Visualize data',      color: 'text-emerald-400', bg: 'hover:bg-emerald-500/5 hover:border-emerald-500/20',nav: 'charts'  },
  { icon: FileText,      label: 'Reports',          desc: 'Export insights',     color: 'text-amber-400',   bg: 'hover:bg-amber-500/5 hover:border-amber-500/20',   nav: 'reports' },
]

const subtitles = {
  overview:  'Welcome back! Here is what is happening with your data.',
  chat:      'Ask questions and get instant AI-powered insights from your data.',
  upload:    'Upload your datasets and let AI analyze them instantly.',
  charts:    'Visualize your data with beautiful interactive charts.',
  datasets:  'Manage and explore all your uploaded datasets.',
  analytics: 'Deep dive into your data analytics and trends.',
  reports:   'View and export AI-generated reports.',
  settings:  'Manage your account and preferences.',
  profile:   'View and edit your profile.',
}

function StatSkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-white/3 border border-white/5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/8" />
        <div className="w-20 h-3 rounded-full bg-white/8" />
      </div>
      <div className="w-16 h-7 rounded-lg bg-white/8 mb-2" />
      <div className="w-24 h-3 rounded-full bg-white/8" />
    </div>
  )
}

// Icon for each notification type
function notifIconFor(type) {
  if (type === 'dataset') return { icon: CheckCircle, color: 'text-emerald-400' }
  if (type === 'chat')    return { icon: Brain,       color: 'text-violet-400'  }
  if (type === 'welcome') return { icon: Bell,        color: 'text-cyan-400'    }
  return { icon: Bell, color: 'text-cyan-400' }
}

// ── Notification panel ────────────────────────────────────────────────────────
function NotificationPanel({ onClose, notifications, loading }) {
  return (
    <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] glass-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <p className="text-sm font-semibold text-white">Notifications</p>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={14} /></button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="text-gray-600 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Bell size={24} className="text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-700 mt-1">Upload a dataset to get started</p>
          </div>
        ) : (
          notifications.map((n) => {
            const { icon: Icon, color } = notifIconFor(n.type)
            return (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors">
                <div className={'w-8 h-8 rounded-lg glass flex items-center justify-center flex-shrink-0 ' + color}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">{n.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">{n.desc}</p>
                  <p className="text-xs text-gray-700 mt-1">{n.time}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function DashboardInner() {
  const { user, logout } = useAuth()

  const [collapsed,      setCollapsed]      = useState(false)
  const [activeNav,      setActiveNav]      = useState('overview')
  const [mobileOpen,     setMobileOpen]     = useState(false)
  const [showNotifs,     setShowNotifs]     = useState(false)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [showSearch,     setShowSearch]     = useState(false)

  // Real stats
  const [stats,          setStats]          = useState(null)
  const [activity,       setActivity]       = useState([])
  const [statsLoading,   setStatsLoading]   = useState(false)

  // Real notifications
  const [notifications,  setNotifications]  = useState([])
  const [notifsLoading,  setNotifsLoading]  = useState(false)

  const navigate     = (id) => { setActiveNav(id); setMobileOpen(false); setShowNotifs(false) }
  const pageTitle    = [...navItems, ...bottomNavItems].find((n) => n.id === activeNav)?.label || 'Overview'
  const pageSubtitle = subtitles[activeNav] || ''
  const displayName  = user?.nickname || user?.name?.split(' ')[0] || 'User'

  useEffect(() => {
    if (activeNav === 'overview' && user) loadStats()
  }, [activeNav, user])

  // Load notifications once the user is known
  useEffect(() => {
    if (user) loadNotifications()
  }, [user])

  const loadStats = async () => {
    const token = getToken()
    if (!token) return
    setStatsLoading(true)
    try {
      const data = await fetchOverview(token)
      setStats(data.stats)
      setActivity(data.activity || [])
    } catch (err) {
      console.error('Stats error:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadNotifications = async () => {
    const token = getToken()
    if (!token) return
    setNotifsLoading(true)
    try {
      const data = await fetchNotifications(token)
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error('Notifications error:', err)
    } finally {
      setNotifsLoading(false)
    }
  }

  // Refresh notifications when opening the panel so they're up to date
  const openNotifs = () => {
    setShowNotifs((v) => {
      if (!v) loadNotifications()
      return !v
    })
  }

  const overviewCards = [
    {
      label:     'Total Datasets',
      value:     stats ? stats.totalDatasets.toString() : '—',
      change:    stats ? `+${stats.recentDatasets} this week` : 'Loading…',
      color:     'from-cyan-500/20 to-teal-500/10',
      border:    'border-cyan-500/20',
      iconColor: 'text-cyan-400',
      icon:      Database,
      nav:       'datasets',
    },
    {
      label:     'AI Messages',
      value:     stats ? stats.totalMessages.toLocaleString() : '—',
      change:    stats ? `${stats.recentChats} chats today` : 'Loading…',
      color:     'from-violet-500/20 to-purple-500/10',
      border:    'border-violet-500/20',
      iconColor: 'text-violet-400',
      icon:      MessageSquare,
      nav:       'chat',
    },
    {
      label:     'Chat Sessions',
      // Now uses the REAL session count from the backend
      value:     stats ? (stats.totalSessions ?? 0).toString() : '—',
      change:    stats ? `${stats.recentChats} today` : 'Loading…',
      color:     'from-emerald-500/20 to-green-500/10',
      border:    'border-emerald-500/20',
      iconColor: 'text-emerald-400',
      icon:      BarChart3,
      nav:       'chat',
    },
    {
      label:     'Files Uploaded',
      value:     stats ? stats.totalDatasets.toString() : '—',
      change:    stats ? `+${stats.recentDatasets} this week` : 'Loading…',
      color:     'from-amber-500/20 to-orange-500/10',
      border:    'border-amber-500/20',
      iconColor: 'text-amber-400',
      icon:      FileText,
      nav:       'upload',
    },
  ]

  const searchResults = searchQuery.length > 1
    ? [...navItems, ...bottomNavItems].filter((n) =>
        n.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const renderContent = () => {
    if (activeNav === 'chat')      return <ChatUI onNavigateToUpload={() => navigate('upload')} />
    if (activeNav === 'upload')    return <FileUpload onNavigateToChat={() => navigate('chat')} />
    if (activeNav === 'charts')    return <ChartsSection  onNavigateToUpload={() => navigate('upload')} />
    if (activeNav === 'analytics') return <AnalyticsSection onNavigate={navigate} />
    if (activeNav === 'reports')   return <ReportsSection onNavigateToUpload={() => navigate('upload')} />
    if (activeNav === 'datasets')  return <DatasetsSection onNavigate={navigate} />
    if (activeNav === 'settings')  return <SettingsSection />
    if (activeNav === 'profile')   return <ProfileSection onNavigate={navigate} />

    return (
      <>
        {/* Welcome banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-violet-500/5 to-transparent border border-cyan-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-white font-semibold">Welcome back, {displayName}! 👋</p>
            <p className="text-gray-400 text-xs mt-0.5">
              {stats
                ? `You have ${stats.totalDatasets} dataset${stats.totalDatasets !== 1 ? 's' : ''} and ${stats.totalMessages} AI messages so far.`
                : 'Loading your stats…'}
            </p>
          </div>
          <button onClick={() => navigate('upload')}
            className="flex-shrink-0 self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/25 transition-all">
            <Upload size={13} /> Upload Data
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {statsLoading
            ? Array(4).fill(0).map((_, i) => <StatSkeleton key={i} />)
            : overviewCards.map((card, i) => {
                const Icon = card.icon
                return (
                  <button key={i} onClick={() => navigate(card.nav)}
                    className={'rounded-2xl p-5 bg-gradient-to-br text-left w-full ' +
                      card.color + ' border ' + card.border +
                      ' hover:scale-105 transition-all duration-300 cursor-pointer'}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={'w-10 h-10 rounded-xl glass flex items-center justify-center ' + card.iconColor}>
                        <Icon size={20} />
                      </div>
                      <span className="text-xs text-gray-500">{card.change}</span>
                    </div>
                    <div className="text-2xl font-extrabold text-white mb-1">{card.value}</div>
                    <div className="text-sm text-gray-400">{card.label}</div>
                  </button>
                )
              })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-white text-lg">Recent Activity</h2>
              <div className="flex items-center gap-2">
                {statsLoading && <Loader2 size={13} className="text-gray-600 animate-spin" />}
                <button onClick={() => navigate('datasets')} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">View all</button>
              </div>
            </div>

            {statsLoading ? (
              <div className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl animate-pulse">
                    <div className="w-9 h-9 rounded-lg bg-white/8 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/8 rounded-full w-3/4" />
                      <div className="h-2.5 bg-white/5 rounded-full w-1/2" />
                    </div>
                    <div className="w-14 h-5 bg-white/8 rounded-full" />
                  </div>
                ))}
              </div>
            ) : activity.length > 0 ? (
              <div className="space-y-3">
                {activity.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/3 transition-colors group cursor-pointer"
                    onClick={() => navigate('datasets')}>
                    <div className="w-9 h-9 rounded-lg glass flex items-center justify-center text-cyan-400 flex-shrink-0 group-hover:bg-cyan-500/10 transition-colors">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.action} · {item.time}</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 flex-shrink-0">Done</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Database size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 text-sm font-medium">No activity yet</p>
                <p className="text-gray-600 text-xs mt-1">Upload a dataset to get started</p>
                <button onClick={() => navigate('upload')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all">
                  <Upload size={13} /> Upload your first dataset
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h2 className="font-bold text-white text-lg mb-5">Quick Actions</h2>
            <div className="space-y-2.5">
              {quickActions.map((action, i) => {
                const Icon = action.icon
                return (
                  <button key={i} onClick={() => navigate(action.nav)}
                    className={'w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 transition-all duration-200 group ' + action.bg}>
                    <div className={'w-9 h-9 rounded-lg glass flex items-center justify-center flex-shrink-0 ' + action.color}>
                      <Icon size={18} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{action.label}</div>
                      <div className="text-xs text-gray-500">{action.desc}</div>
                    </div>
                    <ChevronRight size={15} className="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                  </button>
                )
              })}
            </div>
            <button onClick={loadStats} disabled={statsLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-xl glass border border-white/8 text-gray-500 hover:text-white text-xs transition-all">
              <Loader2 size={12} className={statsLoading ? 'animate-spin' : ''} />
              {statsLoading ? 'Refreshing…' : 'Refresh Stats'}
            </button>
          </div>
        </div>
      </>
    )
  }

  // Unread dot: show only if we actually have any notifications
  const hasNotifications = notifications.length > 0

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex overflow-hidden">
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />}
      {showNotifs && <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />}

      {/* ── Sidebar ── */}
      <aside className={'fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300 border-r border-white/5 bg-[#080c18] ' +
        (collapsed ? 'w-20' : 'w-64') + ' ' +
        (mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>

        {/* Logo */}
        <div className={'flex items-center h-16 px-4 border-b border-white/5 ' + (collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('overview')}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Brain size={16} className="text-white" />
              </div>
              <span className="font-bold text-white tracking-tight">DataMind <span className="text-cyan-400">AI</span></span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center cursor-pointer" onClick={() => navigate('overview')}>
              <Brain size={16} className="text-white" />
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-6 h-6 rounded-md glass items-center justify-center text-gray-400 hover:text-white transition-colors">
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <button onClick={() => setMobileOpen(false)}
            className="lg:hidden w-7 h-7 rounded-md glass flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon     = item.icon
            const isActive = activeNav === item.id
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ' +
                  (isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5')}
                title={collapsed ? item.label : ''}>
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon     = item.icon
            const isActive = activeNav === item.id
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ' +
                  (isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5')}
                title={collapsed ? item.label : ''}>
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            )
          })}
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200"
            title={collapsed ? 'Logout' : ''}>
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className={'flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ' + (collapsed ? 'lg:ml-20' : 'lg:ml-64')}>

        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-[#080c18]/80 backdrop-blur-xl flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-10">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-gray-400 hover:text-white transition-colors flex-shrink-0">
            <Menu size={22} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white truncate leading-tight">{pageTitle}</h1>
            <p className="text-xs text-gray-500 truncate">{pageSubtitle}</p>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Notifications */}
            <div className="relative">
              <button onClick={openNotifs}
                className="relative w-9 h-9 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                <Bell size={17} />
                {hasNotifications && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />}
              </button>
              {showNotifs && (
                <NotificationPanel
                  onClose={() => setShowNotifs(false)}
                  notifications={notifications}
                  loading={notifsLoading}
                />
              )}
            </div>

            <div className="w-px h-6 bg-white/10 hidden sm:block" />

            <button onClick={() => navigate('profile')}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-white leading-tight">{displayName}</div>
                <div className="text-xs text-gray-500">{user?.plan || 'Free'} Plan</div>
              </div>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DataProvider>
      <DashboardInner />
    </DataProvider>
  )
}