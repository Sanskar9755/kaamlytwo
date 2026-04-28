import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as profileService from '../services/profileService'
import { getConversations } from '../services/chatService'
import * as reviewService from '../services/reviewService'
import StarRating from '../components/StarRating'
import type { Profile } from '../types/profile'

export default function DashboardPage() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [reviewStats, setReviewStats] = useState<{ avg_rating: number; review_count: number } | null>(null)

  useEffect(() => {
    profileService.getProfile().then(r => setProfile(r.profile)).catch(() => {}).finally(() => setLoading(false))
    // Fetch unread count
    getConversations().then(r => {
      const total = r.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
      setUnreadCount(total)
    }).catch(() => {})
    // Fetch review stats
    if (user?.id) {
      reviewService.getWorkerReviews(user.id).then(r => setReviewStats(r.stats)).catch(() => {})
    }
  }, [])

  const initials = profile?.name ? profile.name.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '?'
  const skills = profile?.skills || []

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f7ff' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#7c3aed', borderRadius: '50%' }} className="blob1" />
    </div>
  )

  const card = { background: '#fff', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui,sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Animated background */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="blob1" style={{ position: 'absolute', top: '5%', left: '2%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)' }} />
        <div className="blob2" style={{ position: 'absolute', top: '45%', right: '2%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)' }} />
        <div className="blob3" style={{ position: 'absolute', bottom: '5%', left: '25%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
        <div className="blob4" style={{ position: 'absolute', top: '25%', left: '45%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)' }} />
        <div className="blob5" style={{ position: 'absolute', bottom: '25%', right: '15%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 70%)' }} />
      </div>

      {/* Navbar */}
      <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 900, fontSize: 20, color: '#7c3aed' }}>💼 KaamlyTwo</span>
          <button onClick={() => { logout(); navigate('/login') }} style={{ background: 'none', border: '1.5px solid #fca5a5', color: '#ef4444', padding: '6px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Logout</button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>

        {/* Profile Card */}
        <div style={card}>
          <div style={{ height: 100, background: 'linear-gradient(135deg,#7c3aed,#6d28d9,#4f46e5)', borderRadius: '20px 20px 0 0', position: 'relative' }}>
            <button onClick={() => navigate('/profile-setup')} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>✏️ Edit</button>
          </div>
          <div style={{ padding: '0 20px 20px', position: 'relative' }}>
            <div style={{ marginTop: -42, marginBottom: 10 }}>
              {profile?.photo_url
                ? <img src={profile.photo_url} alt={profile.name} style={{ width: 84, height: 84, borderRadius: 16, objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'block', position: 'relative', zIndex: 2 }} />
                : <div style={{ width: 84, height: 84, borderRadius: 16, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 900, position: 'relative', zIndex: 2 }}>{initials}</div>
              }
            </div>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{profile?.name ?? 'Worker'}</h1>
            {profile?.location && <p style={{ margin: '0 0 10px', color: '#64748b', fontSize: 13 }}>📍 {profile.location}</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ Verified Worker</span>
              <span style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', color: '#7c3aed', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>💼 {skills.length} Skills</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ ...card, padding: 18, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 900, color: '#7c3aed' }}>{skills.length}</p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Total Skills</p>
          </div>
          <div style={{ ...card, padding: 18, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#22c55e' }}>✓ Done</p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Profile Complete</p>
          </div>
        </div>

        {/* Rating Stats */}
        {reviewStats !== null && (
          <div style={{ ...card, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#374151' }}>My Rating</p>
              <StarRating rating={reviewStats.avg_rating} count={reviewStats.review_count} size="md" />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px', fontSize: 28, fontWeight: 900, color: '#f59e0b' }}>{reviewStats.avg_rating.toFixed(1)}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{reviewStats.review_count} reviews</p>
            </div>
          </div>
        )}

        {/* Skills */}
        <div style={card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>🛠️ My Skills</h2>
            <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{skills.length}</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {skills.length > 0 ? skills.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: '#faf5ff', borderRadius: 14, border: '1px solid #ede9fe' }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 800, color: '#1e293b', fontSize: 15 }}>{s.name}</p>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>{s.rate_unit_label}</p>
                </div>
                <p style={{ margin: 0, color: '#7c3aed', fontWeight: 900, fontSize: 18 }}>₹{s.rate}</p>
              </div>
            )) : <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>No skills added yet</p>}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => navigate('/search')} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>🔍 Find Work</button>
          <button onClick={() => navigate('/inbox')} style={{ background: 'linear-gradient(135deg,#6d28d9,#7c3aed)', color: '#fff', border: 'none', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            💬 Messages
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: '#fff', borderRadius: '50%', minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, border: '2px solid #fff', padding: '0 4px', boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/profile-setup')} style={{ background: '#fff', color: '#7c3aed', border: '2px solid #c4b5fd', borderRadius: 16, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>✏️ Edit Profile</button>
        </div>
      </div>
    </div>
  )
}
