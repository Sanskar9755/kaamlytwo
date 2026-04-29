const express = require('express')
const db = require('../db/init')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

// POST /api/payment/unlock - unlock chat with a worker
router.post('/unlock', authMiddleware, (req, res) => {
  const { worker_id, payment_method, payment_ref } = req.body
  const customer_id = req.user.id

  if (!worker_id) return res.status(422).json({ message: 'worker_id required.' })

  const worker = db.prepare('SELECT id FROM users WHERE id = ?').get(worker_id)
  if (!worker) return res.status(404).json({ message: 'Worker not found.' })

  if (customer_id === worker_id) return res.status(422).json({ message: 'Cannot unlock chat with yourself.' })

  // Check if already unlocked
  const existing = db.prepare('SELECT id FROM unlocked_chats WHERE customer_id = ? AND worker_id = ?').get(customer_id, worker_id)
  if (existing) return res.json({ status: 'already_unlocked', message: 'Chat already unlocked.' })

  // Save unlock record (simulated payment)
  db.prepare('INSERT INTO unlocked_chats (customer_id, worker_id, amount, payment_method, payment_ref) VALUES (?, ?, ?, ?, ?)')
    .run(customer_id, worker_id, 10, payment_method || 'simulated', payment_ref || `SIM_${Date.now()}`)

  return res.json({ status: 'unlocked', message: 'Chat unlocked successfully.' })
})

// GET /api/payment/check/:workerId - check if chat is unlocked
router.get('/check/:workerId', authMiddleware, (req, res) => {
  const customer_id = req.user.id
  const worker_id = parseInt(req.params.workerId)

  const unlocked = db.prepare('SELECT id, created_at FROM unlocked_chats WHERE customer_id = ? AND worker_id = ?').get(customer_id, worker_id)
  return res.json({ unlocked: !!unlocked, unlocked_at: unlocked?.created_at || null })
})

// GET /api/payment/unlocked - list all unlocked workers for current user
router.get('/unlocked', authMiddleware, (req, res) => {
  const customer_id = req.user.id
  const list = db.prepare('SELECT worker_id, amount, payment_method, created_at FROM unlocked_chats WHERE customer_id = ?').all(customer_id)
  return res.json({ unlocked: list })
})

module.exports = router
