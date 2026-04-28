const express = require('express')
const path = require('path')
const db = require('../db/init')

const router = express.Router()

// GET /api/workers?skill=Plumber&category=Home+Services&location=Delhi&sort=rating
router.get('/', (req, res) => {
  const { skill, category, location, sort } = req.query
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

  if (category && category.trim()) {
    query += ` AND p.id IN (
      SELECT ps.profile_id FROM profile_skills ps
      JOIN skills s ON s.id = ps.skill_id
      JOIN categories c ON c.id = s.category_id
      WHERE LOWER(c.name) = LOWER(?)
    )`
    params.push(category.trim())
  }

  if (location && location.trim()) {
    query += ` AND p.location LIKE ?`
    params.push(`%${location.trim()}%`)
  }

  const profiles = db.prepare(query).all(...params)

  const workers = profiles.map(p => {
    let skillsQuery = `
      SELECT s.id, s.name, s.icon, s.rate_unit, s.rate_unit_label,
             ps.id as profile_skill_id, ps.rate, ps.rate_type, ps.experience_level,
             c.name as category_name
      FROM profile_skills ps
      JOIN skills s ON s.id = ps.skill_id
      LEFT JOIN categories c ON c.id = s.category_id
      WHERE ps.profile_id = ?
    `
    const skillParams = [p.id]

    if (skill && skill.trim()) {
      skillsQuery += ` AND LOWER(s.name) = LOWER(?)`
      skillParams.push(skill.trim())
    }

    const skills = db.prepare(skillsQuery).all(...skillParams)

    const skillsWithSubs = skills.map(s => {
      const subSkills = db.prepare(`
        SELECT ss.id, ss.name FROM profile_sub_skills pss
        JOIN sub_skills ss ON ss.id = pss.sub_skill_id
        WHERE pss.profile_skill_id = ?
      `).all(s.profile_skill_id)
      return { ...s, sub_skills: subSkills }
    })

    return {
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      photo_url: p.photo_path ? `${appUrl}/uploads/profiles/${path.basename(p.photo_path)}` : null,
      location: p.location,
      skills: skillsWithSubs,
      avg_rating: p.avg_rating,
      review_count: p.review_count,
    }
  })

  // Sort
  if (sort === 'price_asc') {
    workers.sort((a, b) => (a.skills[0]?.rate || 0) - (b.skills[0]?.rate || 0))
  } else if (sort === 'price_desc') {
    workers.sort((a, b) => (b.skills[0]?.rate || 0) - (a.skills[0]?.rate || 0))
  } else {
    // Default: sort by rating
    workers.sort((a, b) => b.avg_rating - a.avg_rating || b.review_count - a.review_count)
  }

  return res.json({ workers, total: workers.length, filters: { skill: skill || null, category: category || null, location: location || null } })
})

module.exports = router
