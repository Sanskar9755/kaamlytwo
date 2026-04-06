const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db/init')
const authMiddleware = require('../middleware/auth')

const router = express.Router()

const generateToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, phone, password } = req.body
  if (!name || name.trim().length < 2) return res.status(422).json({ message: 'Naam kam se kam 2 characters ka hona chahiye.' })
  if (!email && !phone) return res.status(422).json({ message: 'Email ya phone number required hai.' })
  if (!password || password.length < 8 || !/\d/.test(password)) return res.status(422).json({ message: 'Password kam se kam 8 characters aur ek number hona chahiye.' })

  if (email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) return res.status(409).json({ message: 'Ye email already registered hai. Login karein.' })
  }
  if (phone) {
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
    if (existing) return res.status(409).json({ message: 'Ye phone already registered hai. Login karein.' })
  }

  if (phone && !email) {
    // Phone registration — send OTP (stub: log to console)
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpHash = bcrypt.hashSync(otp, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    db.prepare('INSERT INTO otps (identifier, otp_hash, purpose, expires_at) VALUES (?, ?, ?, ?)').run(phone, otpHash, 'register', expiresAt)
    console.log(`[SMS] OTP to ${phone}: ${otp}`)
    return res.json({ status: 'otp_sent', phone })
  }

  // Email registration
  const passwordHash = bcrypt.hashSync(password, 12)
  const result = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)').run(name.trim(), email, passwordHash)
  const token = generateToken(result.lastInsertRowid, 'worker')
  const user = db.prepare('SELECT id, name, email, phone, role, status FROM users WHERE id = ?').get(result.lastInsertRowid)
  return res.status(201).json({ token, user })
})

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { phone, otp, purpose, name, password } = req.body
  if (!phone || !otp) return res.status(422).json({ message: 'Phone aur OTP required hain.' })

  const record = db.prepare('SELECT * FROM otps WHERE identifier = ? AND purpose = ? ORDER BY id DESC LIMIT 1').get(phone, purpose || 'register')
  if (!record) return res.status(422).json({ message: 'OTP nahi mila.' })
  if (record.used_at) return res.status(422).json({ message: 'OTP already use ho chuka hai.' })
  if (new Date() > new Date(record.expires_at)) return res.status(422).json({ message: 'OTP expire ho gaya.' })
  if (record.attempts >= 3) return res.status(422).json({ message: 'Max attempts. Naya OTP mangaein.' })

  if (!bcrypt.compareSync(otp, record.otp_hash)) {
    db.prepare('UPDATE otps SET attempts = attempts + 1 WHERE id = ?').run(record.id)
    return res.status(422).json({ message: 'Galat OTP.' })
  }

  db.prepare('UPDATE otps SET used_at = ? WHERE id = ?').run(new Date().toISOString(), record.id)

  if (purpose === 'register') {
    const passwordHash = bcrypt.hashSync(password, 12)
    const result = db.prepare('INSERT INTO users (name, phone, password, phone_verified_at) VALUES (?, ?, ?, ?)').run(name, phone, passwordHash, new Date().toISOString())
    const token = generateToken(result.lastInsertRowid, 'worker')
    const user = db.prepare('SELECT id, name, email, phone, role, status FROM users WHERE id = ?').get(result.lastInsertRowid)
    return res.json({ token, user })
  }

  return res.json({ status: 'otp_verified', phone })
})

// POST /api/auth/resend-otp
router.post('/resend-otp', (req, res) => {
  const { phone, purpose } = req.body
  const recent = db.prepare("SELECT * FROM otps WHERE identifier = ? AND purpose = ? AND created_at > datetime('now', '-1 minute') ORDER BY id DESC LIMIT 1").get(phone, purpose || 'register')
  if (recent) return res.status(429).json({ message: '1 minute baad try karein.' })

  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const otpHash = bcrypt.hashSync(otp, 10)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  db.prepare('INSERT INTO otps (identifier, otp_hash, purpose, expires_at) VALUES (?, ?, ?, ?)').run(phone, otpHash, purpose || 'register', expiresAt)
  console.log(`[SMS] OTP to ${phone}: ${otp}`)
  return res.json({ message: 'OTP bhej diya gaya hai.' })
})

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { identifier, password } = req.body
  if (!identifier || !password) return res.status(422).json({ message: 'Identifier aur password required hain.' })

  const field = identifier.includes('@') ? 'email' : 'phone'
  const user = db.prepare(`SELECT * FROM users WHERE ${field} = ?`).get(identifier)
  if (!user) return res.status(401).json({ message: 'Invalid credentials.' })
  if (user.status === 'banned') return res.status(403).json({ message: 'Aapka account suspend hai.' })
  if (user.status === 'inactive') return res.status(403).json({ message: 'Account verify nahi hua.' })
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ message: 'Invalid credentials.' })

  const token = generateToken(user.id, user.role)
  const { password: _, ...safeUser } = user
  return res.json({ token, user: safeUser })
})

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { identifier } = req.body
  const field = identifier?.includes('@') ? 'email' : 'phone'
  const user = db.prepare(`SELECT * FROM users WHERE ${field} = ?`).get(identifier)
  if (user) {
    const rawToken = require('crypto').randomBytes(32).toString('hex')
    const tokenHash = bcrypt.hashSync(rawToken, 10)
    db.prepare('INSERT INTO password_reset_tokens (email, phone, token) VALUES (?, ?, ?)').run(user.email || null, user.phone || null, tokenHash)
    console.log(`[MAIL/SMS] Reset token for ${identifier}: ${rawToken}`)
  }
  return res.json({ message: 'Agar account exist karta hai toh reset instructions bhej diye gaye hain.' })
})

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body
  if (!token || !password || password.length < 8) return res.status(422).json({ message: 'Token aur valid password required hai.' })

  const records = db.prepare('SELECT * FROM password_reset_tokens WHERE used_at IS NULL').all()
  const record = records.find(r => bcrypt.compareSync(token, r.token))
  if (!record) return res.status(422).json({ message: 'Invalid token.' })

  const createdAt = new Date(record.created_at)
  if (Date.now() - createdAt.getTime() > 60 * 60 * 1000) return res.status(422).json({ message: 'Reset link expire ho gaya.' })

  const field = record.email ? 'email' : 'phone'
  const value = record.email || record.phone
  const passwordHash = bcrypt.hashSync(password, 12)
  db.prepare(`UPDATE users SET password = ?, updated_at = ? WHERE ${field} = ?`).run(passwordHash, new Date().toISOString(), value)
  db.prepare('UPDATE password_reset_tokens SET used_at = ? WHERE id = ?').run(new Date().toISOString(), record.id)
  return res.json({ message: 'Password successfully reset ho gaya.' })
})

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  return res.json({ message: 'Logout successful.' })
})

module.exports = router
