const jwt  = require('jsonwebtoken')
const User = require('../models/User')

module.exports = async function authMiddleware(req, res, next) {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please log in.' })
    }

    const token = header.split(' ')[1]

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please log in again.' })
      }
      return res.status(401).json({ message: 'Invalid token. Please log in again.' })
    }

    // Attach user to request
    const user = await User.findById(decoded.id).select('-password')
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('Auth middleware error:', err)
    res.status(500).json({ message: 'Server error during authentication.' })
  }
}