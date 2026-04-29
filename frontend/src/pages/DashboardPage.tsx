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
  const [showBanner, setShowBanner] = useState(true)
  const isHirer = localStorage.getItem('kaamlytwo_intent') === 'hire'

  useEffect(() => {
    profileService.getProfile().then(r => setProfile(r.profile)).catch(() => {}).finally(() => setLoading(false))
    getConversations().then(r => {
      const total = r.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
      setUnreadCount(total)
    }).catch(() => {})
    if (user?.id) {
      reviewService.getWorkerReviews(user.id).then(r => setReviewStats(r.stats)).catch(() => {})
    }
  }, [])

  const initials = profile?.name ? profile.name.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : (user?.name ? user.name.trim().split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : '?')
  const skills = profile?.skills || []

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0a1e' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0a1e', fontFamily: 'system-ui,sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div className="blob1" style={{ position: 'absolute', top: '-5%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="blob2" style={{ position: 'absolute', top: '40%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="blob3" style={{ position: 'absolute', bottom: '0%', left: '20%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Navbar */}
      <div style={{ background: 'rgba(15,10,30,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 900, fontSize: 20, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>💼 KaamlyTwo</span>
          <button onClick={() => { logout(); navigate('/login') }}
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '7px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.2s' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>

        {/* Hirer banner */}
        {isHirer && !profile?.is_complete && showBanner && (
          <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,191,36,0.1))', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: 14, color: '#fbbf24' }}>Complete your profile</p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(251,191,36,0.7)' }}>Add skills to get hired by customers too!</p>
            </div>
            <button onClick={() => navigate('/profile-setup')}
              style={{ background: 'rgba(245,158,11,0.3)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              Setup
            </button>
            <button onClick={() => setShowBanner(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(251,191,36,0.6)', cursor: 'pointer', fontSize: 18, padding: 0, flexShrink: 0 }}>✕</button>
          </div>
        )}

        {/* Profile Card */}
        <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, overflow: 'hidden' }}>
          {/* Cover */}
          <div style={{ height: 110, background: 'linear-gradient(135deg,#7c3aed,#4f46e5,#06b6d4)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
            <button onClick={() => navigate('/profile-setup')}
              style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '6px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
              ✏️ Edit
            </button>
          </div>
          <div style={{ padding: '0 20px 20px', position: 'relative' }}>
            <div style={{ marginTop: -44, marginBottom: 12 }}>
              {profile?.photo_url
                ? <img src={profile.photo_url} alt={profile.name} style={{ width: 88, height: 88, borderRadius: 20, objectFit: 'cover', border: '4px solid rgba(15,10,30,1)', boxShadow: '0 0 24px rgba(124,58,237,0.5)', display: 'block' }} />
                : <div style={{ width: 88, height: 88, borderRadius: 20, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: '4px solid rgba(15,10,30,1)', boxShadow: '0 0 24px rgba(124,58,237,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30, fontWeight: 900 }}>{initials}</div>
              }
            </div>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#fff' }}>{profile?.name ?? user?.name ?? 'User'}</h1>
            {profile?.location && <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>📍 {profile.location}</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✅ Verified</span>
              <span style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>💼 {skills.length} Skills</span>
              {isHirer && <span style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>🔍 Hirer</span>}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.15))', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: 18, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{skills.length}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Total Skills</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(16,185,129,0.1))', backdropFilter: 'blur(20px)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: 18, textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#4ade80' }}>✓ Active</p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Profile Status</p>
          </div>
        </div>

        {/* Rating */}
        {reviewStats !== null && (
          <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,191,36,0.1))', backdropFilter: 'blur(20px)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>My Rating</p>
              <StarRating rating={reviewStats.avg_rating} count={reviewStats.review_count} size="md" />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px', fontSize: 32, fontWeight: 900, color: '#fbbf24' }}>{reviewStats.avg_rating.toFixed(1)}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{reviewStats.review_count} reviews</p>
            </div>
          </div>
        )}

        {/* Skills */}
        <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff' }}>🛠️ My Skills</h2>
            <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid rgba(124,58,237,0.3)' }}>{skills.length}</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {skills.length > 0 ? skills.map((s, i) => {
              const colors = [
                { bg: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.3)', icon: 'rgba(124,58,237,0.3)', rate: '#a78bfa' },
                { bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.25)', icon: 'rgba(6,182,212,0.25)', rate: '#22d3ee' },
                { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: 'rgba(16,185,129,0.25)', rate: '#34d399' },
                { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: 'rgba(245,158,11,0.25)', rate: '#fbbf24' },
                { bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.25)', icon: 'rgba(236,72,153,0.25)', rate: '#f472b6' },
              ]
              const c = colors[i % colors.length]
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: c.bg, borderRadius: 16, border: `1px solid ${c.border}` }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: c.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 800, color: '#fff', fontSize: 14 }}>{s.name}</p>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{s.rate_unit_label}</p>
                  </div>
                  <p style={{ margin: 0, color: c.rate, fontWeight: 900, fontSize: 18 }}>₹{s.rate}</p>
                </div>
              )
            }) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, margin: 0 }}>No skills added yet</p>
                <button onClick={() => navigate('/profile-setup')} style={{ marginTop: 12, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Add Skills →</button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => navigate('/search')}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 18, padding: 18, fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 30px rgba(124,58,237,0.4)', transition: 'all 0.2s' }}>
            🔍 Find Work
          </button>
          <button onClick={() => navigate('/inbox')}
            style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(79,70,229,0.2))', color: '#fff', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 18, padding: 18, fontSize: 16, fontWeight: 800, cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backdropFilter: 'blur(10px)' }}>
            💬 Messages
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -6, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', borderRadius: '50%', minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, border: '2px solid #0f0a1e', padding: '0 4px', boxShadow: '0 0 12px rgba(239,68,68,0.6)' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/profile-setup')}
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            ✏️ Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
}
