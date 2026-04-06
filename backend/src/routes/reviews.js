const express = require('express')
const db = require('../db/init')

const router = express.Router()

// POST / — create a review (auth required, applied in index.js)
router.post('/', (req, res) => {
  const reviewerId = req.user.id
  const { worker_user_id, rating, comment } = req.body

  // Validate rating
  if (
    rating === undefined ||
    rating === null ||
    !Number.isInteger(Number(rating)) ||
    Number(rating) < 1 ||
    Number(rating) > 5 ||
    String(rating).includes('.')
  ) {
    return res.status(400).json({ message: 'Rating 1 se 5 ke beech honi chahiye (integer)' })
  }

  // Validate comment length
  if (comment && comment.length > 500) {
    return res.status(400).json({ message: 'Comment 500 characters se zyada nahi ho sakta' })
  }

  // Prevent self-review
  if (Number(worker_user_id) === reviewerId) {
    return res.status(403).json({ message: 'Aap apna khud review nahi de sakte' })
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO reviews (worker_user_id, reviewer_user_id, rating, comment) VALUES (?, ?, ?, ?)'
    )
    const result = stmt.run(Number(worker_user_id), reviewerId, Number(rating), comment || null)
    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid)
    return res.status(201).json({ review })
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'Aapne pehle se review de diya hai' })
    }
    console.error(err)
    return res.status(500).json({ message: 'Internal server error.' })
  }
})

// GET /:workerUserId — get all reviews for a worker (public)
router.get('/:workerUserId', (req, res) => {
  const workerUserId = parseInt(req.params.workerUserId)
  if (isNaN(workerUserId)) {
    return res.status(400).json({ message: 'Invalid worker user id' })
  }

  const reviews = db
    .prepare('SELECT * FROM reviews WHERE worker_user_id = ? ORDER BY created_at DESC')
    .all(workerUserId)

  const statsRow = db
    .prepare(
      'SELECT ROUND(COALESCE(AVG(rating), 0), 1) AS avg_rating, COUNT(id) AS review_count FROM reviews WHERE worker_user_id = ?'
    )
    .get(workerUserId)

  return res.json({
    reviews,
    stats: {
      avg_rating: statsRow.avg_rating,
      review_count: statsRow.review_count,
    },
  })
})

module.exports = router
