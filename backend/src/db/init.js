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

  -- Categories (Home Services, Transport, etc.)
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Skills belong to a category
  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    rate_unit TEXT NOT NULL,
    rate_unit_label TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  -- Sub-skills belong to a skill
  CREATE TABLE IF NOT EXISTS sub_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
  );

  -- Profile skills with experience level and sub-skills
  CREATE TABLE IF NOT EXISTS profile_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    rate REAL NOT NULL,
    rate_type TEXT NOT NULL DEFAULT 'per_hour',
    experience_level TEXT NOT NULL DEFAULT 'beginner',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(profile_id, skill_id),
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
  );

  -- Selected sub-skills per profile_skill
  CREATE TABLE IF NOT EXISTS profile_sub_skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_skill_id INTEGER NOT NULL,
    sub_skill_id INTEGER NOT NULL,
    UNIQUE(profile_skill_id, sub_skill_id),
    FOREIGN KEY (profile_skill_id) REFERENCES profile_skills(id) ON DELETE CASCADE,
    FOREIGN KEY (sub_skill_id) REFERENCES sub_skills(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
  CREATE INDEX IF NOT EXISTS idx_profiles_is_complete ON profiles(is_complete);
  CREATE INDEX IF NOT EXISTS idx_otps_identifier ON otps(identifier);
  CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category_id);
  CREATE INDEX IF NOT EXISTS idx_sub_skills_skill ON sub_skills(skill_id);

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

  -- Unlocked chats (payment gating)
  CREATE TABLE IF NOT EXISTS unlocked_chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    amount INTEGER NOT NULL DEFAULT 10,
    payment_method TEXT NOT NULL DEFAULT 'simulated',
    payment_ref TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(customer_id, worker_id),
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_unlocked_chats_customer ON unlocked_chats(customer_id);
`)

// Migrate: add columns if missing (for existing DBs)
try { db.exec(`ALTER TABLE profile_skills ADD COLUMN rate_type TEXT NOT NULL DEFAULT 'per_hour'`) } catch {}
try { db.exec(`ALTER TABLE profile_skills ADD COLUMN experience_level TEXT NOT NULL DEFAULT 'beginner'`) } catch {}
try { db.exec(`ALTER TABLE skills ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL`) } catch {}

// Seed categories and skills
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()
if (catCount.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)')
  const insertSkill = db.prepare('INSERT INTO skills (category_id, name, icon, rate_unit, rate_unit_label) VALUES (?, ?, ?, ?, ?)')
  const insertSub = db.prepare('INSERT INTO sub_skills (skill_id, name) VALUES (?, ?)')

  // 1. Home Services
  const cat1 = insertCat.run('Home Services', '🏠', 1).lastInsertRowid
  const s1 = insertSkill.run(cat1, 'Plumber', '🔧', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s1, 'Pipe Fitting'); insertSub.run(s1, 'Leakage Repair'); insertSub.run(s1, 'Bathroom Setup')
  const s2 = insertSkill.run(cat1, 'Carpenter', '🪚', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s2, 'Furniture Making'); insertSub.run(s2, 'Door Repair'); insertSub.run(s2, 'Cabinet Work')
  const s3 = insertSkill.run(cat1, 'House Cleaner', '🧹', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s3, 'Regular Cleaning'); insertSub.run(s3, 'Deep Cleaning'); insertSub.run(s3, 'Kitchen Cleaning')
  const s4 = insertSkill.run(cat1, 'AC Technician', '❄️', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s4, 'AC Repair'); insertSub.run(s4, 'AC Installation'); insertSub.run(s4, 'AC Service / Gas Refill')
  const s5 = insertSkill.run(cat1, 'RO / Water Purifier', '💧', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s5, 'RO Installation'); insertSub.run(s5, 'Filter Change'); insertSub.run(s5, 'Repair')
  const s6 = insertSkill.run(cat1, 'Appliance Repair', '🔌', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s6, 'Fridge Repair'); insertSub.run(s6, 'Washing Machine Repair'); insertSub.run(s6, 'Microwave Repair')

  // 2. Transport & Delivery
  const cat2 = insertCat.run('Transport & Delivery', '🚚', 2).lastInsertRowid
  const s7 = insertSkill.run(cat2, 'Delivery Boy', '📦', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s7, 'Food Delivery'); insertSub.run(s7, 'Parcel Delivery'); insertSub.run(s7, 'Grocery Delivery')
  const s8 = insertSkill.run(cat2, 'Truck / Tempo Driver', '🚛', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s8, 'Goods Transport'); insertSub.run(s8, 'House Shifting'); insertSub.run(s8, 'Commercial Transport')
  const s9 = insertSkill.run(cat2, 'Bike Rider', '🏍️', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s9, 'Pickup / Drop'); insertSub.run(s9, 'Courier Service'); insertSub.run(s9, 'Delivery')
  const s10 = insertSkill.run(cat2, 'Car Driver', '🚗', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s10, 'Personal Driver'); insertSub.run(s10, 'Airport Drop'); insertSub.run(s10, 'Outstation')

  // 3. Technical & Repair
  const cat3 = insertCat.run('Technical & Repair', '🔩', 3).lastInsertRowid
  const s11 = insertSkill.run(cat3, 'Electrician', '⚡', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s11, 'Wiring'); insertSub.run(s11, 'Inverter Setup'); insertSub.run(s11, 'Solar Panel'); insertSub.run(s11, 'Fan / Light Fitting')
  const s12 = insertSkill.run(cat3, 'Mobile Repair', '📱', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s12, 'Screen Repair'); insertSub.run(s12, 'Battery Replacement'); insertSub.run(s12, 'Software Issue')
  const s13 = insertSkill.run(cat3, 'Laptop / Computer Repair', '💻', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s13, 'Hardware Repair'); insertSub.run(s13, 'Software / OS Install'); insertSub.run(s13, 'Data Recovery')
  const s14 = insertSkill.run(cat3, 'CCTV Installation', '📷', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s14, 'Camera Installation'); insertSub.run(s14, 'DVR Setup'); insertSub.run(s14, 'Maintenance')
  const s15 = insertSkill.run(cat3, 'Internet / WiFi Setup', '📡', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s15, 'Router Setup'); insertSub.run(s15, 'Network Troubleshooting'); insertSub.run(s15, 'Cable Wiring')

  // 4. Digital & Freelance
  const cat4 = insertCat.run('Digital & Freelance', '💻', 4).lastInsertRowid
  const s16 = insertSkill.run(cat4, 'Developer', '👨‍💻', 'per_hour', 'Rs per hour').lastInsertRowid
  insertSub.run(s16, 'Web Development'); insertSub.run(s16, 'App Development'); insertSub.run(s16, 'Backend / API')
  const s17 = insertSkill.run(cat4, 'Graphic Designer', '🎨', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s17, 'Logo Design'); insertSub.run(s17, 'Banner / Poster'); insertSub.run(s17, 'Social Media Graphics')
  const s18 = insertSkill.run(cat4, 'Video Editor', '🎬', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s18, 'Reels / Shorts'); insertSub.run(s18, 'YouTube Videos'); insertSub.run(s18, 'Wedding Video')
  const s19 = insertSkill.run(cat4, 'Social Media Manager', '📲', 'per_month', 'Rs per month').lastInsertRowid
  insertSub.run(s19, 'Ads Management'); insertSub.run(s19, 'Content Creation'); insertSub.run(s19, 'Page Management')
  const s20 = insertSkill.run(cat4, 'Data Entry', '📊', 'per_hour', 'Rs per hour').lastInsertRowid
  insertSub.run(s20, 'Excel / Sheets'); insertSub.run(s20, 'Form Filling'); insertSub.run(s20, 'Data Processing')
  const s21 = insertSkill.run(cat4, 'Content Writer', '✍️', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s21, 'Blog Writing'); insertSub.run(s21, 'Product Description'); insertSub.run(s21, 'Script Writing')

  // 5. Construction & Labor
  const cat5 = insertCat.run('Construction & Labor', '🏗️', 5).lastInsertRowid
  const s22 = insertSkill.run(cat5, 'Mason (Raj Mistri)', '🧱', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s22, 'Wall Construction'); insertSub.run(s22, 'Plastering'); insertSub.run(s22, 'Brick Work')
  const s23 = insertSkill.run(cat5, 'Tile Fitter', '🪟', 'per_sqft', 'Rs per sq ft').lastInsertRowid
  insertSub.run(s23, 'Floor Tiles'); insertSub.run(s23, 'Wall Tiles'); insertSub.run(s23, 'Bathroom Tiles')
  const s24 = insertSkill.run(cat5, 'Welder', '🔥', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s24, 'Iron Welding'); insertSub.run(s24, 'Gate / Grill Work'); insertSub.run(s24, 'Steel Fabrication')
  const s25 = insertSkill.run(cat5, 'Labor / Helper', '👷', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s25, 'Construction Helper'); insertSub.run(s25, 'Loading / Unloading'); insertSub.run(s25, 'General Labor')
  const s26 = insertSkill.run(cat5, 'Contractor', '📋', 'per_task', 'Rs per task').lastInsertRowid
  insertSub.run(s26, 'Home Renovation'); insertSub.run(s26, 'Interior Work'); insertSub.run(s26, 'Full Construction')

  // 6. Personal & Daily Needs
  const cat6 = insertCat.run('Personal & Daily Needs', '👤', 6).lastInsertRowid
  const s27 = insertSkill.run(cat6, 'Cook / Chef', '👨‍🍳', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s27, 'Home Cook'); insertSub.run(s27, 'Party / Event Cook'); insertSub.run(s27, 'Tiffin Service')
  const s28 = insertSkill.run(cat6, 'Babysitter / Nanny', '👶', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s28, 'Infant Care'); insertSub.run(s28, 'Child Care'); insertSub.run(s28, 'Night Duty')
  const s29 = insertSkill.run(cat6, 'Home Tutor', '📚', 'per_hour', 'Rs per hour').lastInsertRowid
  insertSub.run(s29, 'Math'); insertSub.run(s29, 'English'); insertSub.run(s29, 'Science'); insertSub.run(s29, 'All Subjects')
  const s30 = insertSkill.run(cat6, 'Gardener', '🌿', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s30, 'Garden Maintenance'); insertSub.run(s30, 'Plant Care'); insertSub.run(s30, 'Lawn Mowing')
  const s31 = insertSkill.run(cat6, 'Security Guard', '💂', 'per_day', 'Rs per day').lastInsertRowid
  insertSub.run(s31, 'Residential Security'); insertSub.run(s31, 'Event Security'); insertSub.run(s31, 'Night Guard')

  console.log('✅ Categories, skills & sub-skills seeded')
} else {
  // Ensure existing skills have category_id set (migration for old DBs)
  const uncategorized = db.prepare('SELECT COUNT(*) as count FROM skills WHERE category_id IS NULL').get()
  if (uncategorized.count > 0) {
    console.log('ℹ️ Some skills have no category - run fresh DB for full category support')
  }
}

console.log('✅ Database initialized at', dbPath)
module.exports = db
