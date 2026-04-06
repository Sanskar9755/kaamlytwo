const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Load .env if not already loaded
if (!process.env.JWT_SECRET) {
  require('dotenv').config({ path: path.join(__dirname, '../../.env') })
}

const dbDir = path.join(__dirname, '../../database')
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

const dbPath = process.env.DB_PATH
  ? path.resolve(path.join(__dirname, '../..'), process.env.DB_PATH)
  : path.join(dbDir, 'kaamlytwo.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT NOT NULL,
    email_verified_at TEXT,
    phone_verified_at TEXT,
    role TEXT NOT NULL DEFAULT 'worker',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    purpose TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    phone TEXT,
    token TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    photo_path TEXT,
    location TEXT,
    is_complete INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    rate_unit TEXT NOT NULL,
    rate_unit_label TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profile_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    rate REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(profile_id, skill_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
  CREATE INDEX IF NOT EXISTS idx_profiles_is_complete ON profiles(is_complete);
  CREATE INDEX IF NOT EXISTS idx_otps_identifier ON otps(identifier);

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(customer_id, worker_id),
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    photo_path TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_worker ON conversations(worker_id);

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_user_id INTEGER NOT NULL,
    reviewer_user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(worker_user_id, reviewer_user_id),
    FOREIGN KEY (worker_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_worker ON reviews(worker_user_id);
`)

// Seed skills
const skillCount = db.prepare('SELECT COUNT(*) as count FROM skills').get()
if (skillCount.count === 0) {
  const insertSkill = db.prepare('INSERT INTO skills (name, icon, rate_unit, rate_unit_label) VALUES (?, ?, ?, ?)')
  insertSkill.run('Electrician', '⚡', 'per_sqft', 'Rs per sq ft')
  insertSkill.run('Painter', '🎨', 'per_sqft', 'Rs per sq ft')
  insertSkill.run('Driver', '🚗', 'per_km', 'Rs per km')
  insertSkill.run('Developer', '💻', 'per_hour', 'Rs per hour')
  console.log('✅ Skills seeded')
}

console.log('✅ Database initialized at', dbPath)
module.exports = db
