const express     = require('express')
const bcrypt      = require('bcryptjs')
const User        = require('../models/User')
const Dataset     = require('../models/Dataset')
const ChatSession = require('../models/Chat')
const auth        = require('../middleware/auth')

const router = express.Router()
router.use(auth)

// ── GET /api/profile ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found.' })
    res.json({ user: user.toSafeObject() })
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json({ message: 'Failed to load profile.' })
  }
})

// ── PATCH /api/profile ────────────────────────────────────────────────────────
router.patch('/', async (req, res) => {
  try {
    const { name, nickname, email } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    if (email && email !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() })
      if (existing) {
        return res.status(409).json({ message: 'Email already in use by another account.' })
      }
      user.email = email.toLowerCase()
    }

    if (name)     user.name     = name.trim()
    if (nickname) user.nickname = nickname.trim()

    await user.save()

    res.json({ message: 'Profile updated successfully.', user: user.toSafeObject() })
  } catch (err) {
    console.error('Update profile error:', err)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors)[0].message })
    }
    res.status(500).json({ message: 'Failed to update profile.' })
  }
})

// ── PATCH /api/profile/password ───────────────────────────────────────────────
router.patch('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required.' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' })
    }

    const user = await User.findById(req.user._id).select('+password')
    if (!user) return res.status(404).json({ message: 'User not found.' })

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' })
    }

    user.password = newPassword
    await user.save()
    res.json({ message: 'Password updated successfully.' })
  } catch (err) {
    console.error('Update password error:', err)
    res.status(500).json({ message: 'Failed to update password.' })
  }
})

// ── GET /api/profile/export ───────────────────────────────────────────────────
// Returns a downloadable JSON bundle of EVERYTHING the user owns.
// Useful as a "Download my data" GDPR-style portability feature.
router.get('/export', async (req, res) => {
  try {
    const userId = req.user._id

    const [user, datasets, chats] = await Promise.all([
      User.findById(userId).select('-password'),
      Dataset.find({ user: userId }).lean(),
      ChatSession.find({ user: userId }).lean(),
    ])

    if (!user) return res.status(404).json({ message: 'User not found.' })

    const bundle = {
      meta: {
        exportedAt:  new Date().toISOString(),
        version:     '1.0',
        application: 'DataMind AI',
        notes:       'This is a full export of your account data from DataMind AI.',
      },
      account: {
        id:        user._id,
        name:      user.name,
        nickname:  user.nickname,
        email:     user.email,
        plan:      user.plan,
        createdAt: user.createdAt,
      },
      datasets: datasets.map((d) => ({
        id:          d._id,
        name:        d.name,
        type:        d.type,
        rowCount:    d.rowCount,
        columns:     d.columns,
        sampleRows:  d.sampleRows,
        createdAt:   d.createdAt,
        updatedAt:   d.updatedAt,
      })),
      chatSessions: chats.map((c) => ({
        id:           c._id,
        title:        c.title,
        model:        c.model,
        messages:     c.messages,
        datasetInfo:  c.datasetInfo,
        createdAt:    c.createdAt,
        updatedAt:    c.updatedAt,
      })),
      summary: {
        totalDatasets:     datasets.length,
        totalChatSessions: chats.length,
        totalMessages:     chats.reduce((sum, c) => sum + (c.messages?.length || 0), 0),
      },
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="datamind-export-${Date.now()}.json"`
    )
    res.send(JSON.stringify(bundle, null, 2))
  } catch (err) {
    console.error('Export error:', err)
    res.status(500).json({ message: 'Failed to export your data.' })
  }
})

module.exports = router