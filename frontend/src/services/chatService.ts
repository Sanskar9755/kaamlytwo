import apiClient from '../lib/axios'
import type { Conversation, Message } from '../types/chat'

export const createOrGetConversation = async (workerId: number): Promise<{ conversation: { id: number } }> => {
  const { data } = await apiClient.post<{ conversation: { id: number } }>('/chat/conversations', { worker_id: workerId })
  return data
}

export const getConversations = async (): Promise<{ conversations: Conversation[] }> => {
  const { data } = await apiClient.get<{ conversations: Conversation[] }>('/chat/conversations')
  return data
}

export const getMessages = async (
  conversationId: number,
  before?: number,
  limit?: number
): Promise<{ messages: Message[] }> => {
  const params: Record<string, number> = {}
  if (before !== undefined) params.before = before
  if (limit !== undefined) params.limit = limit
  const { data } = await apiClient.get<{ messages: Message[] }>(
    `/chat/conversations/${conversationId}/messages`,
    { params }
  )
  return data
}

export const uploadPhoto = async (conversationId: number, file: File): Promise<{ message: Message }> => {
  const formData = new FormData()
  formData.append('photo', file)
  const { data } = await apiClient.post<{ message: Message }>(
    `/chat/conversations/${conversationId}/messages/photo`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}
