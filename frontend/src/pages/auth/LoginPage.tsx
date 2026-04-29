import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import * as authService from '../../services/authService'

const schema = z.object({
  identifier: z.string().trim().min(1, 'Please enter your email or phone number'),
  password: z.string().min(1, 'Please enter your password'),
})
type F = z.infer<typeof schema>

const inp = (err?: boolean): React.CSSProperties => ({
  width: '100%', padding: '13px 16px',
  border: `1.5px solid ${err ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)'}`,
  borderRadius: 14, fontSize: 15, outline: 'none',
  background: err ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.06)',
  color: '#fff', boxSizing: 'border-box',
  transition: 'all 0.2s',
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [apiError, setApiError] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) })

  const onSubmit = async (v: F) => {
    setApiError('')
    try {
      const res = await authService.login(v.identifier, v.password)
      login(res.token, res.user, rememberMe)
      navigate('/intent')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setApiError(err?.response?.data?.message ?? 'Login failed. Please try again.')
    }
  }

  return (
    <AuthLayout>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>Welcome Back 👋</h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 28px' }}>Sign in to your account</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email or Phone</label>
          <input {...register('identifier')} type="text" placeholder="email@example.com or 03001234567"
            style={inp(!!errors.identifier)}
            onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
            onBlur={e => e.target.style.borderColor = errors.identifier ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)'}
          />
          {errors.identifier && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>⚠️ {errors.identifier.message}</p>}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
            <Link to="/forgot-password" style={{ fontSize: 12, color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••"
              style={{ ...inp(!!errors.password), paddingRight: 48 }}
              onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
              onBlur={e => e.target.style.borderColor = errors.password ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)'}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>⚠️ {errors.password.message}</p>}
        </div>

        {apiError && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 13 }}>
            ❌ {apiError}
          </div>
        )}

        {/* Remember Me */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <div
            onClick={() => setRememberMe(v => !v)}
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${rememberMe ? '#7c3aed' : 'rgba(255,255,255,0.25)'}`,
              background: rememberMe ? '#7c3aed' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', cursor: 'pointer'
            }}
          >
            {rememberMe && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, lineHeight: 1 }}>✓</span>}
          </div>
          <span
            onClick={() => setRememberMe(v => !v)}
            style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}
          >
            Remember me
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            {rememberMe ? 'Stay signed in' : 'Sign out on close'}
          </span>
        </label>

        <button type="submit" disabled={isSubmitting}
          style={{ background: isSubmitting ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: 4, boxShadow: isSubmitting ? 'none' : '0 0 24px rgba(124,58,237,0.5)', transition: 'all 0.2s' }}>
          {isSubmitting ? '⏳ Signing in...' : 'Sign In →'}
        </button>
      </form>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#a78bfa', fontWeight: 700, textDecoration: 'none' }}>Create Account ✨</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
