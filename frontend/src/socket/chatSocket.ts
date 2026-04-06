import { io, Socket } from 'socket.io-client'
import type { Message } from '../types/chat'

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || 'https://kaamlytwo.onrender.com'

let socket: Socket | null = null

export function connect() {
  if (socket?.connected) return
  socket = io(SOCKET_URL, {
    auth: { token: localStorage.getItem('kaamlytwo_token') },
    transports: ['websocket'],
    autoConnect: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  })
}

export function disconnect() {
  socket?.disconnect()
  socket = null
}

export function joinConversation(conversationId: number) {
  socket?.emit('join_conversation', { conversationId })
}

export function sendMessage(conversationId: number, content: string) {
  socket?.emit('send_message', { conversationId, content })
}

export function markRead(conversationId: number) {
  socket?.emit('mark_read', { conversationId })
}

export function onNewMessage(cb: (msg: Message) => void) {
  socket?.on('new_message', cb)
}

export function offNewMessage(cb: (msg: Message) => void) {
  socket?.off('new_message', cb)
}

export function onDisconnect(cb: () => void) {
  socket?.on('disconnect', cb)
}

export function onReconnectFailed(cb: () => void) {
  socket?.io.on('reconnect_failed', cb)
}

export function getSocket() {
  return socket
}
