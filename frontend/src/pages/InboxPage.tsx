import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getConversations } from '../services/chatService'
import type { Conversation } from '../types/chat'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Abhi'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

function truncate(str: string | null, len: number): string {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

export default function InboxPage() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getConversations()
      .then(r => setConversations(r.conversations))
      .catch(() => setError('Conversations load nahi ho paye.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        body { margin: 0; background: linear-gradient(160deg, #1a0533 0%, #2d1b69 35%, #0f172a 70%, #1e1b4b 100%) !important; min-height: 100vh; }
        .conv-row:hover { background: rgba(167,139,250,0.08) !important; }
        .conv-row:active { background: rgba(167,139,250,0.15) !important; transform: scale(0.99); }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '0%', right: '10%', width: 350, height: 350, borderRadius: '50%', background: 'rgba(124,58,237,0.3)', filter: 'blur(90px)' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '5%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(79,70,229,0.25)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif', maxWidth: 680, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(26,5,51,0.7)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >←</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>Messages</h1>
          </div>
          {conversations.length > 0 && (
            <span style={{ background: 'rgba(124,58,237,0.4)', border: '1px solid rgba(167,139,250,0.3)', color: '#c4b5fd', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
              {conversations.length}
            </span>
          )}
        </div>

        <div style={{ padding: '20px 16px' }}>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 36, height: 36, border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid rgba(167,139,250,0.8)', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '20px', textAlign: 'center', backdropFilter: 'blur(10px)' }}>
              <p style={{ color: '#f87171', fontWeight: 600, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && conversations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'slideUp 0.4s ease' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>💬</div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 17, margin: '0 0 8px' }}>Koi conversation nahi</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, margin: 0 }}>Kisi worker ko Contact Karo!</p>
            </div>
          )}

          {/* Conversation list */}
          {!loading && !error && conversations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, animation: 'slideUp 0.3s ease' }}>
              {conversations.map((conv) => {
                const name = conv.other_user.name || 'Unknown'
                const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                const preview = conv.last_message
                  ? conv.last_message.type === 'image' ? '📷 Photo' : truncate(conv.last_message.content, 38)
                  : 'Koi message nahi'
                const time = conv.last_message ? relativeTime(conv.last_message.created_at) : relativeTime(conv.updated_at)
                const hasUnread = conv.unread_count > 0

                return (
                  <div
                    key={conv.id}
                    className="conv-row"
                    onClick={() => navigate(`/chat/${conv.id}`, { state: { name } })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 20,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {conv.other_user.photo_url
                        ? <img src={conv.other_user.photo_url} alt={name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(167,139,250,0.3)' }} />
                        : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 800, border: '2px solid rgba(167,139,250,0.3)', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' }}>{initials}</div>
                      }
                      {/* Online dot */}
                      <div style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#22c55e', border: '2px solid rgba(26,5,51,0.8)' }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <p style={{ margin: 0, fontWeight: hasUnread ? 800 : 600, fontSize: 15, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                        <span style={{ fontSize: 11, color: hasUnread ? '#a78bfa' : 'rgba(255,255,255,0.35)', fontWeight: hasUnread ? 700 : 400, flexShrink: 0, marginLeft: 8 }}>{time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, color: hasUnread ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: hasUnread ? 600 : 400 }}>{preview}</p>
                        {hasUnread && (
                          <span style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: '#fff', borderRadius: '50%', minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0, padding: '0 4px', boxShadow: '0 2px 8px rgba(124,58,237,0.5)' }}>
                            {conv.unread_count > 99 ? '99+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16, flexShrink: 0 }}>›</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
