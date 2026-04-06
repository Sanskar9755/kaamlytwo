import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import * as authService from '../../services/authService'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) { setError('Email ya phone daalo.'); return }
    setLoading(true); setError('')
    try { await authService.forgotPassword(identifier); setSent(true) }
    catch (e: unknown) { const err = e as { response?: { data?: { message?: string } } }; setError(err?.response?.data?.message ?? 'Kuch galat hua.') }
    finally { setLoading(false) }
  }

  if (sent) return (
    <AuthLayout>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>📬</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: '0 0 8px' }}>Check Karo!</h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>Reset instructions bhej diye gaye hain</p>
        <Link to="/login" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>← Login par wapas jao</Link>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔑</div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>Password Reset</h2>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Email ya phone daalo, hum reset link bhejenge</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>📱 Email ya Phone</label>
          <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="email@example.com ya 03001234567"
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', background: '#faf5ff', color: '#1e293b', boxSizing: 'border-box' }} />
          {error && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {error}</p>}
        </div>
        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Bhej rahe hain...' : '📨 Reset Link Bhejo'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
        Yaad aa gaya? <Link to="/login" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>Login karo 🚀</Link>
      </p>
    </AuthLayout>
  )
}
