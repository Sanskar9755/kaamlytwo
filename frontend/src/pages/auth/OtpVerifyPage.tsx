import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import * as authService from '../../services/authService'

interface State { phone: string; purpose: 'register' | 'forgot-password'; name?: string; password?: string; dev_otp?: string }

export default function OtpVerifyPage() {
  const navigate = useNavigate()
  const { state } = useLocation() as { state: State | null }
  const { login } = useAuth()
  const phone = state?.phone ?? ''
  const purpose = state?.purpose ?? 'register'

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [devOtp, setDevOtp] = useState(state?.dev_otp ?? '')
  const refs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  useEffect(() => { refs.current[0]?.focus() }, [])
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
      login(res.token, res.user)
      navigate('/dashboard')
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setError(err?.response?.data?.message ?? 'OTP verify nahi hua.')
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
    }
    catch (e: unknown) { const err = e as { response?: { data?: { message?: string } } }; setError(err?.response?.data?.message ?? 'Resend failed.') }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 24, padding: '36px 28px', boxShadow: '0 4px 24px rgba(124,58,237,0.1)', border: '1px solid #ede9fe', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📲</div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: '0 0 6px' }}>OTP Verify Karo</h2>
        <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 4px' }}>6-digit code bheja gaya hai</p>
        {phone && <span style={{ background: '#f5f3ff', color: '#7c3aed', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>📱 {phone}</span>}

        {devOtp && (
          <div style={{ margin: '12px 0 0', background: '#fefce8', border: '1.5px dashed #f59e0b', borderRadius: 12, padding: '10px 16px' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 600 }}>🔧 Dev Mode - Tumhara OTP:</p>
            <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 900, color: '#d97706', letterSpacing: 6 }}>{devOtp}</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '24px 0' }}>
          {digits.map((d, i) => (
            <input key={i} ref={el => { refs.current[i] = el }}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
              disabled={submitting}
              style={{ width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 900, borderRadius: 12, border: `2px solid ${d ? '#7c3aed' : '#e2e8f0'}`, background: d ? '#f5f3ff' : '#fff', color: '#7c3aed', outline: 'none' }}
            />
          ))}
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>❌ {error}</p>}
        {submitting && <p style={{ color: '#7c3aed', fontSize: 13, marginBottom: 12 }}>⏳ Verify ho raha hai...</p>}

        <div>
          {countdown > 0
            ? <p style={{ color: '#64748b', fontSize: 13 }}>Resend in <strong style={{ color: '#7c3aed' }}>{countdown}s</strong></p>
            : <button onClick={resend} style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed', padding: '8px 20px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>🔄 Resend OTP</button>
          }
        </div>
      </div>
    </div>
  )
}
