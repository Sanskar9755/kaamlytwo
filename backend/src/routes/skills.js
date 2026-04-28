const express = require('express')
const db = require('../db/init')

const router = express.Router()

// GET /api/skills - returns all categories with their skills and sub-skills
router.get('/', (req, res) => {
  const categories = db.prepare('SELECT id, name, icon, sort_order FROM categories ORDER BY sort_order').all()

  const result = categories.map(cat => {
    const skills = db.prepare('SELECT id, category_id, name, icon, rate_unit, rate_unit_label FROM skills WHERE category_id = ? ORDER BY name').all(cat.id)
    const skillsWithSubs = skills.map(skill => {
      const subSkills = db.prepare('SELECT id, skill_id, name FROM sub_skills WHERE skill_id = ? ORDER BY name').all(skill.id)
      return { ...skill, sub_skills: subSkills }
    })
    return { ...cat, skills: skillsWithSubs }
  })

  // Also include uncategorized skills for backward compat
  const uncategorized = db.prepare('SELECT * FROM skills WHERE category_id IS NULL ORDER BY name').all()
  if (uncategorized.length > 0) {
    result.push({ id: null, name: 'Other', icon: '🔧', sort_order: 99, skills: uncategorized.map(s => ({ ...s, sub_skills: [] })) })
  }

  return res.json({ categories: result })
})

// GET /api/skills/flat - flat list for backward compat
router.get('/flat', (req, res) => {
  const skills = db.prepare('SELECT * FROM skills ORDER BY name').all()
  return res.json(skills)
})

module.exports = router
