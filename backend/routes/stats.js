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
      totalSessions,        // ← NEW: real session count
      totalChats,
      recentDatasets,
      recentChats,
    ] = await Promise.all([
      Dataset.countDocuments({ user: userId }),

      // Real chat-session count (each saved conversation = one session)
      ChatSession.countDocuments({ user: userId }),

      // Total chat messages this user has sent/received
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

    res.json({
      stats: {
        totalDatasets,
        totalSessions,     // ← NEW: real session count
        totalMessages,
        recentDatasets,    // last 7 days
        recentChats,       // today
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

// ── GET /api/stats/notifications ──────────────────────────────────────────────
// Real notifications based on actual user activity.
// We synthesize notifications from the most recent meaningful events:
//   • account creation (welcome)
//   • dataset uploads
//   • chat sessions started
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user._id
    const user   = req.user

    // Pull the most recent events
    const [latestDatasets, latestSessions] = await Promise.all([
      Dataset.find({ user: userId })
        .select('name createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      ChatSession.find({ user: userId })
        .select('title createdAt messages')
        .sort({ createdAt: -1 })
        .limit(5),
    ])

    const notifications = []

    // Dataset upload notifications
    for (const d of latestDatasets) {
      notifications.push({
        id:       `dataset-${d._id}`,
        title:    'Dataset uploaded',
        desc:     `${d.name} is ready to explore`,
        time:     timeAgo(d.createdAt),
        rawTime:  d.createdAt,
        type:     'dataset',
      })
    }

    // Chat-session notifications
    for (const s of latestSessions) {
      const msgCount = s.messages?.length || 0
      if (msgCount === 0) continue   // skip empty sessions
      notifications.push({
        id:       `chat-${s._id}`,
        title:    s.title || 'Chat session',
        desc:     `${msgCount} message${msgCount !== 1 ? 's' : ''} in this conversation`,
        time:     timeAgo(s.createdAt),
        rawTime:  s.createdAt,
        type:     'chat',
      })
    }

    // Account welcome — only if this is a relatively new account or there's
    // nothing else to show
    if (user.createdAt) {
      const ageMs = Date.now() - new Date(user.createdAt).getTime()
      if (ageMs < 7 * 24 * 60 * 60 * 1000 || notifications.length === 0) {
        notifications.push({
          id:      `welcome-${user._id}`,
          title:   'Welcome to DataMind AI! 👋',
          desc:    'Upload a dataset to get started',
          time:    timeAgo(user.createdAt),
          rawTime: user.createdAt,
          type:    'welcome',
        })
      }
    }

    // Sort newest-first and cap at 8
    notifications.sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime))
    const limited = notifications.slice(0, 8).map(({ rawTime, ...rest }) => rest)

    res.json({ notifications: limited })
  } catch (err) {
    console.error('Notifications error:', err)
    res.status(500).json({ message: 'Failed to load notifications.' })
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