const jwt = require('jsonwebtoken')
const db = require('../db/init')

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized. Token required.' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId)
    if (!user) return res.status(401).json({ message: 'User not found.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}
