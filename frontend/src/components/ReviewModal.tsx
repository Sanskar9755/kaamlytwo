import { useState } from 'react'

interface ReviewModalProps {
  workerUserId: number
  workerName: string
  onSubmit: (rating: number, comment: string) => Promise<void>
  onClose: () => void
}

export default function ReviewModal({ workerName, onSubmit, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) { setError('Kripya ek rating chunein'); return }
    setError('')
    setLoading(true)
    try {
      await onSubmit(rating, comment)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Review submit nahi ho paya. Dobara try karein.')
    } finally {
      setLoading(false)
    }
  }

  const displayRating = hovered || rating

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 28, maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>⭐</div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 900, color: '#1e293b' }}>Review Likho</h2>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{workerName} ke liye</p>
        </div>

        {/* Star selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 36, color: displayRating >= star ? '#f59e0b' : '#d1d5db', padding: 0, lineHeight: 1, transition: 'color 0.15s' }}
            >
              ★
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={500}
          placeholder="Comment likhein (optional)..."
          rows={3}
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'system-ui,sans-serif', color: '#1e293b', boxSizing: 'border-box', marginBottom: 4 }}
        />
        <p style={{ margin: '0 0 16px', fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{comment.length}/500</p>

        {error && <p style={{ margin: '0 0 12px', color: '#dc2626', fontSize: 13, background: '#fef2f2', padding: '8px 12px', borderRadius: 8, border: '1px solid #fecaca' }}>⚠️ {error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: 14, background: loading ? '#c4b5fd' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {loading
            ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style> Submit ho raha hai...</>
            : '⭐ Review Submit Karo'
          }
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          style={{ width: '100%', padding: 12, background: 'transparent', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >Wapas Jao</button>
      </div>
    </div>
  )
}
