const express = require('express')
const db = require('../db/init')

const router = express.Router()

// GET /api/skills
router.get('/', (req, res) => {
  const skills = db.prepare('SELECT * FROM skills').all()
  return res.json(skills)
})

module.exports = router
