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
    if (!token) { setError('Reset token nahi mila.'); return }
    if (password.length < 8 || !/\d/.test(password)) { setError('Password kam se kam 8 characters aur ek number hona chahiye.'); return }
    if (password !== confirm) { setError('Passwords match nahi kar rahe.'); return }
    setLoading(true); setError('')
    try { await authService.resetPassword(token, password); setSuccess(true); setTimeout(() => navigate('/login'), 3000) }
    catch (e: unknown) { const err = e as { response?: { data?: { message?: string } } }; setError(err?.response?.data?.message ?? 'Reset failed.') }
    finally { setLoading(false) }
  }

  if (success) return (
    <AuthLayout>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎊</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', margin: '0 0 8px' }}>Password Reset Ho Gaya!</h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>3 seconds mein login page par redirect ho rahe hain...</p>
        <Link to="/login" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', padding: '12px 24px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>🚀 Login Karo</Link>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>Naya Password</h2>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Apna naya strong password set karein</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>🔒 Naya Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', background: '#faf5ff', color: '#1e293b', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>🔐 Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••"
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, outline: 'none', background: '#faf5ff', color: '#1e293b', boxSizing: 'border-box' }} />
        </div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>❌ {error}</div>}
        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? '⏳ Reset ho raha hai...' : '🔐 Password Reset Karo'}
        </button>
      </form>
    </AuthLayout>
  )
}
