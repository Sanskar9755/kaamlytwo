const jwt = require('jsonwebtoken')

module.exports = function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('Authentication error'))
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.user = { id: decoded.userId, role: decoded.role }
    next()
  } catch {
    next(new Error('Authentication error'))
  }
}
