require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const express = require('express')
const cors = require('cors')
const path = require('path')
const rateLimit = require('express-rate-limit')

// Init DB
require('./db/init')

const app = express()
const httpServer = http.createServer(app)

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Rate limiting
const loginLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { message: 'Too many login attempts. 1 minute baad try karein.' } })
const workerLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 })

// Routes
app.use('/api/auth/login', loginLimiter)
app.use('/api/auth', require('./routes/auth'))
app.use('/api/profile', require('./routes/profile'))
app.use('/api/workers', workerLimiter, require('./routes/workers'))
app.use('/api/skills', require('./routes/skills'))

const authMiddleware = require('./middleware/auth')
app.use('/api/chat', authMiddleware, require('./routes/chat'))
app.use('/api/reviews', (req, res, next) => { if (req.method === 'POST') return authMiddleware(req, res, next); next() }, require('./routes/reviews'))

// Health check
app.get('/api', (req, res) => res.json({ message: 'KaamlyTwo API is running.', version: '1.0.0' }))

// Suppress favicon 404
app.get('/favicon.ico', (req, res) => res.status(204).end())

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error.' })
})

// Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`CORS blocked: ${origin}`))
    },
    credentials: true,
  },
})
require('./socket/index')(io)
app.set('io', io)

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => console.log(`🚀 KaamlyTwo backend running on http://localhost:${PORT}`))
