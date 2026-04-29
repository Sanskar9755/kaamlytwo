const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('../db/init')

const router = express.Router()

// Ensure uploads/chat directory exists
const chatUploadDir = path.join(__dirname, '../../uploads/chat')
if (!fs.existsSync(chatUploadDir)) fs.mkdirSync(chatUploadDir, { recursive: true })

// Multer config for chat photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, chatUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${req.user.id}_${Date.now()}${ext}`)
  },
})

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(Object.assign(new Error('Sirf JPEG, PNG, GIF, aur WebP allowed hain.'), { code: 'INVALID_TYPE' }))
    }
    cb(null, true)
  },
})

// POST /api/chat/conversations — create or get conversation
router.post('/conversations', (req, res) => {
  const { worker_id } = req.body
  const customer_id = req.user.id

  if (!worker_id) return res.status(422).json({ message: 'worker_id required hai.' })

  const worker = db.prepare('SELECT id FROM users WHERE id = ?').get(worker_id)
  if (!worker) return res.status(404).json({ message: 'Worker nahi mila.' })

  // Check if chat is unlocked (payment done) - workers can always chat
  const isWorker = db.prepare('SELECT id FROM profiles WHERE user_id = ? AND is_complete = 1').get(customer_id)
  if (!isWorker) {
    const unlocked = db.prepare('SELECT id FROM unlocked_chats WHERE customer_id = ? AND worker_id = ?').get(customer_id, worker_id)
    if (!unlocked) {
      return res.status(402).json({ message: 'Payment required to unlock chat.', code: 'PAYMENT_REQUIRED' })
    }
  }

  try {
    db.prepare(
      'INSERT OR IGNORE INTO conversations (customer_id, worker_id) VALUES (?, ?)'
    ).run(customer_id, worker_id)

    const conv = db.prepare(
      'SELECT * FROM conversations WHERE customer_id = ? AND worker_id = ?'
    ).get(customer_id, worker_id)

    return res.status(200).json({ conversation: conv })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error.' })
  }
})

// GET /api/chat/conversations — inbox list
router.get('/conversations', (req, res) => {
  const userId = req.user.id

  try {
    const conversations = db.prepare(`
      SELECT
        c.id,
        c.customer_id,
        c.worker_id,
        c.updated_at,
        CASE WHEN c.customer_id = ? THEN c.worker_id ELSE c.customer_id END AS other_user_id,
        p.name AS other_name,
        p.photo_path AS other_photo_path,
        (
          SELECT m.content FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC LIMIT 1
        ) AS last_message_content,
        (
          SELECT m.type FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC LIMIT 1
        ) AS last_message_type,
        (
          SELECT m.created_at FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC LIMIT 1
        ) AS last_message_at,
        (
          SELECT COUNT(*) FROM messages m
          WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.is_read = 0
        ) AS unread_count
      FROM conversations c
      LEFT JOIN profiles p ON p.user_id = (CASE WHEN c.customer_id = ? THEN c.worker_id ELSE c.customer_id END)
      WHERE c.customer_id = ? OR c.worker_id = ?
      ORDER BY c.updated_at DESC
    `).all(userId, userId, userId, userId, userId)

    const result = conversations.map(conv => ({
      id: conv.id,
      other_user: {
        id: conv.other_user_id,
        name: conv.other_name || null,
        photo_url: conv.other_photo_path
          ? (process.env.APP_URL || 'http://localhost:5000') + '/uploads/profiles/' + conv.other_photo_path
          : null,
      },
      last_message: conv.last_message_at
        ? { content: conv.last_message_content, type: conv.last_message_type, created_at: conv.last_message_at }
        : null,
      unread_count: conv.unread_count,
      updated_at: conv.updated_at,
    }))

    return res.json({ conversations: result })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error.' })
  }
})

// GET /api/chat/conversations/:id/messages — paginated history
router.get('/conversations/:id/messages', (req, res) => {
  const conversationId = parseInt(req.params.id)
  const userId = req.user.id
  const before = req.query.before ? parseInt(req.query.before) : null
  const limit = Math.min(parseInt(req.query.limit) || 50, 50)

  try {
    const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId)
    if (!conv) return res.status(404).json({ message: 'Conversation nahi mili.' })
    if (userId !== conv.customer_id && userId !== conv.worker_id) {
      return res.status(403).json({ message: 'Unauthorized.' })
    }

    let messages
    if (before) {
      messages = db.prepare(`
        SELECT * FROM messages
        WHERE conversation_id = ? AND id < ?
        ORDER BY created_at ASC
        LIMIT ?
      `).all(conversationId, before, limit)
    } else {
      messages = db.prepare(`
        SELECT * FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at ASC
        LIMIT ?
      `).all(conversationId, limit)
    }

    const result = messages.map(m => ({
      ...m,
      photo_url: m.photo_path
        ? (process.env.APP_URL || 'http://localhost:5000') + '/uploads/chat/' + m.photo_path
        : null,
    }))

    return res.json({ messages: result })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error.' })
  }
})

// POST /api/chat/conversations/:id/messages/photo — photo upload
router.post('/conversations/:id/messages/photo', (req, res) => {
  const conversationId = parseInt(req.params.id)
  const userId = req.user.id

  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId)
  if (!conv) return res.status(404).json({ message: 'Conversation nahi mili.' })
  if (userId !== conv.customer_id && userId !== conv.worker_id) {
    return res.status(403).json({ message: 'Unauthorized.' })
  }

  upload.single('photo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(422).json({ message: 'Photo 5MB se badi nahi ho sakti.' })
      }
      if (err.code === 'INVALID_TYPE') {
        return res.status(422).json({ message: 'Sirf JPEG, PNG, GIF, aur WebP allowed hain.' })
      }
      return res.status(422).json({ message: err.message })
    }

    if (!req.file) return res.status(422).json({ message: 'Photo required hai.' })

    try {
      const result = db.prepare(
        'INSERT INTO messages (conversation_id, sender_id, type, photo_path) VALUES (?, ?, ?, ?)'
      ).run(conversationId, userId, 'image', req.file.filename)

      db.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").run(conversationId)

      const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid)
      const photoUrl = (process.env.APP_URL || 'http://localhost:5000') + '/uploads/chat/' + message.photo_path

      const io = req.app.get('io')
      if (io) {
        io.to('conv_' + conversationId).emit('new_message', {
          ...message,
          photo_url: photoUrl,
        })
      }

      return res.status(201).json({
        message: { ...message, photo_url: photoUrl },
      })
    } catch (dbErr) {
      console.error(dbErr)
      return res.status(500).json({ message: 'Internal server error.' })
    }
  })
})

module.exports = router
