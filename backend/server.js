require('dotenv').config()

const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')

const authRoutes = require('./routes/auth')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)

// Health check — visit http://localhost:3001/api/health
app.get('/api/health', (req, res) => {
  res.json({
    status:   'ok',
    message:  'DataMind API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
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

// ── Connect to MongoDB then start server ──────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully')
    app.listen(PORT, () => {
      console.log(`🚀 DataMind API running on http://localhost:${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })