import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchWorkers } from '../services/workerService'
import { getCategories } from '../services/profileService'
import { createOrGetConversation } from '../services/chatService'
import type { WorkerResult } from '../types/worker'
import type { Category } from '../types/profile'
import LocationAutocomplete from '../components/location/LocationAutocomplete'
import StarRating from '../components/StarRating'

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ worker, onConfirm, onCancel, loading }: {
  worker: WorkerResult
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28 }}>💬</div>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#1e293b' }}>Unlock Contact</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>To start a conversation with {worker.name}</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, textAlign: 'center', border: '1.5px solid #c4b5fd' }}>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>Contact Fee</p>
          <p style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#7c3aed' }}>₹10</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>One-time payment to unlock chat</p>
        </div>
        <div style={{ marginBottom: 20 }}>
          {['💬 Direct chat access', '📷 Share photos', '🔓 Permanent unlock'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, color: '#374151' }}>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <button onClick={onConfirm} disabled={loading}
          style={{ width: '100%', padding: '14px', background: loading ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
          {loading
            ? <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style> Processing...</>
            : '💳 Pay ₹10 & Start Chat'}
        </button>
        <button onClick={onCancel} disabled={loading}
          style={{ width: '100%', padding: '12px', background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    </div>
  )
}

// ─── WorkerCard ───────────────────────────────────────────────────────────────
function WorkerCard({ worker, onContact, contactLoading }: { worker: WorkerResult; onContact: () => void; contactLoading: boolean }) {
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
      </div>
      {s && (
        <div style={{ margin: '0 12px 8px', background: '#faf5ff', borderRadius: 14, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: s.sub_skills?.length ? 8 : 0 }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{s.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>{s.rate_unit_label} • {s.experience_level ? s.experience_level.charAt(0).toUpperCase() + s.experience_level.slice(1) : ''}</p>
            </div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: '#7c3aed' }}>₹{s.rate}</p>
          </div>
          {s.sub_skills && s.sub_skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {s.sub_skills.slice(0, 3).map(ss => (
                <span key={ss.id} style={{ background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{ss.name}</span>
              ))}
              {s.sub_skills.length > 3 && <span style={{ color: '#94a3b8', fontSize: 11 }}>+{s.sub_skills.length - 3} more</span>}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: '0 12px 14px' }}>
        <button onClick={onContact} disabled={contactLoading}
          style={{ width: '100%', padding: '11px', background: contactLoading ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: contactLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {contactLoading
            ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style> Loading...</>
            : '📞 Contact'}
        </button>
      </div>
    </div>
  )
}

export default function CustomerSearchPage() {
  const navigate = useNavigate()
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
  const [contactLoading] = useState<Record<number, boolean>>({})
  const [contactError, setContactError] = useState('')
  const [paymentWorker, setPaymentWorker] = useState<WorkerResult | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  // Skills of selected category
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
    } catch { setError('Search failed. Please try again.'); setWorkers([]) }
    finally { setLoading(false) }
  }

  const handlePaymentConfirm = async () => {
    if (!paymentWorker) return
    setPaymentLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const res = await createOrGetConversation(paymentWorker.user_id)
      setPaymentWorker(null)
      navigate('/chat/' + res.conversation.id, { state: { name: paymentWorker.name } })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
      setContactError(axiosErr?.response?.data?.message || 'Payment or contact error. Please try again.')
      setPaymentWorker(null)
    } finally { setPaymentLoading(false) }
  }

  const selectStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', background: '#faf5ff', color: '#1e293b', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff', fontFamily: 'system-ui,sans-serif' }}>
      {paymentWorker && (
        <PaymentModal worker={paymentWorker} onConfirm={handlePaymentConfirm} onCancel={() => setPaymentWorker(null)} loading={paymentLoading} />
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 20, flex: 1 }}>Find Work</span>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>🏠 Home</button>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Search Form */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px 16px', boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Category selector */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Category</label>
            <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedSkill('') }} style={selectStyle}>
              <option value="">-- All Categories --</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          {/* Skill selector (shows only if category selected) */}
          {selectedCategory && categorySkills.length > 0 && (
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Skill</label>
              <select value={selectedSkill} onChange={e => setSelectedSkill(e.target.value)} style={selectStyle}>
                <option value="">-- All Skills in {selectedCategory} --</option>
                {categorySkills.map(s => <option key={s.id} value={s.name}>{s.icon} {s.name}</option>)}
              </select>
            </div>
          )}

          {/* Location */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Location</label>
            <LocationAutocomplete value={location} onChange={setLocation} placeholder="e.g. Delhi, Jaipur..." />
          </div>

          {/* Sort */}
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
                {contactError && <p style={{ margin: 0, color: '#dc2626', fontSize: 13, background: '#fef2f2', padding: '10px 14px', borderRadius: 10, border: '1px solid #fecaca' }}>⚠️ {contactError}</p>}
                {workers.map(w => <WorkerCard key={w.id} worker={w} onContact={() => { setContactError(''); setPaymentWorker(w) }} contactLoading={!!contactLoading[w.id]} />)}
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
