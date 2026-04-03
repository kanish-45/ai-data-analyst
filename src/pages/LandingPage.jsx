import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  BarChart3, Brain, Upload, MessageSquare,
  Zap, Shield, ChevronRight, Sparkles,
  ArrowRight, ExternalLink, Star, Play,
  Check, X, Tag, BookOpen, LogIn,
  UserPlus, LayoutDashboard, LogOut,
  Database, TrendingUp, FileText,
  MousePointer, Bot, PieChart
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ── Data ──────────────────────────────────────────────────────────────────────

const features = [
  { icon: Brain,        title: 'AI-Powered Insights',      desc: 'Get instant, deep analysis of your datasets using state-of-the-art local language models.',  color: 'from-violet-500/20 to-purple-500/10',  border: 'border-violet-500/20',  iconColor: 'text-violet-400'  },
  { icon: Upload,       title: 'Drag and Drop Upload',      desc: 'Upload CSV, Excel, or JSON files instantly. No setup required — just drop and analyze.',       color: 'from-cyan-500/20 to-teal-500/10',      border: 'border-cyan-500/20',    iconColor: 'text-cyan-400'    },
  { icon: BarChart3,    title: 'Beautiful Visualizations',  desc: 'Auto-generated charts and graphs that turn raw numbers into clear visual stories.',            color: 'from-emerald-500/20 to-green-500/10',  border: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
  { icon: MessageSquare,title: 'Chat With Your Data',       desc: 'Ask questions in plain English. Get answers, trends, and summaries instantly.',                color: 'from-amber-500/20 to-orange-500/10',   border: 'border-amber-500/20',   iconColor: 'text-amber-400'   },
  { icon: Zap,          title: 'Lightning Fast',            desc: 'Results in seconds, not minutes. Built for speed with optimized local AI pipelines.',          color: 'from-yellow-500/20 to-amber-500/10',   border: 'border-yellow-500/20',  iconColor: 'text-yellow-400'  },
  { icon: Shield,       title: 'Privacy First',             desc: 'Your data never leaves your machine. Zero cloud storage, zero tracking, zero compromise.',     color: 'from-rose-500/20 to-pink-500/10',      border: 'border-rose-500/20',    iconColor: 'text-rose-400'    },
]

const stats = [
  { value: '10M+', label: 'Data Points Analyzed' },
  { value: '98%',  label: 'Accuracy Rate'         },
  { value: '2s',   label: 'Average Response'       },
  { value: '50+',  label: 'File Formats'           },
]

const previewStats = [
  { label: 'Total Records', value: '24,891' },
  { label: 'Avg Value',     value: '$4,203'  },
  { label: 'Trend Score',   value: '94.2%'   },
]

const barHeights    = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95]
const progressWidths = [70, 50, 85]

