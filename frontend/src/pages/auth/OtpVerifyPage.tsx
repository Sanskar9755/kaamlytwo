import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import * as authService from '../../services/authService'

interface State { phone: string; purpose: 'register' | 'forgot-password'; name?: string; password?: string; dev_otp?: string }

export default function OtpVerifyPage() {
  const navigate = useNavigate()
  const { state: navState } = useLocation() as { state: State | null }
  const { login } = useAuth()

  // Persist OTP state in sessionStorage so it survives page refresh
  const state = (() => {
    if (navState) {
      sessionStorage.setItem('otp_state', JSON.stringify(navState))
      return navState
    }
    try {
      const saved = sessionStorage.getItem('otp_state')
      return saved ? (JSON.parse(saved) as State) : null
    } catch { return null }
  })()

  const phone = state?.phone ?? ''
  const purpose = state?.purpose ?? 'register'

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [devOtp, setDevOtp] = useState(state?.dev_otp ?? '')
  const refs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  useEffect(() => {
    if (!state?.phone) { navigate('/register', { replace: true }); return }
    refs.current[0]?.focus()
  }, [state, navigate])
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const submit = useCallback(async (otp: string) => {
    if (submitting) return
    setSubmitting(true); setError('')
    try {
      const res = await authService.verifyOtp(phone, otp, purpose, state?.name, state?.password)
      sessionStorage.removeItem('otp_state')
      login(res.token, res.user)
      navigate('/intent')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err?.response?.data?.message ?? 'OTP verification failed.')
      setSubmitting(false)
      setDigits(Array(6).fill(''))
      setTimeout(() => refs.current[0]?.focus(), 50)
    }
  }, [submitting, phone, purpose, state, login, navigate])

  const handleChange = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]; next[i] = d; setDigits(next)
    if (d && i < 5) refs.current[i + 1]?.focus()
    else if (d && i === 5 && next.join('').length === 6) submit(next.join(''))
  }

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { const n = [...digits]; n[i] = ''; setDigits(n) }
      else if (i > 0) { const n = [...digits]; n[i-1] = ''; setDigits(n); refs.current[i-1]?.focus() }
    }
  }

  const resend = async () => {
    try {
      const res = await authService.resendOtp(phone, purpose)
      setCountdown(60); setDigits(Array(6).fill(''))
      if (res.dev_otp) setDevOtp(res.dev_otp)
      setTimeout(() => refs.current[0]?.focus(), 50)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err?.response?.data?.message ?? 'Failed to resend OTP.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui,sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div className="blob1" style={{ position: 'absolute', top: '-10%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="blob2" style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)', borderRadius: 28, padding: '40px 28px', boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28, boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}>📲</div>

        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>Verify OTP</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 6px' }}>Enter the 6-digit code sent to</p>
        {phone && <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid rgba(124,58,237,0.3)' }}>📱 {phone}</span>}

        {devOtp && (
          <div style={{ margin: '16px 0 0', background: 'rgba(245,158,11,0.1)', border: '1px dashed rgba(245,158,11,0.4)', borderRadius: 14, padding: '12px 16px' }}>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(251,191,36,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔧 Dev Mode — Your OTP</p>
            <p style={{ margin: '6px 0 0', fontSize: 32, fontWeight: 900, color: '#fbbf24', letterSpacing: 8 }}>{devOtp}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '28px 0' }}>
          {digits.map((d, i) => (
            <input key={i} ref={el => { refs.current[i] = el }}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              disabled={submitting}
              style={{ width: 48, height: 58, textAlign: 'center', fontSize: 24, fontWeight: 900, borderRadius: 14, border: `2px solid ${d ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.12)'}`, background: d ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)', color: d ? '#a78bfa' : '#fff', outline: 'none', transition: 'all 0.2s', boxShadow: d ? '0 0 16px rgba(124,58,237,0.3)' : 'none' }}
            />
          ))}
        </div>

        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, background: 'rgba(239,68,68,0.1)', padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>❌ {error}</p>}
        {submitting && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#a78bfa', fontSize: 13, marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, border: '2px solid rgba(167,139,250,0.3)', borderTop: '2px solid #a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Verifying...
          </div>
        )}

        <div>
          {countdown > 0
            ? <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Resend code in <strong style={{ color: '#a78bfa' }}>{countdown}s</strong></p>
            : <button onClick={resend} style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', padding: '9px 22px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>🔄 Resend OTP</button>
          }
        </div>
      </div>
    </div>
  )
}
