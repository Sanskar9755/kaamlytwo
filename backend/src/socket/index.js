const socketAuthMiddleware = require('../middleware/socketAuth')
const db = require('../db/init')

module.exports = function initSocketServer(io) {
  io.use(socketAuthMiddleware)

  io.on('connection', (socket) => {
    // join_conversation
    socket.on('join_conversation', ({ conversationId }) => {
      const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId)
      if (!conv) return socket.emit('error', { message: 'Conversation nahi mili.' })
      if (socket.user.id !== conv.customer_id && socket.user.id !== conv.worker_id) {
        return socket.emit('error', { message: 'Unauthorized.' })
      }
      socket.join('conv_' + conversationId)
    })

    // send_message
    socket.on('send_message', ({ conversationId, content }) => {
      if (!content || !content.trim()) {
        return socket.emit('error', { message: 'Message khali nahi ho sakta.' })
      }
      if (content.length > 2000) {
        return socket.emit('error', { message: 'Message 2000 characters se zyada nahi ho sakta.' })
      }
      const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId)
      if (!conv) return socket.emit('error', { message: 'Conversation nahi mili.' })
      if (socket.user.id !== conv.customer_id && socket.user.id !== conv.worker_id) {
        return socket.emit('error', { message: 'Unauthorized.' })
      }
      const result = db.prepare(
        'INSERT INTO messages (conversation_id, sender_id, type, content) VALUES (?, ?, ?, ?)'
      ).run(conversationId, socket.user.id, 'text', content.trim())
      db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversationId)
      const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid)
      io.to('conv_' + conversationId).emit('new_message', {
        ...message,
        photo_url: null,
      })
    })

    // mark_read
    socket.on('mark_read', ({ conversationId }) => {
      db.prepare(
        'UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?'
      ).run(conversationId, socket.user.id)
    })
  })
}
