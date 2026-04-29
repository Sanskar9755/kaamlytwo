import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchWorkers } from '../services/workerService'
import { getCategories } from '../services/profileService'
import { createOrGetConversation } from '../services/chatService'
import { unlockChat, checkUnlocked } from '../services/paymentService'
import { useAuth } from '../context/AuthContext'
import type { WorkerResult } from '../types/worker'
import type { Category } from '../types/profile'
import LocationAutocomplete from '../components/location/LocationAutocomplete'
import StarRating from '../components/StarRating'
import apiClient from '../lib/axios'

// ─── Quick Profile Modal ──────────────────────────────────────────────────────
function QuickProfileModal({ onDone, onClose }: { onDone: (name: string) => void; onClose: () => void }) {
  const { user, login } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) { setError('Please enter your name (min 2 characters).'); return }
    setLoading(true)
    try {
      await apiClient.put('/profile', { name: name.trim(), skills: [] })
      if (user) login(localStorage.getItem('kaamlytwo_token') || '', { ...user, name: name.trim() })
      onDone(name.trim())
    } catch { onDone(name.trim()) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 480, boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#1e293b' }}>Quick Setup</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Just your name to continue</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Your Name</label>
          <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder="Enter your name" autoFocus
            style={{ width: '100%', padding: '14px', border: `1.5px solid ${error ? '#f87171' : '#e2e8f0'}`, borderRadius: 14, fontSize: 16, outline: 'none', background: '#faf5ff', color: '#1e293b', boxSizing: 'border-box' }} />
          {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {error}</p>}
        </div>
        <button onClick={handleSave} disabled={loading}
          style={{ width: '100%', padding: '14px', background: loading ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 10 }}>
          {loading ? '⏳ Saving...' : 'Continue →'}
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱', desc: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Card', icon: '💳', desc: 'Credit / Debit Card' },
  { id: 'wallet', label: 'Wallet', icon: '👛', desc: 'Paytm, Amazon Pay' },
]

