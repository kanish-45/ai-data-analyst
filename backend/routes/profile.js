const express = require('express')
const bcrypt  = require('bcryptjs')
const User    = require('../models/User')
const auth    = require('../middleware/auth')

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
// Update name, nickname, email
router.patch('/', async (req, res) => {
  try {
    const { name, nickname, email } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'User not found.' })

    // Check if new email is taken by another user
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

    // Update localStorage session
    const updated = user.toSafeObject()
    res.json({ message: 'Profile updated successfully.', user: updated })
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

    // Need password field for comparison
    const user = await User.findById(req.user._id).select('+password')
    if (!user) return res.status(404).json({ message: 'User not found.' })

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' })
    }

    user.password = newPassword   // pre-save hook will hash it
    await user.save()

    res.json({ message: 'Password updated successfully.' })
  } catch (err) {
    console.error('Update password error:', err)
    res.status(500).json({ message: 'Failed to update password.' })
  }
})

module.exports = router