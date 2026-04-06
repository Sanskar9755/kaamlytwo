const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('../db/init')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

const uploadDir = path.join(__dirname, '../../uploads/profiles')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${req.user.id}_${Date.now()}${ext}`)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) cb(null, true)
    else cb(new Error('Sirf JPG aur PNG allowed hain.'))
  }
})

const buildProfileResponse = (userId) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId)
  if (!profile) return { profile: null, is_complete: false }

  const skills = db.prepare(`
    SELECT s.id, s.name, s.icon, s.rate_unit, s.rate_unit_label, ps.rate
    FROM profile_skills ps
    JOIN skills s ON s.id = ps.skill_id
    WHERE ps.profile_id = ?
  `).all(profile.id)

  const appUrl = process.env.APP_URL || 'http://localhost:5000'
  return {
    profile: {
      id: profile.id,
      user_id: profile.user_id,
      name: profile.name,
      photo_url: profile.photo_path ? `${appUrl}/uploads/profiles/${path.basename(profile.photo_path)}` : null,
      location: profile.location,
      is_complete: profile.is_complete === 1,
      skills
    },
    is_complete: profile.is_complete === 1
  }
}

// GET /api/profile
router.get('/', authMiddleware, (req, res) => {
  return res.json(buildProfileResponse(req.user.id))
})

// PUT /api/profile
router.put('/', authMiddleware, (req, res) => {
  const { name, location, skills } = req.body
  if (!name || name.trim().length < 2) return res.status(422).json({ message: 'Naam kam se kam 2 characters ka hona chahiye.' })
  if (!skills || !Array.isArray(skills) || skills.length === 0) return res.status(422).json({ message: 'Kam se kam ek skill select karein.' })

  for (const s of skills) {
    if (!s.skill_id || !s.rate || s.rate <= 0) return res.status(422).json({ message: 'Har skill ka rate 0 se zyada hona chahiye.' })
    const skillExists = db.prepare('SELECT id FROM skills WHERE id = ?').get(s.skill_id)
    if (!skillExists) return res.status(422).json({ message: `Invalid skill ID: ${s.skill_id}` })
  }

  const normalizedLocation = location && location.trim() ? location.trim() : null
  const now = new Date().toISOString()

  const existing = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.user.id)
  let profileId
  if (existing) {
    db.prepare('UPDATE profiles SET name = ?, location = ?, updated_at = ? WHERE user_id = ?').run(name.trim(), normalizedLocation, now, req.user.id)
    profileId = existing.id
  } else {
    const result = db.prepare('INSERT INTO profiles (user_id, name, location, is_complete) VALUES (?, ?, ?, 0)').run(req.user.id, name.trim(), normalizedLocation)
    profileId = result.lastInsertRowid
  }

  db.prepare('DELETE FROM profile_skills WHERE profile_id = ?').run(profileId)
  for (const s of skills) {
    db.prepare('INSERT INTO profile_skills (profile_id, skill_id, rate) VALUES (?, ?, ?)').run(profileId, s.skill_id, s.rate)
  }

  db.prepare('UPDATE profiles SET is_complete = 1, updated_at = ? WHERE id = ?').run(now, profileId)
  return res.json(buildProfileResponse(req.user.id))
})

// POST /api/profile/photo
router.post('/photo', authMiddleware, (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(422).json({ message: err.message })
    if (!req.file) return res.status(422).json({ message: 'Photo required hai.' })

    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id)
    if (profile?.photo_path && fs.existsSync(profile.photo_path)) {
      fs.unlinkSync(profile.photo_path)
    }

    const now = new Date().toISOString()
    if (profile) {
      db.prepare('UPDATE profiles SET photo_path = ?, updated_at = ? WHERE user_id = ?').run(req.file.path, now, req.user.id)
    } else {
      db.prepare('INSERT INTO profiles (user_id, name, photo_path, is_complete) VALUES (?, ?, ?, 0)').run(req.user.id, req.user.name, req.file.path)
    }

    const appUrl = process.env.APP_URL || 'http://localhost:5000'
    return res.json({ photo_url: `${appUrl}/uploads/profiles/${req.file.filename}` })
  })
})

module.exports = router
