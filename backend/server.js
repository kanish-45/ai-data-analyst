require('dotenv').config()

const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')

const authRoutes        = require('./routes/auth')
const chatRoutes        = require('./routes/chat')
const datasetRoutes     = require('./routes/datasets')
const statsRoutes       = require('./routes/stats')
const profileRoutes     = require('./routes/profile')
const completionRoutes  = require('./routes/chat-completion')   // ← NEW

const app  = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://ai-data-analyst-liart.vercel.app',
    'https://ai-data-analyst-fd3vp4nk9.vercel.app',
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/chat',     chatRoutes)
app.use('/api/chat',     completionRoutes)        // ← NEW (adds POST /api/chat/completion)
app.use('/api/datasets', datasetRoutes)
app.use('/api/stats',    statsRoutes)
app.use('/api/profile',  profileRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status:   'ok',
    message:  'DataMind API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ai:       process.env.GROQ_API_KEY ? 'configured' : 'missing key',
    time:     new Date().toISOString(),
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error' })
})

// ── MongoDB Connection & Server Start ─────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully')
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🤖 AI completion: http://localhost:${PORT}/api/chat/completion`)
      console.log(`👤 Profile API:   http://localhost:${PORT}/api/profile`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })