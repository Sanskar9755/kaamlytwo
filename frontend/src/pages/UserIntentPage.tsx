import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const INTENT_KEY = 'kaamlytwo_intent'

export default function UserIntentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleIntent = (intent: 'hire' | 'work') => {
    localStorage.setItem(INTENT_KEY, intent)
    if (intent === 'hire') navigate('/search')
    else navigate('/profile-setup')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0a1e', fontFamily: 'system-ui,sans-serif', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div className="blob1" style={{ position: 'absolute', top: '-5%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="blob2" style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="blob3" style={{ position: 'absolute', top: '40%', left: '40%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg,#7c3aed,#4f46e5,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32, boxShadow: '0 0 40px rgba(124,58,237,0.6)' }}>💼</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 8px', background: 'linear-gradient(135deg,#a78bfa,#60a5fa,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, margin: 0 }}>What would you like to do today?</p>
        </div>

        {/* Cards */}
        <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Hire Card */}
          <button onClick={() => handleIntent('hire')}
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 24, padding: '28px 24px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 20, transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(124,58,237,0.7)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(124,58,237,0.25)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(124,58,237,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            {/* Glow */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#7c3aed,transparent)' }} />

            <div style={{ width: 68, height: 68, borderRadius: 20, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0, boxShadow: '0 8px 24px rgba(124,58,237,0.5)' }}>🔍</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#fff' }}>Hire / Find Worker</p>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Find skilled professionals near you instantly</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['🔧 Plumber', '⚡ Electrician', '🚗 Driver', '💻 Dev'].map(tag => (
                  <span key={tag} style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid rgba(124,58,237,0.3)' }}>{tag}</span>
                ))}
              </div>
            </div>
            <span style={{ color: '#a78bfa', fontSize: 24 }}>›</span>
          </button>

          {/* Work Card */}
          <button onClick={() => handleIntent('work')}
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 24, padding: '28px 24px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 20, transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(16,185,129,0.7)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 60px rgba(16,185,129,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(16,185,129,0.3)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#10b981,transparent)' }} />

            <div style={{ width: 68, height: 68, borderRadius: 20, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0, boxShadow: '0 8px 24px rgba(16,185,129,0.5)' }}>🛠️</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#fff' }}>Register Your Work</p>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Offer your skills and get hired by customers</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['🏠 Home', '🚚 Transport', '💻 Digital', '🏗️ Build'].map(tag => (
                  <span key={tag} style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: '1px solid rgba(16,185,129,0.3)' }}>{tag}</span>
                ))}
              </div>
            </div>
            <span style={{ color: '#34d399', fontSize: 24 }}>›</span>
          </button>

          <button onClick={() => navigate('/dashboard')}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '13px', fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}