// Demo steps
const demoSteps = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload Your Dataset',
    desc: 'Drag and drop any CSV, Excel, or JSON file. DataMind instantly parses your data — no configuration needed.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    preview: (
      <div className="glass rounded-2xl p-5 border border-white/8">
        <div className="border-2 border-dashed border-cyan-500/30 rounded-xl p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center mx-auto mb-3">
            <Upload size={22} className="text-cyan-400" />
          </div>
          <p className="text-sm font-medium text-white mb-1">sales_data_2024.csv</p>
          <p className="text-xs text-gray-500">24,891 rows · 12 columns · 2.4 MB</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 w-full transition-all" />
          </div>
          <p className="text-xs text-emerald-400 mt-2">✓ Parsed successfully</p>
        </div>
      </div>
    ),
  },
  {
    step: '02',
    icon: MousePointer,
    title: 'Preview Your Data',
    desc: 'See a live preview of your columns, data types, and sample rows. DataMind auto-detects numeric vs text columns.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    preview: (
      <div className="glass rounded-2xl p-5 border border-white/8">
        <p className="text-xs text-gray-500 mb-3">Columns detected (12)</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {['date','product','category','revenue','units','region','margin'].map((col, i) => (
            <span key={col} className={'text-xs px-2.5 py-1 rounded-full border font-medium ' +
              (i % 2 === 0 ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400')}>
              {col}
            </span>
          ))}
        </div>
        <div className="space-y-1.5">
          {[['2024-01','Laptop','Electronics','$4,200','12','North'],['2024-01','Phone','Electronics','$2,100','28','South']].map((row, i) => (
            <div key={i} className="flex gap-2 text-xs text-gray-400 bg-white/3 rounded-lg px-3 py-2">
              {row.map((cell, j) => <span key={j} className="flex-1 truncate">{cell}</span>)}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    step: '03',
    icon: Bot,
    title: 'Ask AI Anything',
    desc: 'Type any question in plain English. DataMind AI reads your actual data and gives precise, context-aware answers.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    preview: (
      <div className="glass rounded-2xl p-5 border border-white/8 space-y-3">
        <div className="flex justify-end">
          <div className="bg-gradient-to-br from-cyan-500 to-teal-500 text-white text-xs px-3 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
            What is the top selling product category?
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Brain size={12} className="text-white" />
          </div>
          <div className="glass border border-white/8 text-gray-200 text-xs px-3 py-2 rounded-2xl rounded-tl-sm">
            <strong className="text-white">Electronics</strong> is your top category with <strong className="text-cyan-400">$284,000</strong> in revenue — 42% of total sales. Laptops lead at $128K, followed by Phones at $96K.
          </div>
        </div>
      </div>
    ),
  },
  {
    step: '04',
    icon: PieChart,
    title: 'Get Charts & Reports',
    desc: 'Instantly generate beautiful visualizations and export PDF reports. Share insights with your team in one click.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    preview: (
      <div className="glass rounded-2xl p-5 border border-white/8">
        <p className="text-xs text-gray-500 mb-3">Revenue by Category</p>
        <div className="space-y-2.5">
          {[
            { label: 'Electronics', pct: 42, color: 'from-cyan-500 to-teal-400'     },
            { label: 'Clothing',    pct: 28, color: 'from-violet-500 to-purple-400'  },
            { label: 'Food',        pct: 18, color: 'from-emerald-500 to-green-400'  },
            { label: 'Sports',      pct: 12, color: 'from-amber-500 to-yellow-400'   },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{item.label}</span>
                <span className="text-white font-semibold">{item.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className={'h-full rounded-full bg-gradient-to-r ' + item.color} style={{ width: item.pct + '%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

// Pricing plans
const plans = [
  {
    name:     'Free',
    price:    '$0',
    period:   'forever',
    desc:     'Perfect for individuals exploring data analysis.',
    color:    'border-white/10',
    badge:    null,
    btnText:  'Get Started Free',
    btnStyle: 'glass border border-white/15 text-white hover:border-cyan-500/40 hover:bg-cyan-500/5',
    features: [
      { text: '5 datasets per month',          included: true  },
      { text: 'Up to 10,000 rows per file',     included: true  },
      { text: 'AI chat (local Ollama)',          included: true  },
      { text: 'Basic charts & visualizations',  included: true  },
      { text: 'CSV & JSON support',             included: true  },
      { text: 'Excel file support',             included: false },
      { text: 'Chat history saved',             included: false },
      { text: 'Priority support',               included: false },
    ],
  },
  {
    name:     'Pro',
    price:    '$19',
    period:   'per month',
    desc:     'For professionals who analyze data daily.',
    color:    'border-cyan-500/40',
    badge:    'Most Popular',
    btnText:  'Start Pro Free',
    btnStyle: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:opacity-90 shadow-lg shadow-cyan-500/25',
    features: [
      { text: 'Unlimited datasets',             included: true },
      { text: 'Up to 1M rows per file',         included: true },
      { text: 'AI chat (local Ollama)',          included: true },
      { text: 'Advanced charts & dashboards',   included: true },
      { text: 'CSV, JSON & Excel support',      included: true },
      { text: 'Chat history saved',             included: true },
      { text: 'Export PDF & PowerPoint',        included: true },
      { text: 'Priority support',               included: false },
    ],
  },
  {
    name:     'Enterprise',
    price:    '$79',
    period:   'per month',
    desc:     'For teams that need power, security, and scale.',
    color:    'border-violet-500/30',
    badge:    null,
    btnText:  'Contact Sales',
    btnStyle: 'glass border border-violet-500/30 text-violet-400 hover:bg-violet-500/10',
    features: [
      { text: 'Everything in Pro',              included: true },
      { text: 'Team workspaces',                included: true },
      { text: 'Role-based access control',      included: true },
      { text: 'API access',                     included: true },
      { text: 'Custom AI model support',        included: true },
      { text: 'Slack & Teams integration',      included: true },
      { text: 'Dedicated account manager',      included: true },
      { text: 'Priority support 24/7',          included: true },
    ],
  },
]

const faqs = [
  { q: 'Is my data safe?',                  a: 'Completely. DataMind runs AI locally on your machine via Ollama — your data never leaves your computer or gets sent to any cloud server.' },
  { q: 'What file formats are supported?',  a: 'CSV and JSON work out of the box. For Excel (.xlsx, .xls), install the xlsx npm package once and it works automatically.' },
  { q: 'Do I need coding experience?',      a: 'Not at all. Just upload your file, type your question in plain English, and get instant answers. No SQL, no Python, no setup.' },
  { q: 'Can I cancel anytime?',             a: 'Yes. No contracts, no lock-in. Cancel your subscription anytime from your account settings with one click.' },
  { q: 'What AI models can I use?',         a: 'Any model supported by Ollama — Llama 3.2, Mistral, Gemma 2, Phi-3, DeepSeek R1, and more. Switch between them in the chat UI.' },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate         = useNavigate()
  const { user, logout } = useAuth()
  const [scrolled,       setScrolled]      = useState(false)
  const [userMenuOpen,   setUserMenuOpen]  = useState(false)
  const [activeStep,     setActiveStep]    = useState(0)
  const [activeFaq,      setActiveFaq]     = useState(null)
  const [billingAnnual,  setBillingAnnual] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-advance demo steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % demoSteps.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const navClass = scrolled
    ? 'fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass shadow-lg shadow-black/20'
    : 'fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-transparent'

  const handleCTA  = () => navigate(user ? '/dashboard' : '/signup')
  const displayName = user?.nickname || user?.name?.split(' ')[0] || ''

  const annualPrice = (price) => {
    if (price === '$0') return '$0'
    const num = parseInt(price.replace('$', ''))
    return '$' + Math.round(num * 0.8)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className={navClass}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
              <Brain size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              DataMind <span className="text-cyan-400">AI</span>
            </span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Features', href: '#features', icon: Sparkles },
              { label: 'Demo',     href: '#demo',     icon: Play     },
              { label: 'Pricing',  href: '#pricing',  icon: Tag      },
              { label: 'FAQ',      href: '#faq',      icon: BookOpen },
            ].map((item) => {
              const Icon = item.icon
              return (
                <a key={item.label} href={item.href}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200">
                  <Icon size={13} className="opacity-60" /> {item.label}
                </a>
              )
            })}
          </div>

          {/* Auth */}
          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl glass border border-white/10 hover:border-white/20 transition-all">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white hidden sm:block">{displayName}</span>
                <ChevronRight size={13} className={'text-gray-500 transition-transform ' + (userMenuOpen ? 'rotate-90' : '')} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-50 w-52 glass-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-semibold text-white">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { setUserMenuOpen(false); navigate('/dashboard') }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                      <LayoutDashboard size={14} className="text-cyan-400" /> Go to Dashboard
                    </button>
                    <button onClick={() => { setUserMenuOpen(false); logout() }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:text-rose-400 hover:bg-rose-500/5 transition-all border-t border-white/5">
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white glass border border-white/10 hover:border-white/20 transition-all">
                <LogIn size={14} /> Login
              </Link>
              <Link to="/signup"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1e] text-sm font-semibold transition-all hover:scale-105 active:scale-95">
                <UserPlus size={14} /> Sign Up Free
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {user ? (
          <div className="relative flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-emerald-500/25 mb-6">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-white font-medium">
              Welcome back, <span className="text-cyan-400">{displayName}</span>! 👋
            </span>
          </div>
        ) : (
          <div className="relative flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/20 mb-8">
            <Sparkles size={14} className="text-cyan-400" />
            <span className="text-xs text-cyan-300 font-medium tracking-wider uppercase">AI-Powered Data Analysis</span>
          </div>
        )}

        <h1 className="text-center text-5xl md:text-7xl font-extrabold leading-tight tracking-tight max-w-4xl mb-6 mt-2">
          Turn Your Data Into{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-400 bg-clip-text text-transparent">
            Actionable Insights
          </span>
        </h1>

        <p className="text-center text-gray-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Upload any dataset and instantly get AI-generated analysis, beautiful charts,
          and natural language answers — no coding required.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button onClick={handleCTA}
            className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold text-lg hover:from-cyan-400 hover:to-teal-400 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-cyan-500/25">
            {user ? 'Open Dashboard' : 'Start Analyzing Free'}
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <a href="#demo"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl glass border border-white/10 text-gray-300 font-medium text-lg hover:border-cyan-500/40 hover:text-white transition-all duration-300">
            <Play size={16} className="text-cyan-400" /> Watch Demo
          </a>
        </div>

        {/* Hero preview card */}
        <div className="relative w-full max-w-4xl glass-card rounded-3xl p-1 border border-cyan-500/10">
          <div className="bg-[#0d1530] rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <div className="flex-1 mx-4 h-6 rounded-lg bg-white/5 flex items-center px-3">
                <span className="text-xs text-gray-500">datamind.ai/dashboard</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {previewStats.map((item, i) => (
                <div key={i} className="glass rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className="text-lg font-bold text-white">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 glass rounded-xl p-4 h-28 flex items-end gap-1">
                {barHeights.map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-cyan-500 to-teal-400 opacity-80" style={{ height: h + '%' }} />
                ))}
              </div>
              <div className="col-span-2 glass rounded-xl p-4 h-28 flex flex-col justify-between">
                <div className="text-xs text-gray-500">AI Summary</div>
                <div className="space-y-2">
                  {progressWidths.map((w, i) => (
                    <div key={i} className="h-2 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: w + '%' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 text-center border border-white/5 hover:border-cyan-500/20 transition-colors duration-300">
              <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent mb-2">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-violet-500/20 mb-4">
              <Sparkles size={14} className="text-violet-400" />
              <span className="text-xs text-violet-300 font-medium tracking-wider uppercase">Everything You Need</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Built for Modern Data Teams</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">From upload to insight in seconds. No data science degree required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} className={'relative rounded-2xl p-6 bg-gradient-to-br ' + f.color + ' border ' + f.border + ' hover:scale-105 transition-all duration-300 group cursor-default'}>
                  <div className={'w-10 h-10 rounded-xl glass flex items-center justify-center mb-4 ' + f.iconColor + ' group-hover:scale-110 transition-transform duration-300'}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Demo ── */}
      <section id="demo" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-cyan-500/20 mb-4">
              <Play size={14} className="text-cyan-400" />
              <span className="text-xs text-cyan-300 font-medium tracking-wider uppercase">How It Works</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">From Upload to Insight in 4 Steps</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">No setup. No coding. Just upload your data and start asking questions.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Step selector */}
            <div className="space-y-4">
              {demoSteps.map((step, i) => {
                const Icon = step.icon
                const isActive = activeStep === i
                return (
                  <button key={i} onClick={() => setActiveStep(i)}
                    className={'w-full text-left p-5 rounded-2xl border transition-all duration-300 ' +
                      (isActive
                        ? 'glass-card ' + step.border + ' scale-[1.02]'
                        : 'border-white/5 hover:border-white/10 hover:bg-white/2')}>
                    <div className="flex items-start gap-4">
                      <div className={'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ' + step.bg}>
                        <Icon size={18} className={step.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={'text-xs font-bold ' + (isActive ? step.color : 'text-gray-600')}>{step.step}</span>
                          <h3 className={'font-bold text-sm ' + (isActive ? 'text-white' : 'text-gray-400')}>{step.title}</h3>
                        </div>
                        {isActive && <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>}
                      </div>
                      {isActive && (
                        <div className={'w-2 h-2 rounded-full flex-shrink-0 mt-1 ' + step.bg.replace('/10', '')}>
                          <div className={'w-2 h-2 rounded-full animate-pulse ' + step.color.replace('text-', 'bg-')} />
                        </div>
                      )}
                    </div>
                    {/* Progress bar for active step */}
                    {isActive && (
                      <div className="mt-3 h-0.5 rounded-full bg-white/10 overflow-hidden">
                        <div className={'h-full rounded-full ' + step.color.replace('text-', 'bg-') + ' animate-[grow_3.5s_linear]'} style={{ width: '100%' }} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Live preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 rounded-3xl blur-xl" />
              <div className="relative glass-card rounded-3xl p-6 border border-white/8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <div className="flex-1 mx-3 h-5 rounded-md bg-white/5 flex items-center px-2">
                    <span className="text-xs text-gray-600">datamind.ai/dashboard</span>
                  </div>
                </div>
                <div className="transition-all duration-500">
                  {demoSteps[activeStep].preview}
                </div>
                {/* Step dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {demoSteps.map((_, i) => (
                    <button key={i} onClick={() => setActiveStep(i)}
                      className={'h-1.5 rounded-full transition-all duration-300 ' +
                        (activeStep === i ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/20')} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-amber-500/20 mb-4">
              <Tag size={14} className="text-amber-400" />
              <span className="text-xs text-amber-300 font-medium tracking-wider uppercase">Simple Pricing</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Plans for Every Team</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">Start free. Upgrade when you need more. Cancel anytime.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 glass border border-white/10 rounded-2xl p-1.5">
              <button onClick={() => setBillingAnnual(false)}
                className={'px-5 py-2 rounded-xl text-sm font-medium transition-all ' +
                  (!billingAnnual ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-white')}>
                Monthly
              </button>
              <button onClick={() => setBillingAnnual(true)}
                className={'px-5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ' +
                  (billingAnnual ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-500 hover:text-white')}>
                Annual
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i}
                className={'relative glass-card rounded-3xl p-8 border transition-all duration-300 hover:scale-[1.02] ' + plan.color +
                  (plan.badge ? ' ring-1 ring-cyan-500/30' : '')}>

                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-xs font-bold text-white shadow-lg shadow-cyan-500/30">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <h3 className="font-bold text-white text-xl mb-1">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.desc}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-white">
                      {billingAnnual ? annualPrice(plan.price) : plan.price}
                    </span>
                    <span className="text-gray-500 text-sm mb-1.5">/{plan.period}</span>
                  </div>
                  {billingAnnual && plan.price !== '$0' && (
                    <p className="text-xs text-emerald-400 mt-1">
                      Billed annually · Save {Math.round(parseInt(plan.price.replace('$', '')) * 0.2 * 12)}/yr
                    </p>
                  )}
                </div>

                {/* CTA button */}
                <button onClick={handleCTA}
                  className={'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 mb-6 ' + plan.btnStyle}>
                  {plan.btnText}
                </button>

                {/* Feature list */}
                <div className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className={'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ' +
                        (feature.included ? 'bg-emerald-500/20' : 'bg-white/5')}>
                        {feature.included
                          ? <Check size={10} className="text-emerald-400" />
                          : <X    size={10} className="text-gray-600" />}
                      </div>
                      <span className={'text-sm ' + (feature.included ? 'text-gray-300' : 'text-gray-600')}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Money back */}
          <p className="text-center text-sm text-gray-500 mt-8 flex items-center justify-center gap-2">
            <Shield size={14} className="text-emerald-400" />
            30-day money-back guarantee · No credit card required for Free plan
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400">Everything you need to know about DataMind AI.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i}
                className={'glass-card rounded-2xl border transition-all duration-300 overflow-hidden ' +
                  (activeFaq === i ? 'border-cyan-500/20' : 'border-white/5 hover:border-white/10')}>
                <button onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className={'font-semibold text-sm ' + (activeFaq === i ? 'text-cyan-400' : 'text-white')}>
                    {faq.q}
                  </span>
                  <ChevronRight size={16}
                    className={'text-gray-500 transition-transform flex-shrink-0 ml-4 ' + (activeFaq === i ? 'rotate-90 text-cyan-400' : '')} />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto glass-card rounded-3xl p-12 text-center border border-cyan-500/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 pointer-events-none" />
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 relative">
            {user ? `Ready to dive in, ${displayName}?` : 'Ready to Unlock Your Data?'}
          </h2>
          <p className="text-gray-400 text-lg mb-8 relative">
            {user
              ? 'Your dashboard is waiting. Jump back in and keep analyzing.'
              : 'Join thousands of analysts who use DataMind AI every day.'}
          </p>
          <button onClick={handleCTA}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold text-lg hover:opacity-90 transition-all duration-300 hover:scale-105 active:scale-95 relative">
            {user ? 'Open Dashboard' : "Get Started — It's Free"} <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
              <Brain size={12} className="text-white" />
            </div>
            <span className="font-bold text-white">DataMind AI</span>
          </div>
          <p className="text-sm text-gray-600">© 2025 DataMind AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-600 hover:text-cyan-400 transition-colors text-sm flex items-center gap-1">
              <ExternalLink size={14} /> GitHub
            </a>
            <a href="#" className="text-gray-600 hover:text-cyan-400 transition-colors text-sm flex items-center gap-1">
              <Star size={14} /> Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}