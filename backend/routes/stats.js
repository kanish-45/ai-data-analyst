const express     = require('express')
const auth        = require('../middleware/auth')
const Dataset     = require('../models/Dataset')
const ChatSession = require('../models/Chat')

const router = express.Router()

router.use(auth)

// ── GET /api/stats/overview ───────────────────────────────────────────────────
// Returns real counts for the dashboard overview cards
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user._id

    // Run all queries in parallel for speed
    const [
      totalDatasets,
      totalChats,
      recentDatasets,
      recentChats,
    ] = await Promise.all([
      // Total datasets uploaded by this user
      Dataset.countDocuments({ user: userId }),

      // Total chat messages sent by this user
      ChatSession.aggregate([
        { $match: { user: userId } },
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } },
      ]),

      // Datasets uploaded in last 7 days
      Dataset.countDocuments({
        user:      userId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),

      // Chat sessions created today
      ChatSession.countDocuments({
        user:      userId,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ])

    const totalMessages = totalChats[0]?.total || 0

    // Recent activity — last 5 datasets uploaded
    const latestDatasets = await Dataset
      .find({ user: userId })
      .select('name type createdAt')
      .sort({ createdAt: -1 })
      .limit(5)

    // Recent chat sessions
    const latestChats = await ChatSession
      .find({ user: userId })
      .select('title createdAt messages')
      .sort({ updatedAt: -1 })
      .limit(5)

    // Build recent activity feed (mix of datasets and chats)
    const activity = [
      ...latestDatasets.map((d) => ({
        name:   d.name,
        action: 'Uploaded',
        time:   timeAgo(d.createdAt),
        status: 'success',
        type:   'dataset',
      })),
      ...latestChats.map((c) => ({
        name:   c.title || 'Chat session',
        action: `${c.messages?.length || 0} messages`,
        time:   timeAgo(c.createdAt),
        status: 'success',
        type:   'chat',
      })),
    ]
      .sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime))
      .slice(0, 5)

    res.json({
      stats: {
        totalDatasets,
        totalMessages,
        recentDatasets,  // last 7 days
        recentChats,     // today
      },
      activity: latestDatasets.map((d) => ({
        name:   d.name,
        action: 'Uploaded',
        time:   timeAgo(d.createdAt),
        status: 'success',
      })),
    })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ message: 'Failed to load stats.' })
  }
})

// ── Helper: human-readable time ago ──────────────────────────────────────────
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins} min ago`
  if (hours < 24) return `${hours} hr ago`
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

module.exports = router