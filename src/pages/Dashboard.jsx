import { useState } from 'react'
import {
  BarChart3, Brain, Upload, MessageSquare,
  ChevronLeft, ChevronRight, Bell, Search,
  Settings, Home, FileText, Menu, User,
  LogOut, TrendingUp, Database
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

const navItems = [
  { icon: Home,         label: 'Overview',    id: 'overview'  },
  { icon: BarChart3,    label: 'Charts',      id: 'charts'    },
  { icon: MessageSquare,label: 'AI Chat',     id: 'chat'      },
  { icon: Upload,       label: 'Upload Data', id: 'upload'    },
  { icon: Database,     label: 'Datasets',    id: 'datasets'  },
  { icon: TrendingUp,   label: 'Analytics',   id: 'analytics' },
  { icon: FileText,     label: 'Reports',     id: 'reports'   },
]

const bottomNavItems = [
  { icon: Settings, label: 'Settings', id: 'settings' },
  { icon: User,     label: 'Profile',  id: 'profile'  },
]

const overviewCards = [
  { label: 'Total Datasets',    value: '24',   change: '+3 this week', color: 'from-cyan-500/20 to-teal-500/10',   border: 'border-cyan-500/20',   iconColor: 'text-cyan-400',   icon: Database      },
  { label: 'AI Queries',        value: '1,284',change: '+128 today',   color: 'from-violet-500/20 to-purple-500/10',border: 'border-violet-500/20', iconColor: 'text-violet-400', icon: MessageSquare },
  { label: 'Charts Created',    value: '89',   change: '+12 this week',color: 'from-emerald-500/20 to-green-500/10',border: 'border-emerald-500/20',iconColor: 'text-emerald-400',icon: BarChart3     },
  { label: 'Reports Generated', value: '16',   change: '+2 today',     color: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/20',  iconColor: 'text-amber-400',  icon: FileText      },
]

const recentActivity = [
  { name: 'sales_data_2024.csv',   action: 'Analyzed', time: '2 min ago',  status: 'success' },
  { name: 'customer_report.xlsx',  action: 'Uploaded', time: '15 min ago', status: 'success' },
  { name: 'marketing_q4.json',     action: 'Processing',time: '1 hr ago',  status: 'pending' },
  { name: 'inventory_nov.csv',     action: 'Analyzed', time: '3 hr ago',   status: 'success' },
  { name: 'finance_summary.xlsx',  action: 'Failed',   time: '5 hr ago',   status: 'error'   },
]

const quickActions = [
  { icon: Upload,       label: 'Upload Dataset', desc: 'CSV, Excel, JSON',   color: 'text-cyan-400',   bg: 'hover:bg-cyan-500/5 hover:border-cyan-500/20',   nav: 'upload'  },
  { icon: MessageSquare,label: 'Ask AI',         desc: 'Chat with your data',color: 'text-violet-400', bg: 'hover:bg-violet-500/5 hover:border-violet-500/20',nav: 'chat'    },
  { icon: BarChart3,    label: 'New Chart',      desc: 'Visualize data',     color: 'text-emerald-400',bg: 'hover:bg-emerald-500/5 hover:border-emerald-500/20',nav: 'charts' },
  { icon: FileText,     label: 'Generate Report',desc: 'Export insights',    color: 'text-amber-400',  bg: 'hover:bg-amber-500/5 hover:border-amber-500/20',  nav: 'reports' },
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

function DashboardInner() {
  const { user, logout } = useAuth()
  const [collapsed,  setCollapsed]  = useState(false)
  const [activeNav,  setActiveNav]  = useState('overview')
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigate = (id) => { setActiveNav(id); setMobileOpen(false) }

  const pageTitle    = [...navItems, ...bottomNavItems].find((n) => n.id === activeNav)?.label || 'Overview'
  const pageSubtitle = subtitles[activeNav] || ''

  const renderContent = () => {
    if (activeNav === 'chat')      return <ChatUI onNavigateToUpload={() => navigate('upload')} />
    if (activeNav === 'upload')    return <FileUpload onNavigateToChat={() => navigate('chat')} />
    if (activeNav === 'charts')    return <ChartsSection />
    if (activeNav === 'analytics') return <AnalyticsSection />
    if (activeNav === 'reports')   return <ReportsSection />
    if (activeNav === 'datasets')  return <DatasetsSection onNavigate={navigate} />
    if (activeNav === 'settings')  return <SettingsSection />
    if (activeNav === 'profile')   return <ProfileSection onNavigate={navigate} />

    // Overview
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {overviewCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className={'rounded-2xl p-5 bg-gradient-to-br ' + card.color + ' border ' + card.border + ' hover:scale-105 transition-all duration-300'}>
                <div className="flex items-center justify-between mb-4">
                  <div className={'w-10 h-10 rounded-xl glass flex items-center justify-center ' + card.iconColor}><Icon size={20} /></div>
                  <span className="text-xs text-gray-500">{card.change}</span>
                </div>
                <div className="text-2xl font-extrabold text-white mb-1">{card.value}</div>
                <div className="text-sm text-gray-400">{card.label}</div>
              </div>
            )
          })}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-white text-lg">Recent Activity</h2>
              <button onClick={() => navigate('datasets')} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">View all</button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/3 transition-colors">
                  <div className="w-9 h-9 rounded-lg glass flex items-center justify-center text-cyan-400 flex-shrink-0"><FileText size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.action} · {item.time}</div>
                  </div>
                  <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' +
                    (item.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                     item.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                     'bg-rose-500/10 text-rose-400')}>
                    {item.status === 'success' ? 'Done' : item.status === 'pending' ? 'Processing' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <h2 className="font-bold text-white text-lg mb-6">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action, i) => {
                const Icon = action.icon
                return (
                  <button key={i} onClick={() => navigate(action.nav)}
                    className={'w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 transition-all duration-200 group ' + action.bg}>
                    <div className={'w-9 h-9 rounded-lg glass flex items-center justify-center flex-shrink-0 ' + action.color}><Icon size={18} /></div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{action.label}</div>
                      <div className="text-xs text-gray-500">{action.desc}</div>
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex overflow-hidden">
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={'fixed top-0 left-0 h-full z-30 flex flex-col transition-all duration-300 border-r border-white/5 bg-[#080c18] ' +
        (collapsed ? 'w-20' : 'w-64') + ' ' +
        (mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className={'flex items-center h-16 px-4 border-b border-white/5 ' + (collapsed ? 'justify-center' : 'justify-between')}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center flex-shrink-0"><Brain size={16} className="text-white" /></div>
              <span className="font-bold text-white tracking-tight">DataMind <span className="text-cyan-400">AI</span></span>
            </div>
          )}
          {collapsed && <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center"><Brain size={16} className="text-white" /></div>}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex w-6 h-6 rounded-md glass items-center justify-center text-gray-400 hover:text-white transition-colors">
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ' +
                  (isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5')}>
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeNav === item.id
            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ' +
                  (isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5')}>
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            )
          })}
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200">
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={'flex-1 flex flex-col min-h-screen transition-all duration-300 ' + (collapsed ? 'lg:ml-20' : 'lg:ml-64')}>
        <header className="h-16 border-b border-white/5 bg-[#080c18]/80 backdrop-blur-xl flex items-center px-6 gap-4 sticky top-0 z-10">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-gray-400 hover:text-white transition-colors"><Menu size={22} /></button>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" placeholder="Search datasets, reports..."
                className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 transition-all duration-200" />
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative w-9 h-9 rounded-xl glass flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
            </button>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('profile')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-white leading-tight">{user?.name || "User"}</div>
                <div className="text-xs text-gray-500">{user?.plan || "Free"} Plan</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-white mb-1">{pageTitle}</h1>
            <p className="text-gray-500 text-sm">{pageSubtitle}</p>
          </div>
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