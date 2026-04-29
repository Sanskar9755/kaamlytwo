import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import * as profileService from '../services/profileService'

const INTENT_KEY = 'kaamlytwo_intent'

export default function ProfileCompletionGuard() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null)
  const [error, setError] = useState(false)

  const check = async () => {
    setError(false)
    // Hirers don't need full profile
    const intent = localStorage.getItem(INTENT_KEY)
    if (intent === 'hire') { setIsComplete(true); return }
    try {
      const data = await profileService.getProfile()
      setIsComplete(data.is_complete)
    } catch {
      setError(true)
    }
  }

  useEffect(() => { check() }, [])

  if (isComplete === null && !error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ color: '#64748b' }}>Could not load profile.</p>
        <button onClick={check} style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }

  return isComplete ? <Outlet /> : <Navigate to="/profile-setup" replace />
}
