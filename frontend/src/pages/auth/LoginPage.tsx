import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import * as authService from '../../services/authService'

const schema = z.object({
  identifier: z.string().trim().min(1, 'Email ya phone number daalo'),
  password: z.string().min(1, 'Password daalo'),
})
type F = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) })

  const onSubmit = async (v: F) => {
    setApiError('')
    try {
      const res = await authService.login(v.identifier, v.password)
      login(res.token, res.user)
      navigate('/dashboard')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setApiError(err?.response?.data?.message ?? 'Login failed.')
    }
  }

  const inp = (err?: boolean): React.CSSProperties => ({
    width: '100%', padding: '12px 14px', border: `1.5px solid ${err ? '#f87171' : '#e2e8f0'}`,
    borderRadius: 12, fontSize: 15, outline: 'none', background: err ? '#fef2f2' : '#faf5ff',
    color: '#1e293b', boxSizing: 'border-box'
  })

  return (
    <AuthLayout>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>Wapas Aao! 👋</h2>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>Apne account mein login karein</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>📱 Email ya Phone</label>
          <input {...register('identifier')} type="text" placeholder="email@example.com ya 03001234567" style={inp(!!errors.identifier)} />
          {errors.identifier && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {errors.identifier.message}</p>}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>🔒 Password</label>
            <Link to="/forgot-password" style={{ fontSize: 12, color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>Bhool gaye? 🔑</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••"
              style={{ ...inp(!!errors.password), paddingRight: 48 }} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {errors.password.message}</p>}
        </div>

        {apiError && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
            ❌ {apiError}
          </div>
        )}

        <button type="submit" disabled={isSubmitting}
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: 4, boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
          {isSubmitting ? '⏳ Login ho raha hai...' : '🚀 Login Karo'}
        </button>
      </form>

      <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          Account nahi hai?{' '}
          <Link to="/register" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>Register karo ✨</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
