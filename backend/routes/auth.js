const express        = require('express')
const jwt            = require('jsonwebtoken')
const User           = require('../models/User')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// ── Config (set these in your environment / .env) ─────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://ai-data-analyst-liart.vercel.app'
const SERVER_URL   = process.env.SERVER_URL   || 'http://localhost:3001'

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

    if (!name || !nickname || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' })
    }

    const user  = await User.create({ name, nickname, email, password, plan: 'Free' })
    const token = generateToken(user._id)

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: user.toSafeObject(),
    })
  } catch (err) {
    console.error('Signup error:', err)
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

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

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
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.status(200).json({ user: req.user.toSafeObject() })
  } catch (err) {
    console.error('Me error:', err)
    res.status(500).json({ message: 'Server error.' })
  }
})

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', authMiddleware, (req, res) => {
  res.status(200).json({ message: 'Logged out successfully.' })
})

// ══════════════════════════════════════════════════════════════════════════════
//  OAuth — Google & GitHub (authorization-code flow, stateless)
// ══════════════════════════════════════════════════════════════════════════════

// After a successful login we bounce back to the frontend with the JWT in the
// URL *hash* (#token=…). The hash is never sent to a server and is kept out of
// referrer headers and access logs, so it's safer than a query param.
function redirectWithToken(res, token) {
  return res.redirect(`${FRONTEND_URL}/oauth/callback#token=${token}`)
}
function redirectWithError(res, message) {
  return res.redirect(`${FRONTEND_URL}/oauth/callback#error=${encodeURIComponent(message)}`)
}

// Find a user by their provider id, or by matching email (links the accounts),
// otherwise create a fresh one.
async function upsertOAuthUser({ provider, providerId, email, name, avatar }) {
  const idField = provider === 'google' ? 'googleId' : 'githubId'
  email = (email || '').toLowerCase()

  // 1) Already linked via this provider
  let user = await User.findOne({ [idField]: providerId })
  if (user) return user

  // 2) An existing account uses the same email → link the provider to it
  if (email) {
    user = await User.findOne({ email })
    if (user) {
      user[idField] = providerId
      if (!user.avatar && avatar) user.avatar = avatar
      await user.save()
      return user
    }
  }

  // 3) Brand-new user
  const safeName = (name || (email ? email.split('@')[0] : 'New User')).slice(0, 60)
  const nickname = (email ? email.split('@')[0] : safeName).slice(0, 30)
  return User.create({
    name:      safeName,
    nickname,
    email:     email || `${provider}_${providerId}@oauth.local`,
    [idField]: providerId,
    avatar:    avatar || '',
    plan:      'Free',
  })
}

// ── Google ────────────────────────────────────────────────────────────────────
router.get('/google', (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  `${SERVER_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'online',
    prompt:        'select_account',
  })
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code) return redirectWithError(res, 'Google sign-in was cancelled.')

    // Exchange the authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  `${SERVER_URL}/api/auth/google/callback`,
        grant_type:    'authorization_code',
      }),
    })
    const tokens = await tokenRes.json()
    if (!tokens.access_token) throw new Error('Failed to obtain Google access token')

    // Fetch the user's Google profile
    const profile = await (await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })).json()

    const user = await upsertOAuthUser({
      provider:   'google',
      providerId: profile.id,
      email:      profile.email,
      name:       profile.name,
      avatar:     profile.picture,
    })

    redirectWithToken(res, generateToken(user._id))
  } catch (err) {
    console.error('Google OAuth error:', err)
    redirectWithError(res, 'Google sign-in failed. Please try again.')
  }
})

// ── GitHub ────────────────────────────────────────────────────────────────────
router.get('/github', (req, res) => {
  const params = new URLSearchParams({
    client_id:    process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${SERVER_URL}/api/auth/github/callback`,
    scope:        'read:user user:email',
    allow_signup: 'true',
  })
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
})

router.get('/github/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code) return redirectWithError(res, 'GitHub sign-in was cancelled.')

    // Exchange the code for an access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        code,
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri:  `${SERVER_URL}/api/auth/github/callback`,
      }),
    })
    const tokens = await tokenRes.json()
    if (!tokens.access_token) throw new Error('Failed to obtain GitHub access token')

    const ghHeaders = {
      Authorization: `Bearer ${tokens.access_token}`,
      'User-Agent':  'DataMind-AI',
      Accept:        'application/vnd.github+json',
    }

    const profile = await (await fetch('https://api.github.com/user', { headers: ghHeaders })).json()

    // GitHub often hides the email on the public profile — fetch verified emails
    let email = profile.email
    if (!email) {
      const emails = await (await fetch('https://api.github.com/user/emails', { headers: ghHeaders })).json()
      const primary = Array.isArray(emails)
        ? (emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified))
        : null
      email = primary?.email || null
    }

    const user = await upsertOAuthUser({
      provider:   'github',
      providerId: String(profile.id),
      email,
      name:       profile.name || profile.login,
      avatar:     profile.avatar_url,
    })

    redirectWithToken(res, generateToken(user._id))
  } catch (err) {
    console.error('GitHub OAuth error:', err)
    redirectWithError(res, 'GitHub sign-in failed. Please try again.')
  }
})

module.exports = router