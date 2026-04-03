const express        = require('express')
const jwt            = require('jsonwebtoken')
const User           = require('../models/User')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// ── Helper: generate JWT ──────────────────────────────────────────────────────
function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }  // token valid for 30 days
  )
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, nickname, email, password } = req.body

    // Validate required fields
    if (!name || !nickname || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    // Create user (password is hashed by pre-save hook in User model)
    const user = await User.create({ name, nickname, email, password, plan: 'Free' })

    // Generate JWT
    const token = generateToken(user._id)

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: user.toSafeObject(),
    })
  } catch (err) {
    console.error('Signup error:', err)
    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message)
      return res.status(400).json({ message: messages[0] })
    }
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    // Compare password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    // Generate JWT
    const token = generateToken(user._id)

    res.status(200).json({
      message: 'Logged in successfully.',
      token,
      user: user.toSafeObject(),
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// Protected — requires valid JWT
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.status(200).json({ user: req.user.toSafeObject() })
  } catch (err) {
    console.error('Me error:', err)
    res.status(500).json({ message: 'Server error.' })
  }
})

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// JWT is stateless — logout is handled on the frontend by clearing the token
// This endpoint exists for future token blacklisting if needed
router.post('/logout', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Logged out successfully.' })
})

module.exports = router