function PaymentModal({ worker, onSuccess, onClose }: {
  worker: WorkerResult
  onSuccess: () => void
  onClose: () => void
}) {
  const [selectedMethod, setSelectedMethod] = useState('upi')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'select' | 'processing' | 'success'>('select')

  const handlePay = async () => {
    setStep('processing')
    setLoading(true)
    try {
      // Simulate payment processing delay
      await new Promise(r => setTimeout(r, 2000))
      await unlockChat(worker.user_id, selectedMethod)
      setStep('success')
      setTimeout(() => onSuccess(), 1500)
    } catch {
      setStep('select')
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 480, boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}>

        {step === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: '#1e293b' }}>Chat Unlocked!</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Opening chat with {worker.name}...</p>
          </div>
        ) : step === 'processing' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: 56, height: 56, border: '4px solid #ede9fe', borderTop: '4px solid #7c3aed', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#1e293b' }}>Processing Payment...</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Please wait</p>
          </div>
        ) : (
          <>
            {/* Worker info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px', background: '#f8f7ff', borderRadius: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                {worker.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#1e293b' }}>{worker.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{worker.skills[0]?.name || 'Worker'} • {worker.location || 'Nearby'}</p>
              </div>
            </div>

            {/* Price */}
            <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, textAlign: 'center', border: '1.5px solid #c4b5fd' }}>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>Unlock Contact Fee</p>
              <p style={{ margin: 0, fontSize: 40, fontWeight: 900, color: '#7c3aed' }}>₹10</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>One-time • Permanent access • Instant chat</p>
            </div>

            {/* Payment methods */}
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Select Payment Method</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: `2px solid ${selectedMethod === m.id ? '#7c3aed' : '#e2e8f0'}`, borderRadius: 14, background: selectedMethod === m.id ? '#f5f3ff' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 24 }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: selectedMethod === m.id ? '#7c3aed' : '#1e293b' }}>{m.label}</p>
                    <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{m.desc}</p>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selectedMethod === m.id ? '#7c3aed' : '#e2e8f0'}`, background: selectedMethod === m.id ? '#7c3aed' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedMethod === m.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                  </div>
                </button>
              ))}
            </div>

            <button onClick={handlePay} disabled={loading}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', marginBottom: 10, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
              💳 Pay ₹10 & Start Chat
            </button>
            <button onClick={onClose} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── WorkerCard ───────────────────────────────────────────────────────────────
function WorkerCard({ worker, onContact, contactLoading, isUnlocked }: {
  worker: WorkerResult
  onContact: () => void
  contactLoading: boolean
  isUnlocked: boolean
}) {
  const initials = worker.name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const s = worker.skills[0]
  return (
    <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
        {worker.photo_url
          ? <img src={worker.photo_url} alt={worker.name} style={{ width: 60, height: 60, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 900, flexShrink: 0 }}>{initials}</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 3px', fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{worker.name}</p>
          <StarRating rating={worker.avg_rating} count={worker.review_count} size="sm" />
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>📍 {worker.location ?? 'Location not provided'}</p>
        </div>
        {isUnlocked && <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🔓 Unlocked</span>}
      </div>
      {s && (
        <div style={{ margin: '0 12px 8px', background: '#faf5ff', borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{s.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{s.rate_unit_label} • {s.experience_level ? s.experience_level.charAt(0).toUpperCase() + s.experience_level.slice(1) : ''}</p>
            </div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#7c3aed' }}>₹{s.rate}</p>
          </div>
          {s.sub_skills && s.sub_skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
              {s.sub_skills.slice(0, 3).map(ss => (
                <span key={ss.id} style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{ss.name}</span>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: '0 12px 14px' }}>
        <button onClick={onContact} disabled={contactLoading}
          style={{ width: '100%', padding: '12px', background: contactLoading ? '#c4b5fd' : isUnlocked ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: contactLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {contactLoading
            ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style> Connecting...</>
            : isUnlocked ? '💬 Open Chat' : '🔒 Unlock & Chat — ₹10'}
        </button>
      </div>
    </div>
  )
}

export default function CustomerSearchPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [location, setLocation] = useState('')
  const [sort, setSort] = useState('rating')
  const [workers, setWorkers] = useState<WorkerResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [valErr, setValErr] = useState('')
  const [searched, setSearched] = useState(false)
  const [contactLoading, setContactLoading] = useState<Record<number, boolean>>({})
  const [unlockedWorkers, setUnlockedWorkers] = useState<Set<number>>(new Set())

  // Modal states
  const [quickProfileWorker, setQuickProfileWorker] = useState<WorkerResult | null>(null)
  const [paymentWorker, setPaymentWorker] = useState<WorkerResult | null>(null)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  const categorySkills = categories.find(c => c.name === selectedCategory)?.skills || []

  const handleSearch = async () => {
    setValErr(''); setError('')
    if (!selectedCategory && !selectedSkill && !location.trim()) {
      setValErr('Please select a category, skill, or enter a location.')
      return
    }
    setLoading(true); setSearched(true)
    try {
      const r = await searchWorkers({ category: selectedCategory, skill: selectedSkill, location, sort })
      setWorkers(r.workers)
      // Check unlock status for all workers
      const unlockChecks = await Promise.allSettled(
        r.workers.map(w => checkUnlocked(w.user_id))
      )
      const newUnlocked = new Set<number>()
      r.workers.forEach((w, i) => {
        const result = unlockChecks[i]
        if (result.status === 'fulfilled' && result.value.unlocked) {
          newUnlocked.add(w.user_id)
        }
      })
      setUnlockedWorkers(newUnlocked)
    } catch { setError('Search failed. Please try again.'); setWorkers([]) }
    finally { setLoading(false) }
  }

  const startChat = async (worker: WorkerResult) => {
    setContactLoading(prev => ({ ...prev, [worker.id]: true }))
    try {
      const res = await createOrGetConversation(worker.user_id)
      navigate('/chat/' + res.conversation.id, { state: { name: worker.name } })
    } catch {
      // ignore
    } finally {
      setContactLoading(prev => ({ ...prev, [worker.id]: false }))
    }
  }

  const handleContact = (worker: WorkerResult) => {
    // Already unlocked - go directly to chat
    if (unlockedWorkers.has(worker.user_id)) {
      startChat(worker)
      return
    }
    // Need name first
    if (!user?.name || user.name.trim().length < 2) {
      setQuickProfileWorker(worker)
      return
    }
    // Show payment screen
    setPaymentWorker(worker)
  }

  const selectStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', background: '#faf5ff', color: '#1e293b', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff', fontFamily: 'system-ui,sans-serif' }}>

      {/* Quick Profile Modal */}
      {quickProfileWorker && (
        <QuickProfileModal
          onDone={() => { const w = quickProfileWorker; setQuickProfileWorker(null); setPaymentWorker(w) }}
          onClose={() => setQuickProfileWorker(null)}
        />
      )}

      {/* Payment Modal */}
      {paymentWorker && (
        <PaymentModal
          worker={paymentWorker}
          onSuccess={() => {
            const w = paymentWorker
            setPaymentWorker(null)
            setUnlockedWorkers(prev => new Set([...prev, w.user_id]))
            startChat(w)
          }}
          onClose={() => setPaymentWorker(null)}
        />
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 20, flex: 1 }}>Find Workers</span>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>🏠 Home</button>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Search Form */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px 16px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Category</label>
            <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedSkill('') }} style={selectStyle}>
              <option value="">-- All Categories --</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          {selectedCategory && categorySkills.length > 0 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Skill</label>
              <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} style={selectStyle}>
                <option value="">-- All Skills in {selectedCategory} --</option>
                {categorySkills.map(s => <option key={s.id} value={s.name}>{s.icon} {s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Location</label>
            <LocationAutocomplete value={location} onChange={setLocation} placeholder="e.g. Delhi, Jaipur..." />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Sort By</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'rating', l: '⭐ Rating' }, { v: 'price_asc', l: '💰 Price ↑' }, { v: 'price_desc', l: '💰 Price ↓' }].map(opt => (
                <button key={opt.v} type="button" onClick={() => setSort(opt.v)}
                  style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: `1.5px solid ${sort === opt.v ? '#7c3aed' : '#e2e8f0'}`, background: sort === opt.v ? '#f5f3ff' : '#fff', color: sort === opt.v ? '#7c3aed' : '#64748b', fontSize: 12, fontWeight: sort === opt.v ? 700 : 400, cursor: 'pointer' }}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>
          {valErr && <p style={{ margin: 0, color: '#dc2626', fontSize: 13, background: '#fef2f2', padding: '10px 14px', borderRadius: 10, border: '1px solid #fecaca' }}>⚠️ {valErr}</p>}
          <button onClick={handleSearch} disabled={loading}
            style={{ background: loading ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Searching...' : '🔍 Search'}
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #7c3aed', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#7c3aed', fontWeight: 600, margin: 0 }}>Searching for workers...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && error && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px', textAlign: 'center', border: '1px solid #fecaca' }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>😕</p>
            <p style={{ color: '#dc2626', fontWeight: 700, margin: '0 0 16px' }}>{error}</p>
            <button onClick={handleSearch} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Try Again</button>
          </div>
        )}

        {!loading && !error && searched && (
          workers.length > 0
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', fontWeight: 600 }}>{workers.length} worker{workers.length !== 1 ? 's' : ''} found</p>
                {workers.map(w => (
                  <WorkerCard
                    key={w.id}
                    worker={w}
                    onContact={() => handleContact(w)}
                    contactLoading={!!contactLoading[w.id]}
                    isUnlocked={unlockedWorkers.has(w.user_id)}
                  />
                ))}
              </div>
            : <div style={{ background: '#fff', borderRadius: 20, padding: '40px 20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: 40, margin: '0 0 12px' }}>🔍</p>
                <p style={{ color: '#64748b', fontWeight: 600, margin: 0 }}>No workers found. Try a different area or skill.</p>
              </div>
        )}
      </div>
    </div>
  )
}
