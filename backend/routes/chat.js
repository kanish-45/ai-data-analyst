const express     = require('express')
const ChatSession = require('../models/Chat')
const auth        = require('../middleware/auth')

const router = express.Router()

// All chat routes require authentication
router.use(auth)

// ── GET /api/chat/sessions ────────────────────────────────────────────────────
// Get all chat sessions for the logged-in user (summaries only, no messages)
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await ChatSession
      .find({ user: req.user._id })
      .select('-messages')          // exclude messages for performance
      .sort({ updatedAt: -1 })      // most recent first
      .limit(50)                    // max 50 sessions

    res.json({ sessions: sessions.map((s) => s.toSummary()) })
  } catch (err) {
    console.error('Get sessions error:', err)
    res.status(500).json({ message: 'Failed to load chat sessions.' })
  }
})

// ── POST /api/chat/sessions ───────────────────────────────────────────────────
// Create a new chat session
router.post('/sessions', async (req, res) => {
  try {
    const { model, datasetInfo } = req.body

    const session = await ChatSession.create({
      user:        req.user._id,
      title:       'New Chat',
      model:       model || 'llama3.2',
      datasetInfo: datasetInfo || { name: null, rowCount: null, columns: [] },
      messages:    [],
    })

    res.status(201).json({ session: session.toSummary() })
  } catch (err) {
    console.error('Create session error:', err)
    res.status(500).json({ message: 'Failed to create chat session.' })
  }
})

// ── GET /api/chat/sessions/:id ────────────────────────────────────────────────
// Get a single session WITH all its messages
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id:  req.params.id,
      user: req.user._id,     // ensure user owns this session
    })

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found.' })
    }

    res.json({
      session: {
        id:          session._id,
        title:       session.title,
        model:       session.model,
        datasetInfo: session.datasetInfo,
        messages:    session.messages,
        createdAt:   session.createdAt,
        updatedAt:   session.updatedAt,
      },
    })
  } catch (err) {
    console.error('Get session error:', err)
    res.status(500).json({ message: 'Failed to load chat session.' })
  }
})

// ── POST /api/chat/sessions/:id/messages ─────────────────────────────────────
// Add one or more messages to a session
router.post('/sessions/:id/messages', async (req, res) => {
  try {
    const { messages } = req.body   // array of { role, text, time }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array is required.' })
    }

    const session = await ChatSession.findOne({
      _id:  req.params.id,
      user: req.user._id,
    })

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found.' })
    }

    // Add new messages
    session.messages.push(...messages)

    // Auto-generate title from first user message
    session.generateTitle()

    await session.save()

    res.json({
      session: session.toSummary(),
      messageCount: session.messages.length,
    })
  } catch (err) {
    console.error('Add messages error:', err)
    res.status(500).json({ message: 'Failed to save messages.' })
  }
})

// ── PATCH /api/chat/sessions/:id ─────────────────────────────────────────────
// Update session title or model
router.patch('/sessions/:id', async (req, res) => {
  try {
    const { title, model } = req.body

    const session = await ChatSession.findOne({
      _id:  req.params.id,
      user: req.user._id,
    })

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found.' })
    }

    if (title !== undefined) {
      session.title          = title.slice(0, 100)
      session.titleGenerated = true   // manual title — don't auto-overwrite
    }
    if (model !== undefined) session.model = model

    await session.save()
    res.json({ session: session.toSummary() })
  } catch (err) {
    console.error('Update session error:', err)
    res.status(500).json({ message: 'Failed to update session.' })
  }
})

// ── DELETE /api/chat/sessions/:id ────────────────────────────────────────────
// Delete a chat session
router.delete('/sessions/:id', async (req, res) => {
  try {
    const session = await ChatSession.findOneAndDelete({
      _id:  req.params.id,
      user: req.user._id,
    })

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found.' })
    }

    res.json({ message: 'Chat session deleted.' })
  } catch (err) {
    console.error('Delete session error:', err)
    res.status(500).json({ message: 'Failed to delete session.' })
  }
})

// ── DELETE /api/chat/sessions ─────────────────────────────────────────────────
// Delete ALL sessions for the logged-in user
router.delete('/sessions', async (req, res) => {
  try {
    const result = await ChatSession.deleteMany({ user: req.user._id })
    res.json({ message: `Deleted ${result.deletedCount} chat sessions.` })
  } catch (err) {
    console.error('Delete all sessions error:', err)
    res.status(500).json({ message: 'Failed to delete sessions.' })
  }
})

module.exports = router