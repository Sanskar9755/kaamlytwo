import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getMessages, getConversations, uploadPhoto } from '../services/chatService'
import * as chatSocket from '../socket/chatSocket'
import type { Message } from '../types/chat'
import ReviewModal from '../components/ReviewModal'
import * as reviewService from '../services/reviewService'

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Aaj'
  if (d.toDateString() === yesterday.toDateString()) return 'Kal'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const convId = parseInt(conversationId || '0')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [photoLoading, setPhotoLoading] = useState(false)
  const [disconnected, setDisconnected] = useState(false)
  const [reconnectFailed, setReconnectFailed] = useState(false)
  const [otherUserName, setOtherUserName] = useState<string>((location.state as { name?: string })?.name || '')
  const [workerUserId, setWorkerUserId] = useState<number | null>(null)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMessages(convId)
      .then(r => setMessages(r.messages))
      .catch(() => {})
      .finally(() => setLoading(false))

    // Fetch conversation info: other user name + worker_user_id + review status
    getConversations().then(r => {
      const conv = r.conversations.find(c => c.id === convId)
      if (conv?.other_user?.name) setOtherUserName(conv.other_user.name)
      if (conv && user) {
        const wUserId = conv.other_user.id
        setWorkerUserId(wUserId)
        reviewService.getWorkerReviews(wUserId).then(res => {
          const alreadyReviewed = res.reviews.some(rv => rv.reviewer_user_id === user.id)
          setHasReviewed(alreadyReviewed)
        }).catch(() => {})
      }
    }).catch(() => {})

    chatSocket.connect()
    chatSocket.joinConversation(convId)
    chatSocket.markRead(convId)

    const handleNewMessage = (msg: Message) => setMessages(prev => [...prev, msg])
    chatSocket.onNewMessage(handleNewMessage)
    chatSocket.onDisconnect(() => setDisconnected(true))
    chatSocket.onReconnectFailed(() => { setDisconnected(false); setReconnectFailed(true) })

    return () => {
      chatSocket.offNewMessage(handleNewMessage)
      chatSocket.disconnect()
    }
  }, [convId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    chatSocket.sendMessage(convId, trimmed)
    setText('')
    inputRef.current?.focus()
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoLoading(true)
    try {
      const res = await uploadPhoto(convId, file)
      setMessages(prev => [...prev, res.message])
    } catch {}
    finally {
      setPhotoLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!workerUserId) return
    await reviewService.createReview(workerUserId, rating, comment)
    setHasReviewed(true)
    setShowReviewModal(false)
  }

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = []
  messages.forEach(msg => {
    const d = formatDate(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.date === d) last.msgs.push(msg)
    else grouped.push({ date: d, msgs: [msg] })
  })

  const initials = (otherUserName || 'U').trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f0f2f5', fontFamily: 'system-ui,sans-serif', maxWidth: 700, margin: '0 auto', position: 'relative' }}>

      {/* ReviewModal */}
      {showReviewModal && workerUserId && (
        <ReviewModal
          workerUserId={workerUserId}
          workerName={otherUserName || 'Worker'}
          onSubmit={handleReviewSubmit}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 15, flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, color: '#fff', fontWeight: 800, fontSize: 16 }}>{otherUserName || 'Loading...'}</p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Online</p>
        </div>
        {workerUserId && workerUserId !== user?.id && !hasReviewed && (
          <button
            onClick={() => setShowReviewModal(true)}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '7px 12px', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, flexShrink: 0 }}
          >⭐ Review</button>
        )}
      </div>

      {/* Banners */}
      {disconnected && !reconnectFailed && (
        <div style={{ background: '#fef3c7', color: '#92400e', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>⚠️ Connection toot gayi. Reconnect ho raha hai...</div>
      )}
      {reconnectFailed && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          ❌ Chat connect nahi ho pa raha.
          <button
            onClick={() => { setReconnectFailed(false); setDisconnected(false); chatSocket.disconnect(); chatSocket.connect(); chatSocket.joinConversation(convId); }}
            style={{ background: '#991b1b', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >Retry</button>
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #7c3aed', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Koi message nahi. Pehla message bhejo!</p>
          </div>
        )}

        {grouped.map(group => (
          <div key={group.date}>
            {/* Date separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ background: '#e2e8f0', color: '#64748b', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{group.date}</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {group.msgs.map((msg, i) => {
              const isOwn = msg.sender_id === user?.id
              const prevMsg = i > 0 ? group.msgs[i - 1] : null
              const showAvatar = !isOwn && (!prevMsg || prevMsg.sender_id !== msg.sender_id)

              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 3, alignItems: 'flex-end', gap: 6 }}>
                  {/* Other user avatar placeholder */}
                  {!isOwn && (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: showAvatar ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 900, flexShrink: 0, marginBottom: 2 }}>
                      {showAvatar ? initials : ''}
                    </div>
                  )}

                  <div style={{ maxWidth: '68%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      background: isOwn ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : '#fff',
                      color: isOwn ? '#fff' : '#1e293b',
                      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: msg.type === 'image' ? '4px' : '10px 14px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      fontSize: 14,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}>
                      {msg.type === 'image' && msg.photo_url
                        ? <img src={msg.photo_url} alt="photo" style={{ maxWidth: 220, maxHeight: 220, borderRadius: 14, display: 'block', objectFit: 'cover' }} />
                        : <span>{msg.content}</span>
                      }
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, paddingLeft: 4, paddingRight: 4 }}>
                      {formatTime(msg.created_at)}
                      {isOwn && <span style={{ marginLeft: 4, color: msg.is_read ? '#7c3aed' : '#94a3b8' }}>{msg.is_read ? '✓✓' : '✓'}</span>}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ background: '#fff', borderTop: '1px solid #e2e8f0', padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, boxShadow: '0 -2px 8px rgba(0,0,0,0.05)' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={photoLoading}
          style={{ background: '#f5f3ff', color: '#7c3aed', border: '1.5px solid #ddd6fe', borderRadius: '50%', width: 40, height: 40, cursor: photoLoading ? 'not-allowed' : 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: photoLoading ? 0.6 : 1 }}
        >{photoLoading ? '⏳' : '📎'}</button>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Message likho..."
          style={{ flex: 1, padding: '10px 16px', border: '1.5px solid #e2e8f0', borderRadius: 24, fontSize: 14, outline: 'none', background: '#f8fafc', color: '#1e293b', transition: 'border-color 0.2s' }}
          onFocus={e => e.target.style.borderColor = '#c4b5fd'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{ background: text.trim() ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : '#e2e8f0', color: text.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: text.trim() ? 'pointer' : 'not-allowed', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s', boxShadow: text.trim() ? '0 2px 8px rgba(124,58,237,0.4)' : 'none' }}
        >➤</button>

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
      </div>
    </div>
  )
}
