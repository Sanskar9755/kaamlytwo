export interface Conversation {
  id: number
  other_user: {
    id: number
    name: string | null
    photo_url: string | null
  }
  last_message: {
    content: string | null
    type: 'text' | 'image'
    created_at: string
  } | null
  unread_count: number
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  type: 'text' | 'image'
  content: string | null
  photo_url: string | null
  is_read: number
  created_at: string
}
