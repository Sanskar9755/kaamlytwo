import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const INTENT_KEY = 'kaamlytwo_intent'

export default function UserIntentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleIntent = (intent: 'hire' | 'work') => {
    localStorage.setItem(INTENT_KEY, intent)
    if (intent === 'hire') {
      navigate('/search')
    } else {
      navigate('/profile-setup')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f8f7ff 0%, #ede9fe 100%)',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
        padding: '28px 20px 40px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>💼</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          KaamlyTwo
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, margin: 0 }}>
          Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! What would you like to do?
        </p>
      </div>

      {/* Cards */}
      <div style={{
        flex: 1,
        maxWidth: 480,
        width: '100%',
        margin: '0 auto',
        padding: '0 16px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginTop: -20,
      }}>

        {/* Hire Card */}
        <button
          onClick={() => handleIntent('hire')}
          style={{
            background: '#fff',
            border: '2px solid #e2e8f0',
            borderRadius: 24,
            padding: '28px 24px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 4px 20px rgba(124,58,237,0.08)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 18,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#7c3aed'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(124,58,237,0.18)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(124,58,237,0.08)'
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
          }}>🔍</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#1e293b' }}>
              Hire / Find Worker
            </p>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Find skilled professionals near you — plumbers, electricians, drivers, developers and more.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['🔧 Plumber', '⚡ Electrician', '🚗 Driver', '💻 Developer'].map(tag => (
                <span key={tag} style={{ background: '#f5f3ff', color: '#7c3aed', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
          </div>
          <span style={{ color: '#7c3aed', fontSize: 22, alignSelf: 'center' }}>›</span>
        </button>

        {/* Work Card */}
        <button
          onClick={() => handleIntent('work')}
          style={{
            background: '#fff',
            border: '2px solid #e2e8f0',
            borderRadius: 24,
            padding: '28px 24px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 4px 20px rgba(16,185,129,0.08)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 18,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#10b981'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(16,185,129,0.18)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(16,185,129,0.08)'
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg,#10b981,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
          }}>🛠️</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 900, color: '#1e293b' }}>
              Register Your Work
            </p>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Offer your skills and services. Get hired by customers in your area.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['🏠 Home Services', '🚚 Transport', '💻 Digital', '🏗️ Construction'].map(tag => (
                <span key={tag} style={{ background: '#f0fdf4', color: '#059669', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
          </div>
          <span style={{ color: '#10b981', fontSize: 22, alignSelf: 'center' }}>›</span>
        </button>

        {/* Divider */}
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, margin: '4px 0' }}>
          You can change this anytime from your profile
        </div>

        {/* Dashboard link */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'transparent', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '12px', fontSize: 14, color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
        >
          Go to Dashboard →
        </button>
      </div>
    </div>
  )
}
