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
    if (!identifier.trim()) { setError('Please enter your email or phone number.'); return }
    setLoading(true); setError('')
    try { await authService.forgotPassword(identifier); setSent(true) }
    catch (e: unknown) { const err = e as { response?: { data?: { message?: string } } }; setError(err?.response?.data?.message ?? 'Something went wrong.') }
    finally { setLoading(false) }
  }

  if (sent) return (
    <AuthLayout>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32, boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}>📬</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Check Your Inbox</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 24px' }}>Reset instructions sent if account exists.</p>
        <Link to="/login" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', padding: '13px 28px', borderRadius: 14, textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>← Back to Sign In</Link>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 20px', fontSize: 24, boxShadow: '0 0 24px rgba(124,58,237,0.5)' }}>🔑</div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Reset Password</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 28px' }}>Enter your email or phone and we'll send a reset link.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email or Phone</label>
          <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="email@example.com or 03001234567"
            style={{ width: '100%', padding: '13px 16px', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 14, fontSize: 15, outline: 'none', background: 'rgba(255,255,255,0.06)', color: '#fff', boxSizing: 'border-box' }} />
          {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>⚠️ {error}</p>}
        </div>
        <button type="submit" disabled={loading}
          style={{ background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 24px rgba(124,58,237,0.5)' }}>
          {loading ? '⏳ Sending...' : 'Send Reset Link →'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
        Remembered? <Link to="/login" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
      </p>
    </AuthLayout>
  )
}
