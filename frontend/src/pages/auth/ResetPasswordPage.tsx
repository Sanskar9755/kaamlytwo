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
    if (password.length < 8 || !/\d/.test(password)) { setError('Password must be at least 8 characters and contain one number.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true); setError('')
    try { await authService.resetPassword(token, password); setSuccess(true); setTimeout(() => navigate('/login'), 3000) }
    catch (e: unknown) { const err = e as { response?: { data?: { message?: string } } }; setError(err?.response?.data?.message ?? 'Reset failed. Please try again.') }
    finally { setLoading(false) }
  }

  if (success) return (
    <AuthLayout>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎊</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: '0 0 8px' }}>Password Reset Successful!</h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>Redirecting to sign in page in 3 seconds...</p>
        <Link to="/login" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>Sign In Now</Link>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>Set New Password</h2>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>New Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', background: '#faf5ff', color: '#1e293b', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', background: '#faf5ff', color: '#1e293b', boxSizing: 'border-box' }} />
        </div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>❌ {error}</div>}
        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Resetting...' : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  )
}
