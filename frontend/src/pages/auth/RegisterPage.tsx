import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import AuthLayout from '../../components/auth/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import * as authService from '../../services/authService'
import type { OtpPendingResponse } from '../../types/auth'

const schema = z.object({
  name: z.string().min(2, 'Naam kam se kam 2 characters').max(100),
  identifierType: z.enum(['email', 'phone']),
  identifier: z.string().min(1, 'Email ya phone daalo'),
  password: z.string().min(8, 'Password kam se kam 8 characters').regex(/\d/, 'Password mein ek number hona chahiye'),
  confirmPassword: z.string().min(1, 'Password confirm karein'),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords match nahi kar rahe', path: ['confirmPassword'] })

type F = z.infer<typeof schema>

const inp = (err?: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px 14px', border: `1.5px solid ${err ? '#f87171' : '#e2e8f0'}`,
  borderRadius: 12, fontSize: 15, outline: 'none', background: err ? '#fef2f2' : '#faf5ff', color: '#1e293b', boxSizing: 'border-box'
})

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [apiError, setApiError] = useState('')

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema), defaultValues: { identifierType: 'email' }
  })

  const idType = watch('identifierType')
  const pw = watch('password') ?? ''
  const strength = pw.length >= 8 && /\d/.test(pw) ? 'strong' : pw.length >= 6 ? 'medium' : pw ? 'weak' : null

  const onSubmit = async (v: F) => {
    setApiError('')
    try {
      if (v.identifierType === 'phone') {
        await authService.register({ name: v.name, phone: v.identifier, password: v.password })
        navigate('/verify-otp', { state: { phone: v.identifier, name: v.name, password: v.password, purpose: 'register' } })
        return
      }
      const res = await authService.register({ name: v.name, email: v.identifier, password: v.password })
      if ('token' in res) { login(res.token, res.user); navigate('/dashboard') }
      else { const r = res as OtpPendingResponse; navigate('/verify-otp', { state: { phone: r.phone, name: v.name, password: v.password, purpose: 'register' } }) }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setApiError(err?.response?.data?.message ?? 'Registration failed.')
    }
  }

  return (
    <AuthLayout>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', margin: '0 0 4px' }}>Account Banao! 🎉</h2>
      <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>KaamlyTwo par apna safar shuru karein</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>👤 Poora Naam</label>
          <input {...register('name')} type="text" placeholder="Ali Hassan" style={inp(!!errors.name)} />
          {errors.name && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {errors.name.message}</p>}
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>Register kaise karein?</label>
          <div style={{ display: 'flex', borderRadius: 12, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
            {(['email', 'phone'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setValue('identifierType', t); setValue('identifier', '') }}
                style={{ flex: 1, padding: '10px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', background: idType === t ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : '#fff', color: idType === t ? '#fff' : '#64748b' }}>
                {t === 'email' ? '📧 Email' : '📱 Phone'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>{idType === 'email' ? '📧 Email' : '📱 Phone'}</label>
          <input {...register('identifier')} type={idType === 'email' ? 'email' : 'tel'} placeholder={idType === 'email' ? 'email@example.com' : '03001234567'} style={inp(!!errors.identifier)} />
          {errors.identifier && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {errors.identifier.message}</p>}
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>🔒 Password</label>
          <div style={{ position: 'relative' }}>
            <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••" style={{ ...inp(!!errors.password), paddingRight: 48 }} />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {errors.password.message}</p>}
          {strength && (
            <div style={{ marginTop: 6 }}>
              <div style={{ height: 4, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: strength === 'strong' ? '100%' : strength === 'medium' ? '66%' : '33%', background: strength === 'strong' ? '#22c55e' : strength === 'medium' ? '#f59e0b' : '#ef4444', transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: 11, marginTop: 2, color: strength === 'strong' ? '#16a34a' : strength === 'medium' ? '#d97706' : '#dc2626' }}>
                {strength === 'strong' ? '✅ Strong' : strength === 'medium' ? '⚠️ Medium' : '❌ Weak'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>🔐 Confirm Password</label>
          <input {...register('confirmPassword')} type="password" placeholder="••••••••" style={inp(!!errors.confirmPassword)} />
          {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠️ {errors.confirmPassword.message}</p>}
        </div>

        {apiError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>❌ {apiError}</div>}

        <button type="submit" disabled={isSubmitting} style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
          {isSubmitting ? '⏳ Register ho raha hai...' : '🎉 Register Karo'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#64748b' }}>
        Pehle se account hai? <Link to="/login" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>Login karo 🚀</Link>
      </p>
    </AuthLayout>
  )
}
