import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import * as authService from '../../services/authService'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { setError('Reset token not found.'); return }
    if (password.length < 8 || !/\d/.test(password)) { setError('Password must be at least 8 characters with one number.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try { await authService.resetPassword(token, password); setSuccess(true); setTimeout(() => navigate('/login'), 3000) }
    catch (e: unknown) { const err = e as { response?: { data?: { message?: string } } }; setError(err?.response?.data?.message ?? 'Reset failed.') }
    finally { setLoading(false) }
  }

  const inpStyle = { width: '100%', padding: '13px 16px', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 14, fontSize: 15, outline: 'none', background: 'rgba(255,255,255,0.06)', color: '#fff', boxSizing: 'border-box' as const }

  if (success) return (
    <AuthLayout>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎊</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Password Reset!</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 24px' }}>Redirecting to sign in in 3 seconds...</p>
        <Link to="/login" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', padding: '13px 28px', borderRadius: 14, textDecoration: 'none', fontWeight: 700, fontSize: 14, boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>Sign In Now →</Link>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 20px', fontSize: 24, boxShadow: '0 0 24px rgba(124,58,237,0.5)' }}>🔐</div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Set New Password</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 28px' }}>Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inpStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" style={inpStyle} />
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 13 }}>❌ {error}</div>}
        <button type="submit" disabled={loading}
          style={{ background: loading ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 0 24px rgba(124,58,237,0.5)' }}>
          {loading ? '⏳ Resetting...' : 'Reset Password →'}
        </button>
      </form>
    </AuthLayout>
  )
}
