const express = require('express')
const path = require('path')
const db = require('../db/init')

const router = express.Router()

// GET /api/workers?skill=Electrician&location=Jaipur
router.get('/', (req, res) => {
  const { skill, location } = req.query
  const appUrl = process.env.APP_URL || 'http://localhost:5000'

  let query = `
    SELECT DISTINCT p.id, p.user_id, p.name, p.photo_path, p.location,
      ROUND(COALESCE((SELECT AVG(r.rating) FROM reviews r WHERE r.worker_user_id = p.user_id), 0), 1) AS avg_rating,
      COALESCE((SELECT COUNT(r.id) FROM reviews r WHERE r.worker_user_id = p.user_id), 0) AS review_count
    FROM profiles p WHERE p.is_complete = 1
  `
  const params = []

  if (skill && skill.trim()) {
    query += ` AND p.id IN (
      SELECT ps.profile_id FROM profile_skills ps
      JOIN skills s ON s.id = ps.skill_id
      WHERE LOWER(s.name) = LOWER(?)
    )`
    params.push(skill.trim())
  }

  if (location && location.trim()) {
    query += ` AND p.location LIKE ?`
    params.push(`%${location.trim()}%`)
  }

  const profiles = db.prepare(query).all(...params)

  const workers = profiles.map(p => {
    let skillsQuery = `
      SELECT s.id, s.name, s.icon, s.rate_unit, s.rate_unit_label, ps.rate
      FROM profile_skills ps
      JOIN skills s ON s.id = ps.skill_id
      WHERE ps.profile_id = ?
    `
    const skillParams = [p.id]

    if (skill && skill.trim()) {
      skillsQuery += ` AND LOWER(s.name) = LOWER(?)`
      skillParams.push(skill.trim())
    }

    const skills = db.prepare(skillsQuery).all(...skillParams)

    return {
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      photo_url: p.photo_path ? `${appUrl}/uploads/profiles/${path.basename(p.photo_path)}` : null,
      location: p.location,
      skills,
      avg_rating: p.avg_rating,
      review_count: p.review_count,
    }
  })

  workers.sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count)

  return res.json({ workers, total: workers.length, filters: { skill: skill || null, location: location || null } })
})

module.exports = router
